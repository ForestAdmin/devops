const { WebClient } = require('@slack/client');
const fs = require('fs');

function ReleaseNoteCreator(slackToken, releaseIcon, withVersion = false) {
  this.channel = 'CMXARTWR2';

  function extractLastVersionData(data) {
    const versionLineRegex = /## RELEASE (\d+.\d+.\d+(\-\w+\.\d+)? )?- .*/;
    const lastVersionData = [];

    if (!data.length) {
      console.error('error: no data');
      return null;
    }

    while (!versionLineRegex.test(data[0]) && data.length) {
      data.shift();
    }

    const title = data.shift();

    if (!data.length) {
      console.error('error: unexpected end of file');
      return null;
    }

    while (!versionLineRegex.test(data[0]) && data.length) {
      lastVersionData.push(data.shift());
    }

    return { title, data: lastVersionData };
  }

  function extractHeadOfChangelog(releaseIcon) {
    const data = fs.readFileSync('./CHANGELOG.md').toString().split('\n');
    const { title, data: lastVersionData } = extractLastVersionData(data);

    const suffixTitle = title.substring(title.indexOf(' - '))
      .replace(' - ', ` ${releaseIcon} `);
    const titleBetter = `RELEASE ${suffixTitle}`;
    let body = lastVersionData
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
      filename: `${title}.md`,
      filetype: 'post',
    })
      .then(() => {
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
