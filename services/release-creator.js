const moment = require('moment');
const fs = require('fs');
const simpleGit = require('simple-git')();
const semver = require('semver');
const { getLinesOfChangelog, getPackageJson } = require('../utils/project-file-utils');
const { GitPullError } = require('../utils/errors');

const BRANCH_MASTER = 'master';
const BRANCH_DEVEL = 'devel';
const PRERELEASE_OPTIONS = ['premajor', 'preminor', 'prepatch', 'prerelease'];
const RELEASE_OPTIONS = ['major', 'minor', 'patch', ...PRERELEASE_OPTIONS];

function ReleaseCreator(argv, options = {}) {
  const withVersion = options.withVersion || false;

  const parseCommandLineArguments = () => {
    let releaseType = 'patch';
    let prereleaseTag;

    if (argv) {
      if (argv[2]) {
        const option = argv[2].replace('--', '');
        if (RELEASE_OPTIONS.includes(option)) {
          releaseType = option;
        }
      }
      if (argv[3]) {
        const option = argv[3].replace('--', '');
        prereleaseTag = option;
      } else if (PRERELEASE_OPTIONS.includes(releaseType)) {
        prereleaseTag = 'beta';
      }
    }

    return { releaseType, prereleaseTag };
  };

  const gitPullErrorCatcher = (error) => {
    if (error) {
      throw new GitPullError();
    }
  };

  const getBranchLabel = (branchName) => branchName || 'current branch';

  const pullAndCommitChanges = async (newVersionFile, newChanges, commitMessage, branchName) => {
    if (branchName) {
      await simpleGit.checkout(branchName);
    }

    return simpleGit
      .pull(gitPullErrorCatcher)
      .exec(() => { console.log(`Pull ${getBranchLabel(branchName)} done.`); })
      .exec(() => {
        if (withVersion) {
          fs.writeFileSync('package.json', newVersionFile);
        }
        fs.writeFileSync('CHANGELOG.md', newChanges);
      })
      .add(['CHANGELOG.md', 'package.json'])
      .commit(commitMessage)
      .push()
      .exec(() => { console.log(`Commit Release on ${getBranchLabel(branchName)} done.`); });
  };

  const addTagToGit = (tag, branchName) => simpleGit
    .addTag(tag)
    .push('origin', tag)
    .exec(() => { console.log(`Tag ${tag} on ${getBranchLabel(branchName)} done.`); });

  const mergeDevelOntoMaster = () => simpleGit
    .checkout(BRANCH_MASTER)
    .pull(gitPullErrorCatcher)
    .exec(() => { console.log(`Pull ${BRANCH_MASTER} done.`); })
    .mergeFromTo(BRANCH_DEVEL, BRANCH_MASTER)
    .exec(() => { console.log(`Merge ${BRANCH_DEVEL} on ${BRANCH_MASTER} done.`); })
    .push();

  this.perform = () => {
    let releaseType = 'patch';
    let prereleaseTag;
    let newVersionFile;
    let version;

    if (withVersion) {
      ({ releaseType, prereleaseTag } = parseCommandLineArguments());

      // VERSION
      const packageJson = getPackageJson();
      version = semver.inc(packageJson.version, releaseType, prereleaseTag);
      packageJson.version = version;
      newVersionFile = JSON.stringify(packageJson, null, 2);
    }

    // CHANGELOG
    const changes = getLinesOfChangelog();
    const today = moment().format('YYYY-MM-DD');

    const index = changes.indexOf('## [Unreleased]') + 1;
    changes.splice(index, 0, `\n## RELEASE ${withVersion ? `${version} ` : ''}- ${today}`);
    const newChanges = changes.join('\n');

    const commitMessage = withVersion ? `Release ${version}` : `Release - ${today}`;
    const tag = version ? `v${version}` : null;

    return new Promise((resolve) => {
      simpleGit.status((_, statusSummary) => {
        const currentBranch = statusSummary.current;

        let promise;
        if (withVersion && (prereleaseTag || /v\d+(\.\d+)?/i.test(currentBranch))) {
          promise = pullAndCommitChanges(newVersionFile, newChanges, commitMessage, currentBranch)
            .then(() => addTagToGit(tag, currentBranch));
        } else {
          promise = pullAndCommitChanges(newVersionFile, newChanges, commitMessage, BRANCH_DEVEL)
            .then(() => mergeDevelOntoMaster())
            .then(() => (withVersion ? addTagToGit(tag, BRANCH_MASTER) : simpleGit))
            .then(() => simpleGit.checkout(BRANCH_DEVEL));
        }

        promise.catch(() => {});

        resolve(promise);
      });
    });
  };
}

module.exports = ReleaseCreator;
