// NOTICE: token creation https://api.slack.com/custom-integrations/legacy-tokens
require('dotenv').config();

const ReleaseCreator = require('./services/release-creator');
const ReleaseNoteCreator = require('./services/release-note-creator');

const token = process.env.SLACK_TOKEN;

module.exports = (releaseIcon, withVersion) => {
  return new ReleaseCreator(withVersion)
    .perform()
    .then(() => new ReleaseNoteCreator(token, releaseIcon, withVersion).perform());
};
