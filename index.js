const BadgeCoverageUpdater = require('./services/badge-coverage-updater');
const ReleaseCreator = require('./services/release-creator');
const ReleaseNoteCreator = require('./services/release-note-creator');

function ReleaseManager(slackToken, releaseIcon, options) {
  this.create = () => new ReleaseCreator(process.argv, options)
    .perform()
    .then(() => new ReleaseNoteCreator(slackToken, releaseIcon, options).perform());
}

function CoverageManager() {
  this.updateBadge = async () => new BadgeCoverageUpdater().perform();
}

module.exports = {
  ReleaseManager,
  CoverageManager,
};
