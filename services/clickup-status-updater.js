const fs = require('fs');
const axios = require('axios');

const TODO_STATUS = '📦TO DO';
const DOING_STATUS = '✍️DOING';
const WAITING_FOR_REVIEW_STATUS = '✋WAITING FOR REVIEW';
const IN_FUNCTIONAL_TEST_STATUS = '👮🏻‍♂️IN FUNCTIONAL TEST';
const IN_CODE_REVIEW_STATUS = '👮🏻‍♂️IN CODE REVIEW';
const TO_RELEASE_STATUS = '🚀TO RELEASE';
const RELEASED_STATUS = '🏁RELEASED';
const CLOSED_STATUS = '👻CLOSED';

const STATUS_PRIORITIES = [
  TODO_STATUS,
  DOING_STATUS,
  WAITING_FOR_REVIEW_STATUS,
  IN_FUNCTIONAL_TEST_STATUS,
  IN_CODE_REVIEW_STATUS,
  TO_RELEASE_STATUS,
  RELEASED_STATUS,
  CLOSED_STATUS,
];

function printError(error) {
  if (error && error.response && error.response.data && error.response.data.err) {
    console.error('  Cause:', error.response.data.err);
  } else {
    console.error(error);
  }
}

function getClickUpTaskIdFromTitle(pullRequestTitle) {
  const index = pullRequestTitle.indexOf('(CU-') + 4;

  const clickUpTag = pullRequestTitle.substring(index);
  return clickUpTag.substring(0, clickUpTag.indexOf(')'));
}

async function updateStatusIfNecessary(taskId, currentStatus, targetStatus) {
  const currentStatusOrder = STATUS_PRIORITIES.indexOf(currentStatus.toUpperCase());
  const targetStatusOrder = STATUS_PRIORITIES.indexOf(targetStatus.toUpperCase());

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

function isWaitingForReview(eventPayload) {
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

function isInCodeReview(eventPayload) {
  return eventPayload && !!eventPayload.review;
}

function isApproved(eventPayload) {
  if (eventPayload && eventPayload.review) {
    return eventPayload.review.state === 'APPROVED';
  }
  return false;
}

function isPullRequestEvent(eventPayload) {
  return eventPayload && eventPayload.pull_request && eventPayload.pull_request.title;
}

function isPushEvent(eventPayload) {
  return !isPullRequestEvent(eventPayload)
    && eventPayload
    && eventPayload.pusher
    && eventPayload.commits.length;
}

function containsClickUpTagId(title) {
  return /\(CU-\w{6,}\)/gm.test(title);
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
      const statusPriority = STATUS_PRIORITIES.indexOf(task.status.status);
      const lowestStatusPriority = STATUS_PRIORITIES.indexOf(lowestPriorityStatus);
      if (statusPriority < lowestStatusPriority) {
        lowestPriorityStatus = task.status.status;
      }
    }
  });

  return lowestPriorityStatus;
}

function getTargetedInProgressStatus(eventPayload) {
  if (isApproved(eventPayload)) {
    return TO_RELEASE_STATUS;
  }

  if (isWaitingForReview(eventPayload)) {
    if (isInCodeReview(eventPayload)) {
      return IN_CODE_REVIEW_STATUS;
    }
    return WAITING_FOR_REVIEW_STATUS;
  }

  return DOING_STATUS;
}

function updateTaskInProgressStatus(eventPayload) {
  const clickUpTaskId = getClickUpTaskIdFromTitle(eventPayload.pull_request.title);
  const targetStatus = getTargetedInProgressStatus(eventPayload);

  return fetchTask(clickUpTaskId)
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
}

async function updateTaskAsReleased(eventPayload) {
  await eventPayload.commits.forEach(async (commit) => {
    if (containsClickUpTagId(commit.message)) {
      const clickUpTaskId = getClickUpTaskIdFromTitle(commit.message);
      await fetchTask(clickUpTaskId, true)
        .then(async (task) => {
          if (!task) return;

          await updateStatusIfNecessary(
            task.id,
            task.status.status,
            RELEASED_STATUS,
          );

          if (task.substasks) {
            task.subtrasks.forEach((subtask) => {
              updateStatusIfNecessary(
                subtask.id,
                subtask.status.status,
                RELEASED_STATUS,
              );
            });
          }
        });
    }
  });
}

function ClickUpStatusUpdater() {
  // NOTICE: GITHUB_EVENT_PATH is a path to a file where the current event payload is stored.
  const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
  const eventPayload = JSON.parse(file);

  this.handleEvent = async () => {
    if (isPullRequestEvent(eventPayload) && containsClickUpTagId(eventPayload.pull_request.title)) {
      await updateTaskInProgressStatus(eventPayload);
    } else if (isPushEvent(eventPayload)) {
      await updateTaskAsReleased(eventPayload);
    }
  };
}

module.exports = ClickUpStatusUpdater;
