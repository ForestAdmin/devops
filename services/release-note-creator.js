const { WebClient } = require('@slack/client');
const chalk = require('chalk');
const { getLinesOfChangelog, getPackageJson } = require('../utils/project-file-utils');
const { SlackTokenMissingError, ProjectIconMissingError, WronglyFormattedChangelogError } = require('../utils/errors');

const VERSION_LINE_REGEX = /^## RELEASE (\d+.\d+.\d+(-\w+\.\d+)? )?- .*$/;

function ReleaseNoteCreator(slackToken, projectIcon, options = {}) {
  if (!slackToken) {
    throw new SlackTokenMissingError();
  }
  if (!projectIcon) {
    throw new ProjectIconMissingError();
  }

  const channel = options.channel || 'CMLBBF6Q3';
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
    if (!data.length) {
      console.error('error: no data');
      return null;
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
    const web = new WebClient(slackToken);

    web.files.upload({
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
        console.log(chalk.red('Original error:'));
        console.error(error);
      });
  }

  this.perform = () => {
    const { title, body } = getReleaseChangesFormatted();
    postReleaseNote(title, body);
  };
}

module.exports = ReleaseNoteCreator;
