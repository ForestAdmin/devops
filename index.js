const BadgeCoverageUpdater = require('./services/badge-coverage-updater');
const ReleaseCreator = require('./services/release-creator');
const ReleaseNoteCreator = require('./services/release-note-creator');

function ReleaseManager(options) {
  this.create = () => new ReleaseCreator(process.argv, options).perform();
}

function ReleaseNoteManager(slackToken, slackChannel, options) {
  this.create = () => new ReleaseNoteCreator(slackToken, slackChannel, options).perform();
}

function CoverageManager() {
  this.updateBadge = async () => new BadgeCoverageUpdater().perform();
}

module.exports = {
  ReleaseManager,
  ReleaseNoteManager,
  CoverageManager,
};
