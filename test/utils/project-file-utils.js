const chai = require('chai');
chai.use(require('chai-as-promised'));
const { packageJsonFileContent } = require('../../utils/project-file-utils');

const { expect } = chai;

describe('Utils', () => {
  describe('packageJsonFileContent', () => {
    it('should convert JSON object to string including a new line', async () => {
      expect(packageJsonFileContent({ version: '1'})).equal('{\n  "version": "1"\n}\n');
    });
  });
});
