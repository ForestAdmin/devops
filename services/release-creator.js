const moment = require('moment');
const fs = require('fs');
const simpleGit = require('simple-git')();
const semver = require('semver');

const BRANCH_MASTER = 'master';
const BRANCH_DEVEL = 'devel';
const PRERELEASE_OPTIONS = ['premajor', 'preminor', 'prepatch', 'prerelease'];
const RELEASE_OPTIONS = ['major', 'minor', 'patch', ...PRERELEASE_OPTIONS];

function ReleaseCreator(withVersion) {
  const parseCommandLineArguments = () => {
    let releaseType = 'patch';
    let prereleaseTag;

    if (process.argv) {
      if (process.argv[2]) {
        const option = process.argv[2].replace('--', '');
        if (RELEASE_OPTIONS.includes(option)) {
          releaseType = option;
        }
      }
      if (process.argv[3]) {
        const option = process.argv[3].replace('--', '');
        prereleaseTag = option;
      } else if (PRERELEASE_OPTIONS.includes(releaseType)) {
        prereleaseTag = 'beta';
      }
    }

    return { releaseType, prereleaseTag }
  };

  const pullAndCommitChanges = async (newVersionFile, newChanges, commitMessage, branchName) => {
    if (branchName) {
      await simpleGit.checkout(branchName);
    }

    return simpleGit
      .pull((error) => { if (error) { console.log(error); } })
      .then(() => { console.log(`Pull ${branchName || 'current branch'} done.`); })
      .then(() => {
        if (withVersion) {
          fs.writeFileSync('package.json', newVersionFile);
        }
        fs.writeFileSync('CHANGELOG.md', newChanges);
      })
      .add(['CHANGELOG.md', 'package.json'])
      .commit(commitMessage)
      .push()
      .then(() => { console.log(`Commit Release on ${branchName || 'current branch'} done.`); });
  }

  const addTagToGit = (tag, branchName) =>
    simpleGit
      .addTag(tag)
      .push('origin', tag)
      .then(() => { console.log(`Tag ${tag} on ${branchName || 'currentBranch'} done.`); });

  const mergeDevelOntoMaster = () =>
    simpleGit
      .checkout(BRANCH_MASTER)
      .pull((error) => { if (error) { console.log(error); } })
      .then(() => { console.log(`Pull ${BRANCH_MASTER} done.`); })
      .mergeFromTo(BRANCH_DEVEL, BRANCH_MASTER)
      .then(() => { console.log(`Merge ${BRANCH_DEVEL} on ${BRANCH_MASTER} done.`); })
      .push();

  this.perform = () => {
    let releaseType = 'patch';
    let prereleaseTag;
    let newVersionFile;

    if (withVersion) {
      ({ releaseType, prereleaseTag }) = parseCommandLineArguments();

      // VERSION
      const packageContents = fs.readFileSync('./package.json', 'utf8');
      const package = JSON.parse(packageContents);
      let version = versionFile[3].match(/\w*"version": "(.*)",/)[1];
      version = semver.inc(version, releaseType, prereleaseTag);
      package.version = version;
      newVersionFile = JSON.stringify(package, null, 2);
    }

    // CHANGELOG
    const changes = fs.readFileSync('CHANGELOG.md').toString().split('\n');
    const today = moment().format('YYYY-MM-DD');

    changes.splice(3, 0, `\n## RELEASE ${withVersion ? `${version} ` : ''}- ${today}`);
    const newChanges = changes.join('\n');

    const commitMessage = withVersion ? `Release ${version}` : `Release - ${today}`;
    const tag = `v${version}`;

    return new Promise((resolve) => {
      simpleGit.status((_, statusSummary) => {
        const currentBranch = statusSummary.current;

        let promise;
        if (prereleaseTag || /v\d+(\.\d+)?/.test(currentBranch)) {
          promise = pullAndCommitChanges(newVersionFile, newChanges, commitMessage, currentBranch)
            .then(() => addTagToGit(tag, currentBranch))
            .addTag();
        } else {
          promise = pullAndCommitChanges(newVersionFile, newChanges, commitMessage, BRANCH_DEVEL)
            .then(() => mergeDevelOntoMaster())
            .then(() => addTagToGit(tag, BRANCH_MASTER))
            .checkout(BRANCH_DEVEL);
        }

        resolve(promise);
      });
    });
  };
}


module.exports = ReleaseCreator;
