// NOTICE: token creation https://api.slack.com/custom-integrations/legacy-tokens
require('dotenv').config();
// require('colors');

const ReleaseCreator = require('./services/release-creator');
const ReleaseNoteCreator = require('./services/release-note-creator');

const token = 'xoxp-739448158113-734385507331-746036946085-5e8413d7e6327739bd0a6c0c2502d1b5';

module.exports = (releaseIcon, withVersion) => {
  return new ReleaseCreator(withVersion)
    .perform()
    .then(() => new ReleaseNoteCreator(token, releaseIcon, withVersion).perform());
};
