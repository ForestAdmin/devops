const mockFs = require('mock-fs');
const fs = require('fs');
const mockRequire = require('mock-require');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const {
  ChangelogMissingError,
  GitPullError,
} = require('../../utils/errors');
const { packageJsonFileContent } = require('../../utils/project-file-utils');
let ReleaseCreator = require('../../services/release-creator');

const { expect } = chai;

describe('Services > Release Creator', () => {
  const defaultArgv = ['node', 'release'];

  let branches;
  let pulls;
  let pushes;
  let filesAdded;
  let commitMessage;
  let currentTag;
  let startBranch;
  let currentBranch;
  let mergeFrom;
  let mergeTo;

  const resetVariables = () => {
    branches = [];
    pulls = [];
    pushes = [];
    filesAdded = [];
    commitMessage = undefined;
    currentTag = undefined;
    mergeFrom = undefined;
    mergeTo = undefined;
    currentBranch = startBranch;
  };

  const createMockGit = (branch, pullError) => {
    startBranch = branch;
    currentBranch = branch;

    const MockGit = function MockGit() {
      this.checkout = (checkoutBranch) => {
        if (checkoutBranch !== currentBranch) {
          currentBranch = checkoutBranch;
          branches.push(checkoutBranch);
        }
        return this;
      };
      this.pull = (catcher) => {
        if (pullError) {
          catcher('Cannot pull from Github');
        } else {
          pulls.push(currentBranch);
        }
        return this;
      };
      this.exec = (fn) => {
        fn();
        return this;
      };
      this.add = (files) => {
        filesAdded = files;
        return this;
      };
      this.commit = (message) => {
        commitMessage = message;
        return this;
      };
      this.push = () => {
        pushes.push(currentBranch);
        return this;
      };
      this.addTag = (tag) => {
        currentTag = tag;
        return this;
      };
      this.mergeFromTo = (from, to) => {
        mergeFrom = from;
        mergeTo = to;
        return this;
      };
      this.status = (callback) => {
        callback(null, { current: currentBranch });
      };
    };

    return () => new MockGit();
  };

  before(() => {
    mockRequire('moment', () => ({
      format() {
        return '2019-08-31';
      },
    }));
  });

  describe('with no CHANGELOG.md', () => {
    before(() => {
      mockFs({
        '.': {},
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should throw an error', () => {
      expect(() => new ReleaseCreator('fake', '😁').perform())
        .to.throw(ChangelogMissingError);
    });
  });

  describe('Changelog with no version', () => {
    describe('from devel branch', () => {
      const changelog = `# Changelog
## [Unreleased]
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.

### Fixed
- Style - Update style.`;

      before(() => {
        resetVariables();

        mockRequire('simple-git', createMockGit('devel'));
        ReleaseCreator = mockRequire.reRequire('../../services/release-creator');

        mockFs({
          'CHANGELOG.md': changelog,
        });

        new ReleaseCreator().perform();
      });

      after(() => {
        mockFs.restore();
      });

      it('should update the CHANGELOG.md', () => {
        expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
          `# Changelog
## [Unreleased]

## RELEASE - 2019-08-31
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.

### Fixed
- Style - Update style.`,
        );
      });

      it('should pull and commit changes', () => {
        expect(pulls[0]).equal('devel');
        expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
        expect(commitMessage).equal('chore(release): 2019-08-31');
        expect(pushes[0]).equal('devel');
      });

      it('should merge devel onto master', () => {
        expect(branches[0]).equal('master');
        expect(pulls[1]).equal('master');
        expect(mergeFrom).equal('devel');
        expect(mergeTo).equal('master');
        expect(pushes[1]).equal('master');
      });

      it('should get back to devel', () => {
        expect(currentBranch).equal('devel');
      });
    });

    describe('from v4 branch', () => {
      const changelog = `# Changelog
## [Unreleased]
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.

### Fixed
- Style - Update style.`;

      before(() => {
        resetVariables();

        mockRequire('simple-git', createMockGit('v4'));
        ReleaseCreator = mockRequire.reRequire('../../services/release-creator');

        mockFs({
          'CHANGELOG.md': changelog,
        });

        new ReleaseCreator().perform();
      });

      after(() => {
        mockFs.restore();
      });

      it('should update the CHANGELOG.md', () => {
        expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
          `# Changelog
## [Unreleased]

## RELEASE - 2019-08-31
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.

### Fixed
- Style - Update style.`,
        );
      });

      it('should pull and commit changes', () => {
        expect(branches[0]).equal('devel');
        expect(pulls[0]).equal('devel');
        expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
        expect(commitMessage).equal('chore(release): 2019-08-31');
        expect(pushes[0]).equal('devel');
      });

      it('should merge devel onto master', () => {
        expect(branches[1]).equal('master');
        expect(pulls[1]).equal('master');
        expect(mergeFrom).equal('devel');
        expect(mergeTo).equal('master');
        expect(pushes[1]).equal('master');
      });

      it('should get back to devel', () => {
        expect(currentBranch).equal('devel');
      });
    });
  });

  describe('Changelog with version', () => {
    const changelog = `# Changelog

## [Unreleased]
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`;
    const packageJson = `{
      "name": "lumber-cli",
      "description": "Create your backend application in minutes. GraphQL API backend based on a database schema",
      "version": "2.3.9"
    }`;

    describe('from devel branch', () => {
      before(() => {
        mockRequire('simple-git', createMockGit('devel'));
        ReleaseCreator = mockRequire.reRequire('../../services/release-creator');
      });

      describe('release patch', () => {
        describe('with Github not accessible', () => {
          before(() => {
            resetVariables();

            mockRequire('simple-git', createMockGit('devel', true));
            ReleaseCreator = mockRequire.reRequire('../../services/release-creator');

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator(null, { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should throw a GitPullError error', async () => {
            await expect(new ReleaseCreator('fake', '😁').perform())
              .to.be.rejectedWith(GitPullError);
          });
        });

        describe('with Github accessible', () => {
          before(() => {
            resetVariables();


            mockRequire('simple-git', createMockGit('devel'));
            ReleaseCreator = mockRequire.reRequire('../../services/release-creator');

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator(null, { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.10 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.10',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.10');
            expect(pushes[0]).equal('devel');
          });

          it('should merge devel onto master', () => {
            expect(branches[0]).equal('master');
            expect(pulls[1]).equal('master');
            expect(mergeFrom).equal('devel');
            expect(mergeTo).equal('master');
            expect(pushes[1]).equal('master');
          });

          it('should get back to devel', () => {
            expect(currentBranch).equal('devel');
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.10');
          });
        });
      });

      describe('release minor', () => {
        before(() => {
          resetVariables();

          mockFs({
            'CHANGELOG.md': changelog,
            'package.json': packageJson,
          });

          new ReleaseCreator([...defaultArgv, '--minor'], { withVersion: true }).perform();
        });

        after(() => {
          mockFs.restore();
        });

        it('should update the CHANGELOG.md', () => {
          expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
            `# Changelog

## [Unreleased]

## RELEASE 2.4.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
          );
        });

        it('should update the package.json', () => {
          expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
            name: 'lumber-cli',
            description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
            version: '2.4.0',
          }));
        });

        it('should pull and commit changes', () => {
          expect(pulls[0]).equal('devel');
          expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
          expect(commitMessage).equal('chore(release): 2.4.0');
          expect(pushes[0]).equal('devel');
        });

        it('should merge devel onto master', () => {
          expect(branches[0]).equal('master');
          expect(pulls[1]).equal('master');
          expect(mergeFrom).equal('devel');
          expect(mergeTo).equal('master');
          expect(pushes[1]).equal('master');
        });

        it('should get back to devel', () => {
          expect(currentBranch).equal('devel');
        });

        it('should add the correct tag', () => {
          expect(currentTag).equal('v2.4.0');
        });
      });

      describe('release major', () => {
        before(() => {
          resetVariables();

          mockFs({
            'CHANGELOG.md': changelog,
            'package.json': packageJson,
          });

          new ReleaseCreator([...defaultArgv, '--major'], { withVersion: true }).perform();
        });

        after(() => {
          mockFs.restore();
        });

        it('should update the CHANGELOG.md', () => {
          expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
            `# Changelog

## [Unreleased]

## RELEASE 3.0.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
          );
        });

        it('should update the package.json', () => {
          expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
            name: 'lumber-cli',
            description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
            version: '3.0.0',
          }));
        });

        it('should pull and commit changes', () => {
          expect(pulls[0]).equal('devel');
          expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
          expect(commitMessage).equal('chore(release): 3.0.0');
          expect(pushes[0]).equal('devel');
        });

        it('should merge devel onto master', () => {
          expect(branches[0]).equal('master');
          expect(pulls[1]).equal('master');
          expect(mergeFrom).equal('devel');
          expect(mergeTo).equal('master');
          expect(pushes[1]).equal('master');
        });

        it('should get back to devel', () => {
          expect(currentBranch).equal('devel');
        });

        it('should add the correct tag', () => {
          expect(currentTag).equal('v3.0.0');
        });
      });

      describe('release prerelease', () => {
        const prereleaseChangelog = `# Changelog

## [Unreleased]
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9-beta.0 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`;
        const prereleasePackageJson = `{
          "name": "lumber-cli",
          "description": "Create your backend application in minutes. GraphQL API backend based on a database schema",
          "version": "2.3.9-beta.0"
        }`;

        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': prereleaseChangelog,
              'package.json': prereleasePackageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prerelease'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(`# Changelog

## [Unreleased]

## RELEASE 2.3.9-beta.1 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9-beta.0 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`);
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.9-beta.1',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.9-beta.1');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.9-beta.1');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': prereleaseChangelog,
              'package.json': prereleasePackageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prerelease', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.9-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9-beta.0 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.9-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.9-alpha.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.9-alpha.0');
          });
        });
      });

      describe('release prepatch', () => {
        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prepatch'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.10-beta.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.10-beta.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.10-beta.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.10-beta.0');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prepatch', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.10-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.10-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.10-alpha.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.10-alpha.0');
          });
        });
      });

      describe('release preminor', () => {
        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--preminor'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.4.0-beta.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.4.0-beta.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.4.0-beta.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.4.0-beta.0');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--preminor', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.4.0-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.4.0-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.4.0-alpha.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.4.0-alpha.0');
          });
        });
      });

      describe('release premajor', () => {
        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--premajor'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 3.0.0-beta.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '3.0.0-beta.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 3.0.0-beta.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v3.0.0-beta.0');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--premajor', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 3.0.0-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '3.0.0-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('devel');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 3.0.0-alpha.0');
            expect(pushes[0]).equal('devel');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v3.0.0-alpha.0');
          });
        });
      });
    });

    describe('from v4 branch', () => {
      before(() => {
        mockRequire('simple-git', createMockGit('v4'));
        ReleaseCreator = mockRequire.reRequire('../../services/release-creator');
      });

      describe('release patch', () => {
        before(() => {
          resetVariables();

          ReleaseCreator = mockRequire.reRequire('../../services/release-creator');

          mockFs({
            'CHANGELOG.md': changelog,
            'package.json': packageJson,
          });

          new ReleaseCreator(null, { withVersion: true }).perform();
        });

        after(() => {
          mockFs.restore();
        });

        it('should update the CHANGELOG.md', () => {
          expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
            `# Changelog

## [Unreleased]

## RELEASE 2.3.10 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
          );
        });

        it('should update the package.json', () => {
          expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
            name: 'lumber-cli',
            description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
            version: '2.3.10',
          }));
        });

        it('should pull and commit changes', () => {
          expect(pulls[0]).equal('v4');
          expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
          expect(commitMessage).equal('chore(release): 2.3.10');
          expect(pushes[0]).equal('v4');
        });

        it('should not merge devel onto master', () => {
          expect(branches).to.be.empty;
        });

        it('should not move current branch', () => {
          expect(currentBranch).equal('v4');
        });

        it('should add the correct tag', () => {
          expect(currentTag).equal('v2.3.10');
        });
      });

      describe('release minor', () => {
        before(() => {
          resetVariables();

          mockFs({
            'CHANGELOG.md': changelog,
            'package.json': packageJson,
          });

          new ReleaseCreator([...defaultArgv, '--minor'], { withVersion: true }).perform();
        });

        after(() => {
          mockFs.restore();
        });

        it('should update the CHANGELOG.md', () => {
          expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
            `# Changelog

## [Unreleased]

## RELEASE 2.4.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
          );
        });

        it('should update the package.json', () => {
          expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
            name: 'lumber-cli',
            description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
            version: '2.4.0',
          }));
        });

        it('should pull and commit changes', () => {
          expect(pulls[0]).equal('v4');
          expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
          expect(commitMessage).equal('chore(release): 2.4.0');
          expect(pushes[0]).equal('v4');
        });

        it('should not merge devel onto master', () => {
          expect(branches).to.be.empty;
        });

        it('should not move current branch', () => {
          expect(currentBranch).equal('v4');
        });

        it('should add the correct tag', () => {
          expect(currentTag).equal('v2.4.0');
        });
      });

      describe('release major', () => {
        before(() => {
          resetVariables();

          mockFs({
            'CHANGELOG.md': changelog,
            'package.json': packageJson,
          });

          new ReleaseCreator([...defaultArgv, '--major'], { withVersion: true }).perform();
        });

        after(() => {
          mockFs.restore();
        });

        it('should update the CHANGELOG.md', () => {
          expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
            `# Changelog

## [Unreleased]

## RELEASE 3.0.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
          );
        });

        it('should update the package.json', () => {
          expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
            name: 'lumber-cli',
            description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
            version: '3.0.0',
          }));
        });

        it('should pull and commit changes', () => {
          expect(pulls[0]).equal('v4');
          expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
          expect(commitMessage).equal('chore(release): 3.0.0');
          expect(pushes[0]).equal('v4');
        });

        it('should not merge devel onto master', () => {
          expect(branches).to.be.empty;
        });

        it('should not move current branch', () => {
          expect(currentBranch).equal('v4');
        });

        it('should add the correct tag', () => {
          expect(currentTag).equal('v3.0.0');
        });
      });

      describe('release prerelease', () => {
        const prereleaseChangelog = `# Changelog

## [Unreleased]
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9-beta.0 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`;
        const prereleasePackageJson = `{
          "name": "lumber-cli",
          "description": "Create your backend application in minutes. GraphQL API backend based on a database schema",
          "version": "2.3.9-beta.0"
        }`;

        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': prereleaseChangelog,
              'package.json': prereleasePackageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prerelease'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.9-beta.1 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9-beta.0 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.9-beta.1',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.9-beta.1');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.9-beta.1');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': prereleaseChangelog,
              'package.json': prereleasePackageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prerelease', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.9-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9-beta.0 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.9-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.9-alpha.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.9-alpha.0');
          });
        });
      });

      describe('release prepatch', () => {
        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prepatch'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.10-beta.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.10-beta.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.10-beta.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.10-beta.0');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--prepatch', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.3.10-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.3.10-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.3.10-alpha.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.3.10-alpha.0');
          });
        });
      });

      describe('release preminor', () => {
        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--preminor'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.4.0-beta.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.4.0-beta.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.4.0-beta.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.4.0-beta.0');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--preminor', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 2.4.0-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '2.4.0-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 2.4.0-alpha.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v2.4.0-alpha.0');
          });
        });
      });

      describe('release premajor', () => {
        describe('with no tag', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--premajor'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 3.0.0-beta.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '3.0.0-beta.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 3.0.0-beta.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v3.0.0-beta.0');
          });
        });

        describe('with tag alpha', () => {
          before(() => {
            resetVariables();

            mockFs({
              'CHANGELOG.md': changelog,
              'package.json': packageJson,
            });

            new ReleaseCreator([...defaultArgv, '--premajor', '--alpha'], { withVersion: true }).perform();
          });

          after(() => {
            mockFs.restore();
          });

          it('should update the CHANGELOG.md', () => {
            expect(fs.readFileSync('CHANGELOG.md').toString()).equal(
              `# Changelog

## [Unreleased]

## RELEASE 3.0.0-alpha.0 - 2019-08-31
### Added
- Command Update - New feature.

### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Add support for TIME type.`,
            );
          });

          it('should update the package.json', () => {
            expect(fs.readFileSync('package.json').toString()).equal(packageJsonFileContent({
              name: 'lumber-cli',
              description: 'Create your backend application in minutes. GraphQL API backend based on a database schema',
              version: '3.0.0-alpha.0',
            }));
          });

          it('should pull and commit changes', () => {
            expect(pulls[0]).equal('v4');
            expect(filesAdded).to.deep.equal(['CHANGELOG.md', 'package.json']);
            expect(commitMessage).equal('chore(release): 3.0.0-alpha.0');
            expect(pushes[0]).equal('v4');
          });

          it('should not checkout onto another branch', () => {
            expect(branches).empty;
          });

          it('should not merge onto master', () => {
            expect(mergeFrom).to.be.undefined;
            expect(mergeTo).to.be.undefined;
          });

          it('should add the correct tag', () => {
            expect(currentTag).equal('v3.0.0-alpha.0');
          });
        });
      });
    });
  });
});
