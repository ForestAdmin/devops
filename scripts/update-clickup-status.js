const fs = require('fs');
const axios = require('axios');

// NOTICE: GITHUB_EVENT_PATH is a path to a file where the current event payload is stored.
const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
const eventPayload = JSON.parse(file);

const statusPriorities = [
  'to do',
  'doing',
  'waiting for review',
  'in functionnal test',
  'in code review',
  'to release',
  'released',
  'closed',
];

function printError(error) {
  if (error && error.response && error.response.data && error.response.data.err) {
    console.error('Cause:', error.response.data.err);
  } else {
    console.error(error);
  }
}

function getClickUpTaskIdFromTitle(pullRequestTitle) {
  const index = pullRequestTitle.indexOf('(#') + 2;

  const clickUpTag = pullRequestTitle.substring(index);
  return clickUpTag.substring(0, clickUpTag.indexOf(')'));
}

async function updateStatusIfNecessary(taskId, currentStatus, targetStatus) {
  const currentStatusOrder = statusPriorities.indexOf(currentStatus);
  const targetStatusOrder = statusPriorities.indexOf(targetStatus);

  if (currentStatusOrder < targetStatusOrder) {
    try {
      await axios({
        method: 'PUT',
        url: `https://api.clickup.com/api/v2/task/${taskId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.CLICKUP_API_KEY,
        },
        data: {
          status: targetStatus,
        },
      });
    } catch (error) {
      console.error('Could not update status of task:', taskId);
      printError(error);
      return false;
    }

    return true;
  }

  return false;
}

function isWaitingForReview() {
  if (eventPayload.pull_request
    && eventPayload.pull_request.requested_reviewers
    && eventPayload.pull_request.requested_reviewers.length
    && eventPayload.pull_request.assignees
    && eventPayload.pull_request.assignees.length
  ) {
    const reviewerLogins = eventPayload.pull_request.requested_reviewers.map(
      (reviewer) => reviewer.login,
    );
    const assigneeLogins = eventPayload.pull_request.assignees.map(
      (assignee) => assignee.login,
    );

    return assigneeLogins.some(
      (assigneeLogin) => reviewerLogins.some(
        (reviewerLogin) => reviewerLogin === assigneeLogin,
      ),
    );
  }

  return false;
}

function isInCodeReview() {
  return eventPayload && !!eventPayload.review;
}

function isApproved() {
  if (eventPayload && eventPayload.review) {
    return eventPayload.review.state === 'APPROVED';
  }
  return false;
}

function isPullRequestEvent() {
  return eventPayload && eventPayload.pull_request && eventPayload.pull_request.title;
}

function isPushEvent() {
  return !isPullRequestEvent()
    && eventPayload
    && eventPayload.pusher
    ** eventPayload.commits.length;
}

function containsClikUpTagId(title) {
  return /\(#\w{6,}\)/gm.test(title);
}

async function fetchTask(taskId, withSubTasks = false) {
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.clickup.com/api/v2/task/${taskId}${withSubTasks ? '?subtasks=true' : ''}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.CLICKUP_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Could not fetch task:', taskId, withSubTasks ? ' with sub tasks ' : '');
    printError(error);
    return null;
  }
}

function getLowestPriorityStatus(tasks) {
  let lowestPriorityStatus = null;

  tasks.forEach((task) => {
    if (!lowestPriorityStatus) {
      lowestPriorityStatus = task.status.status;
    } else {
      const statusPriority = statusPriorities.indexOf(task.status.status);
      const lowestStatusPriority = statusPriorities.indexOf(lowestPriorityStatus);
      if (statusPriority < lowestStatusPriority) {
        lowestPriorityStatus = task.status.status;
      }
    }
  });

  return lowestPriorityStatus;
}

if (isPullRequestEvent() && containsClikUpTagId(eventPayload.pull_request.title)) {
  const clickUpTaskId = getClickUpTaskIdFromTitle(eventPayload.pull_request.title);

  let targetStatus = 'doing';
  if (isWaitingForReview()) {
    targetStatus = 'waiting for review';

    if (isInCodeReview()) {
      targetStatus = 'in code review';
    }
  }

  if (isApproved()) {
    targetStatus = 'to release';
  }


  fetchTask(clickUpTaskId)
    .then(async (task) => {
      if (!task) return;

      const wasUpdated = await updateStatusIfNecessary(
        clickUpTaskId,
        task.status.status,
        targetStatus,
      );
      if (wasUpdated && task.parent) {
        // NOTICE: If all subtask are in a process further than the parent task
        //         the parent task should be at least at the same status as the lowest
        //         status of the subtasks.
        const parentTask = await fetchTask(task.parent, true);

        if (parentTask.substasks) {
          const minimumChildStatus = getLowestPriorityStatus(parentTask.substasks);
          await updateStatusIfNecessary(
            parentTask.id,
            parentTask.status.status,
            minimumChildStatus,
          );
        }
      }
    });
} else if (isPushEvent()) {
  eventPayload.commits.forEach((commit) => {
    if (containsClikUpTagId(commit.message)) {
      const taskId = getClickUpTaskIdFromTitle(commit.message);
      fetchTask(taskId, true)
        .then(async (task) => {
          if (!task) return;

          await updateStatusIfNecessary(
            task.id,
            task.status.status,
            'released',
          );

          if (task.substasks) {
            task.subtrasks.forEach((subtask) => {
              updateStatusIfNecessary(
                subtask.id,
                subtask.status.status,
                'released',
              );
            });
          }
        });
    }
  });
}
