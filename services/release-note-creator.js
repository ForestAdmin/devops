const { WebClient } = require('@slack/client');
const chalk = require('chalk');
const { getLinesOfChangelog, getPackageJson } = require('../utils/project-file-utils');
const {
  SlackTokenMissingError,
  SlackConnectionError,
  ProjectIconMissingError,
  WronglyFormattedChangelogError,
} = require('../utils/errors');

const VERSION_LINE_REGEX = /^## RELEASE (\d+.\d+.\d+(-\w+\.\d+)? )?- .*$/;

function ReleaseNoteCreator(slackToken, projectIcon, options = {}) {
  if (!slackToken) {
    throw new SlackTokenMissingError();
  }
  if (!projectIcon) {
    throw new ProjectIconMissingError();
  }

  const channel = options.channel || 'G501BDD5W';
  const withVersion = options.withVersion || false;

  function isNotReleaseTitle(data) {
    return !VERSION_LINE_REGEX.test(data[0]) && data.length;
  }

  function findReleaseHeader(data) {
    while (isNotReleaseTitle(data)) {
      data.shift();
    }
  }

  function collectChanges(data) {
    const changes = [];
    while (isNotReleaseTitle(data)) {
      changes.push(data.shift());
    }

    for (let index = changes.length - 1; index >= 0; index -= 1) {
      const line = changes[index];
      if (line.trim()) {
        break;
      }
      changes.pop();
    }

    return changes;
  }

  function extractLastReleaseTitleAndChanges(data) {
    if (!data.length || (data.length === 1 && data[0] === '')) {
      throw new WronglyFormattedChangelogError();
    }

    findReleaseHeader(data);

    const title = data.shift();

    if (!data.length) {
      throw new WronglyFormattedChangelogError();
    }

    const changes = collectChanges(data);

    return { title, changes };
  }

  function getReleaseChangesFormatted() {
    const data = getLinesOfChangelog();
    const { title, changes } = extractLastReleaseTitleAndChanges(data);

    const suffixTitle = title.substring(title.indexOf(' - '))
      .replace(' - ', `${projectIcon} `);
    const titleBetter = `RELEASE ${suffixTitle}`;
    let body = changes
      .join('\n')
      .replace('### Added', '## ⭐ Added')
      .replace('### Changed', '## 🍿 Changed')
      .replace('### Fixed', '## 💉 Fixed');

    if (withVersion) {
      const packageJson = getPackageJson();
      body = `# ${packageJson.name} v${packageJson.version}\n\n${body}`;
    }

    return { title: titleBetter, body };
  }

  function postReleaseNote(title, content) {
    return new WebClient(slackToken).files.upload({
      channels: channel,
      content,
      filename: `${title}.md`,
      filetype: 'post',
    })
      .then(() => {
        console.log(chalk.green('📮 Release note posted to Slack'));
      })
      .catch((error) => {
        console.log(chalk.red(`Cannot upload the release note. Be sure to pass a correct slackToken, current token is: ${slackToken}.`));
        console.log(chalk.red('To generate a token, go here: https://api.slack.com/custom-integrations/legacy-tokens\n'));
        throw new SlackConnectionError(error);
      });
  }

  this.perform = () => {
    const { title, body } = getReleaseChangesFormatted();
    return postReleaseNote(title, body);
  };
}

module.exports = ReleaseNoteCreator;
