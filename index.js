// NOTICE: token creation https://api.slack.com/custom-integrations/legacy-tokens
require('dotenv').config();

const ReleaseCreator = require('./services/release-creator');
const ReleaseNoteCreator = require('./services/release-note-creator');

module.exports = {
  release(slackToken, releaseIcon, options) {
    return new ReleaseCreator(options)
      .perform()
      .then(() => new ReleaseNoteCreator(slackToken, releaseIcon, options).perform());
  },
};
