const mockFs = require('mock-fs');
const mockRequire = require('mock-require');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const {
  SlackTokenMissingError,
  SlackConnectionError,
  ProjectIconMissingError,
  WronglyFormattedChangelogError,
} = require('../../utils/errors');
let ReleaseNoteCreator = require('../../services/release-note-creator');

const { expect } = chai;

describe('Services > Release Note Creator', () => {
  let slackToken;
  let uploadedContent;
  let slackServicesUp = true;

  before(() => {
    mockRequire('@slack/client', {
      WebClient: function WebClient(token) {
        slackToken = token;

        this.files = {
          upload(file) {
            if (slackServicesUp) {
              uploadedContent = file;
              return Promise.resolve();
            } else {
              return Promise.reject(new Error('Cannot upload the file on Slack'));
            }
          },
        };

        return this;
      },
    });

    ReleaseNoteCreator = mockRequire.reRequire('../../services/release-note-creator');
  });

  describe('with no Slack token', () => {
    it('should throw an error', () => {
      expect(() => new ReleaseNoteCreator(null, '😁')).to.throw(SlackTokenMissingError);
    });
  });

  describe('with no project icon', () => {
    it('should throw an error', () => {
      expect(() => new ReleaseNoteCreator('fake')).to.throw(ProjectIconMissingError);
    });
  });

  describe('with no CHANGELOG.md', () => {
    it('should throw an error', () => {
      expect(() => new ReleaseNoteCreator('fake', '😁').perform())
        .to.throw(WronglyFormattedChangelogError);
    });
  });

  describe('with an empty CHANGELOG.md', () => {
    const changelog = '';

    before(() => {
      mockFs({
        'CHANGELOG.md': changelog,
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should throw a WronglyFormattedChangelogError error', () => {
      expect(() => new ReleaseNoteCreator('fake', '😁').perform())
        .to.throw(WronglyFormattedChangelogError);
    });
  });

  describe('with a custom channel', () => {
    const changelog = `
# Changelog
## [Unreleased]

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.
    `;

    before(() => {
      mockFs({
        'CHANGELOG.md': changelog,
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should set the channel', () => {
      new ReleaseNoteCreator('fake', '😁', { channel: 'test' })
        .perform();

      expect(uploadedContent).to.not.be.undefined;
      expect(uploadedContent.channels).equal('test');
    });
  });

  describe('Changelog with no version', () => {
    const changelog = `
# Changelog
## [Unreleased]
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.

### Fixed
- Style - Update style.
    `;
    const packageJson = `{
      "name": "forestapi-server",
      "description": "Official Forest API for the projects management",
      "version": "0.0.0"
    }`;
    before(() => {
      mockFs({
        'CHANGELOG.md': changelog,
        'package.json': packageJson,
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should send the note correctly formatted to slack', () => {
      new ReleaseNoteCreator('fake', '😁')
        .perform();

      expect(slackToken).equal('fake');
      expect(uploadedContent).to.deep.equal({
        channels: 'CMLBBF6Q3',
        filename: 'RELEASE 😁 2019-08-23.md',
        filetype: 'post',
        content: '## 🍿 Changed\n- Admin - Upgrade the liana to the latest beta version.\n\n## 💉 Fixed\n- Style - Update style.',
      });
    });
  });

  describe('Changelog with version', () => {
    const changelog = `
# Changelog
## [Unreleased]
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE 3.2.6 - 2019-08-22
### Fixed
- Serializer - Fix serialization of records with id 0.
    `;
    const packageJson = `{
      "name": "forest-express",
      "description": "Official package for all Forest Express Lianas",
      "version": "3.2.6"
    }`;
    before(() => {
      mockFs({
        'CHANGELOG.md': changelog,
        'package.json': packageJson,
      });
    });

    after(() => {
      mockFs.restore();
    });

    it('should send the note correctly formatted to slack', () => {
      new ReleaseNoteCreator('fake', '😁', { withVersion: true })
        .perform();

      expect(slackToken).equal('fake');
      expect(uploadedContent).to.deep.equal({
        channels: 'CMLBBF6Q3',
        filename: 'RELEASE 😁 2019-08-22.md',
        filetype: 'post',
        content: '# forest-express v3.2.6\n\n## 💉 Fixed\n- Serializer - Fix serialization of records with id 0.',
      });
    });
  });

  describe('with an error during file upload', () => {
    const changelog = `
# Changelog
## [Unreleased]
### Added
- Technical - Tests.

### Changed
- Test - New way.

## RELEASE - 2019-08-23
### Changed
- Admin - Upgrade the liana to the latest beta version.

### Fixed
- Style - Update style.
    `;

    before(() => {
      slackServicesUp = false;
      mockFs({
        'CHANGELOG.md': changelog,
      });
    });
    after(() => {
      mockFs.restore();
    });

    ReleaseNoteCreator = mockRequire.reRequire('../../services/release-note-creator');

    it('should', async () => {
      await expect(new ReleaseNoteCreator('fake', '😁').perform())
        .to.be.rejectedWith(SlackConnectionError);
    })
  });
});
