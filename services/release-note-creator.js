const { WebClient } = require('@slack/client');
const fs = require('fs');

const VERSION_LINE_REGEX = /^## RELEASE (\d+.\d+.\d+(\-\w+\.\d+)? )?- .*$/;

function ReleaseNoteCreator(slackToken, releaseIcon, withVersion = false) {
  this.channel = 'CMLBBF6Q3';

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

  function extractHeadOfChangelog(releaseIcon) {
    const data = fs.readFileSync('./CHANGELOG.md').toString().split('\n');
    const { title, changes } = extractLastVersionData(data);

    const suffixTitle = title.substring(title.indexOf(' - '))
      .replace(' - ', `${releaseIcon} `);
    const titleBetter = `RELEASE ${suffixTitle}`;
    let body = changes
      .join('\n')
      .replace('### Added', '# ⭐ Added')
      .replace('### Changed', '# 🍿 Changed')
      .replace('### Fixed', '# 💉 Fixed');

    if (withVersion) {
      const packageContents = fs.readFileSync('./package.json', 'utf8');
      const package = JSON.parse(packageContents);
      body = `# ${package.name} ${package.version}\n\n${body}`
    }

    return { title: titleBetter, body };
  }

  function postReleaseNote(title, content) {
    const web = new WebClient(slackToken);

    console.log('title: ', title);
    console.log('content: \n', content);

    web.files.upload({
      channels: this.channel,
      content,
      filename: `${title}12.md`,
      filetype: 'post',
    })
      .then((res) => {
        console.log(res);
        console.log('📮 Release note posted to Slack');
      })
      .catch((error) => {
        console.log('Cannot upload the release note. Be sure to have the `SLACK_DEV_TOKEN` in your `.env`.'.yellow);
        console.log('To generate a token, go here: https://api.slack.com/custom-integrations/legacy-tokens\n'.yellow);
        console.log('Original error:'.yellow);
        console.log(error);
      });
  }


  this.perform = () => {
    const { title, body } = extractHeadOfChangelog(releaseIcon);
    postReleaseNote(title, body);
  };
}

module.exports = ReleaseNoteCreator;
