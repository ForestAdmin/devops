const fs = require('fs');
const mockFs = require('mock-fs');
const BadgeCoverageUpdater = require('../../services/badge-coverage-updater');

const FILE_README = `# Random Package
![Coverage](https://img.shields.io/badge/coverage-99%25%0A-success)
`;

const FILE_LCOV = `TN:
SF:/Users/arnaudbesnier/Dev/devops/services/badge-coverage-updater.js
FN:7,BadgeCoverageUpdater
FN:8,createBadge
FN:11,(anonymous_2)
FN:12,(anonymous_3)
FN:31,readCoverageAndCreateBadge
FN:40,updateReadmeCoverageBadge
FN:47,(anonymous_6)
FNF:7
FNH:7
FNDA:1,BadgeCoverageUpdater
FNDA:1,createBadge
FNDA:1,(anonymous_2)
FNDA:1,(anonymous_3)
FNDA:1,readCoverageAndCreateBadge
FNDA:1,updateReadmeCoverageBadge
FNDA:1,(anonymous_6)
DA:1,1
DA:2,1
DA:4,1
DA:5,1
DA:9,1
DA:11,1
DA:12,1
DA:13,1
DA:14,1
DA:16,1
DA:17,5
DA:18,5
DA:20,1
DA:22,1
DA:23,1
DA:24,1
DA:26,1
DA:32,1
DA:33,1
DA:34,1
DA:36,0
DA:41,1
DA:42,1
DA:43,1
DA:44,1
DA:47,1
DA:48,1
DA:52,1
LF:28
LH:27
BRDA:9,0,0,0
BRDA:9,0,1,1
BRDA:23,1,0,0
BRDA:23,1,1,1
BRDA:24,2,0,0
BRDA:24,2,1,1
BRF:6
BRH:3
end_of_record
`;

describe('service > badge coverage updater', () => {
  describe('without coverage/lcov.info file', () => {
    it('should set the badge value to "unknown" with "critical" color', async () => {
      expect.assertions(1);
      mockFs({
        'README.md': FILE_README,
      });

      await new BadgeCoverageUpdater().perform();
      expect(fs.readFileSync('README.md').toString()).toStrictEqual(`# Random Package
![Coverage](https://img.shields.io/badge/coverage-unknown-critical)
`);
      mockFs.restore();
    });
  });

  describe('with a coverage/lcov.info file that describe a 96% coverage', () => {
    it('should set the badge value to "96" with "important" color', async () => {
      expect.assertions(1);
      mockFs({
        'README.md': FILE_README,
        coverage: {
          'lcov.info': FILE_LCOV,
        },
      });

      await new BadgeCoverageUpdater().perform();
      expect(fs.readFileSync('README.md').toString()).toStrictEqual(`# Random Package
![Coverage](https://img.shields.io/badge/coverage-96%25%0A-important)
`);
      mockFs.restore();
    });
  });
});
