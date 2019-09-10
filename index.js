const ReleaseCreator = require('./services/release-creator');
const ReleaseNoteCreator = require('./services/release-note-creator');

module.exports = {
  ReleaseManager(slackToken, releaseIcon, options) {
    this.create = () => new ReleaseCreator(process.argv, options)
      .perform()
      .then(() => new ReleaseNoteCreator(slackToken, releaseIcon, options).perform());
  },
};
