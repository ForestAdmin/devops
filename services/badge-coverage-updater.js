const lcovParse = require('lcov-parse'); // eslint-disable-line
const fs = require('fs');

const BADGE_URL = 'https://img.shields.io/badge/';
const BADGE_UNKNOWN = `${BADGE_URL}coverage-unknown-critical`;

async function createBadge(report) {
  if (!report) { return BADGE_UNKNOWN; }

  return new Promise((resolve) => {
    lcovParse(report, (error, data) => {
      let hit = 0;
      let found = 0;

      for (let i = 0; i < data.length; i += 1) {
        hit += data[i].lines.hit;
        found += data[i].lines.found;
      }
      const percentage = (hit / found) * 100;

      let color = 'critical';
      if (percentage > 89) { color = 'important'; }
      if (percentage > 99) { color = 'success'; }

      resolve(`${BADGE_URL}coverage-${Math.floor(percentage)}%25%0A-${color}`);
    });
  });
}

async function readCoverageAndCreateBadge() {
  try {
    const report = fs.readFileSync('coverage/lcov.info', 'utf8');
    return createBadge(report);
  } catch (error) {
    return BADGE_UNKNOWN;
  }
}

async function updateReadmeCoverageBadge() {
  const data = fs.readFileSync('README.md').toString();
  const badge = await readCoverageAndCreateBadge();
  const newData = data.replace(/!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-.*\)/, `![Coverage](${badge})`);
  fs.writeFileSync('README.md', newData);
}

updateReadmeCoverageBadge();
