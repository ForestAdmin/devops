const fs = require('fs');
const { ChangelogMissing } = require('./errors');

function getLinesOfChangelog() {
  try {
    return fs.readFileSync('CHANGELOG.md').toString().split('\n');
  } catch (e) {
    throw new ChangelogMissing();
  }
}

function getPackageJson() {
  const packageContents = fs.readFileSync('./package.json', 'utf8');
  return JSON.parse(packageContents);
}

module.exports = {
  getLinesOfChangelog,
  getPackageJson,
};
