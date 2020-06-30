## [3.0.1](https://github.com/ForestAdmin/automatic-release-note/compare/v3.0.0...v3.0.1) (2020-06-30)


### Bug Fixes

* **click up:** fix click up tag id detection ([#19](https://github.com/ForestAdmin/automatic-release-note/issues/19)) ([e8e5991](https://github.com/ForestAdmin/automatic-release-note/commit/e8e5991742051be9ef3a711c4e1f60fcbd8d66f6))

# [3.0.0](https://github.com/ForestAdmin/automatic-release-note/compare/v2.1.3...v3.0.0) (2020-05-20)


* refactor(release)!: drop release services (#17) ([392143e](https://github.com/ForestAdmin/automatic-release-note/commit/392143ebe5a03285f36d7835959526d1975e166d)), closes [#17](https://github.com/ForestAdmin/automatic-release-note/issues/17)


### BREAKING CHANGES

* ReleaseManager and ReleaseNoteManager have been removed
in favor of semantic release usage.

## [2.1.3](https://github.com/ForestAdmin/automatic-release-note/compare/v2.1.2...v2.1.3) (2020-05-12)


### Bug Fixes

* **security:** patch newly detected dependencies vulnerabilities ([067550e](https://github.com/ForestAdmin/automatic-release-note/commit/067550e2e2485e436ac5fccffff41680bc10d211))

## [2.1.2](https://github.com/ForestAdmin/automatic-release-note/compare/v2.1.1...v2.1.2) (2020-05-12)


### Bug Fixes

* **security:** patch newly detected dependencies vulnerabilities ([0072739](https://github.com/ForestAdmin/automatic-release-note/commit/007273991bad3474971ca81e94a6b91b6dce78a6))

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
