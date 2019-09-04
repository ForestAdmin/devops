const fs = require('fs');

function getLinesOfChangelog() {
  return fs.readFileSync('CHANGELOG.md').toString().split('\n');
}

function getPackageJson() {
  const packageContents = fs.readFileSync('./package.json', 'utf8');
  return JSON.parse(packageContents);
}

module.exports = {
  getLinesOfChangelog,
  getPackageJson,
};
