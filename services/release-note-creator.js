const { WebClient } = require('@slack/client');
const fs = require('fs');
const chalk = require('chalk');
const { getLinesOfChangelog, getPackageJson } = require('../utils/project-file-utils');

const VERSION_LINE_REGEX = /^## RELEASE (\d+.\d+.\d+(\-\w+\.\d+)? )?- .*$/;

function ReleaseNoteCreator(slackToken, releaseIcon, options = {}) {
  const channel = options.channel || 'CMLBBF6Q3';
  const { withVersion } = options;

  function isChange(data) {
    return !VERSION_LINE_REGEX.test(data[0]) && data.length;
  }

  function findReleaseHeader(data) {
    while (isChange(data)) {
      data.shift();
    }
  }

  function collectChanges(data) {
    const changes = [];
    while (isChange(data)) {
      changes.push(data.shift());
    }
    return changes;
  }

  function extractLastVersionData(data) {
    if (!data.length) {
      console.error('error: no data');
      return null;
    }

    findReleaseHeader(data);

    const title = data.shift();

    if (!data.length) {
      console.error('error: unexpected end of file');
      return null;
    }

    const changes = collectChanges(data);

    return { title, changes };
  }

  function extractReleaseChanges(releaseIcon) {
    const data = getLinesOfChangelog();
    const { title, changes } = extractLastVersionData(data);

    const suffixTitle = title.substring(title.indexOf(' - '))
      .replace(' - ', `${releaseIcon} `);
    const titleBetter = `RELEASE ${suffixTitle}`;
    let body = changes
      .join('\n')
      .replace('### Added', '## ⭐ Added')
      .replace('### Changed', '## 🍿 Changed')
      .replace('### Fixed', '## 💉 Fixed');

    if (withVersion) {
      const package = getPackageJson();
      body = `# ${package.name} v${package.version}\n\n${body}`
    }

    return { title: titleBetter, body };
  }

  function postReleaseNote(title, content) {
    const web = new WebClient(slackToken);

    web.files.upload({
      channels: channel,
      content,
      filename: `${title}12.md`,
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
    const { title, body } = extractReleaseChanges(releaseIcon);
    postReleaseNote(title, body);
  };
}

module.exports = ReleaseNoteCreator;
