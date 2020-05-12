# Change Log

## [Unreleased]

## RELEASE 2.1.1 - 2020-05-12
### Changed
- Technical - Use Node LTS version to run CI jobs.
- Technical - Get rid of useless CI configuration (environment, notifications and install).
- Technical - Parallelize lint and test CI jobs.
- Technical - Remove unused `sudo` CI configuration.

## RELEASE 2.1.0 - 2020-04-17
### Added
- Technical - Automatically update status of clickup tasks.

## RELEASE 2.0.1 - 2020-04-14
### Added
- Technical - Add the MIT License.

### Changed
- Technical - Upgrade `eslint` devDependency.
- Technical - Add a new line at the end of the generated `package.json` file when releasing a new version.
- Technical - Introduce conventional commits.
- Technical - Make the CI lint the commit messages.

### Fixed
- Readme - Rewrite it according to the new functions exposed.
- Technical - Adapt release manager to conventional commits.

## RELEASE 2.0.0 - 2019-09-19
### Changed
- Release Notes - Change the interface to expose the release note creation script.
- Release Notes - Small formatting improvements in the published release note.

## RELEASE 1.0.5 - 2019-09-19
### Fixed
- Coverage - Add a missing dependency.

## RELEASE 1.0.4 - 2019-09-13
### Changed
- Release Note - Improve the release note style.

## RELEASE 1.0.3 - 2019-09-13
### Fixed
- Technical - Rename the `publish` command to prevent weird "double publish trial" behaviour.
- Release Command - Fix broken merge on master.

## RELEASE 1.0.2 - 2019-09-12
### Fixed
- Technical - Fix release script to set the `withVersion` mode.
- Technical - Fix tests.

## RELEASE 1.0.1 - 2019-09-12
### Added
- Technical - Add a `publish` command to publish the package on NPM.
- Technical - Add a release script.

### Fixed
- Technical - Fix a test.
- Release Notes - Fix the default Slack channel.

## RELEASE 1.0.0 - 2019-09-12
### Added
- Technical - Setup a minimal tests configuration.
- Technical - Setup a minimal CI configuration.
- Readme - Add a CI build badge in the readme.
- Release Note - Publish well formated release note depending on current path.
- Release Script - Centralize the script to release a project.
- Technical - Add a coverage badge.
- Coverage - Expose a function to update the Readme coverage badge of a repository.
