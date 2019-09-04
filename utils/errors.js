class SlackTokenMissing extends Error {
  constructor( ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SlackTokenMissing);
    }

    this.name = 'SlackTokenMissing';
  }
}

class ProjectIconMissing extends Error {
  constructor( ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProjectIconMissing);
    }

    this.name = 'ProjectIconMissing';
  }
}

class WronglyFormattedChangelog extends Error {
  constructor( ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WronglyFormattedChangelog);
    }

    this.name = 'WronglyFormattedChangelog';
  }
}

module.exports = {
  SlackTokenMissing,
  ProjectIconMissing,
  WronglyFormattedChangelog,
};
