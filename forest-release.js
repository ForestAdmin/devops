// NOTICE: token creation https://api.slack.com/custom-integrations/legacy-tokens
require('dotenv').config();
// require('colors');

const ReleaseNotCreator = require('./services/release-note-creator');

const token = 'xoxp-739448158113-734385507331-745847314480-0726c291d9afa0e376410f8d976e6ef0';

module.exports = (releaseIcon, withVersion) => {
  return new ReleaseNotCreator(token, releaseIcon, withVersion)
    .perform();
};
