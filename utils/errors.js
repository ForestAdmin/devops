/* eslint max-classes-per-file: 0 */

class SlackTokenMissingError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SlackTokenMissingError);
    }

    this.name = 'SlackTokenMissingError';
  }
}

class ProjectIconMissingError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProjectIconMissingError);
    }

    this.name = 'ProjectIconMissingError';
  }
}

class WronglyFormattedChangelogError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WronglyFormattedChangelogError);
    }

    this.name = 'WronglyFormattedChangelogError';
  }
}

class ChangelogMissingError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ChangelogMissingError);
    }

    this.name = 'ChangelogMissingError';
  }
}

module.exports = {
  SlackTokenMissingError,
  ProjectIconMissingError,
  WronglyFormattedChangelogError,
  ChangelogMissingError,
};
