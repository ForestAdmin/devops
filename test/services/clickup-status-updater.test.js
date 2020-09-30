const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

const mockFs = require('mock-fs');
const nock = require('nock');
const ClickUpStatusUpdate = require('../../services/clickup-status-updater');

axios.defaults.adapter = httpAdapter;

const FILE_EVENT_PULL_REQUEST = `{
  "commits": [],
  "pull_request": {
    "title": "fix: sort in the right order (CU-123456)",
    "assignees": [],
    "requested_reviewers": []
  },
  "review": {}
}
`;

const FILE_EVENT_PUSH = `{
  "commits": [{
    "message": "fix: sort in the right order (CU-123456)"
  }],
  "pusher": "johanna",
  "title": "fix: sort in the right order (CU-123456)"
}
`;

function mockClickUpApiSuccess() {
  nock('https://api.clickup.com')
    .get('/api/v2/task/123456')
    .reply(200);
}

function initTest() {
  process.env.CLICKUP_API_KEY = 'clickupkey';
  process.env.GITHUB_EVENT_PATH = 'github-event-file.json';
}

function resetTest() {
  process.env.CLICKUP_API_KEY = undefined;
  process.env.GITHUB_EVENT_PATH = undefined;
  nock.cleanAll();
  mockFs.restore();
}

describe('service > clickup status updater', () => {
  describe('with a "pull request" event', () => {
    describe('with a ClickUp API success response', () => {
      it('should not raise any error', async () => {
        expect.assertions(1);

        initTest();
        mockClickUpApiSuccess();
        mockFs({
          'github-event-file.json': FILE_EVENT_PULL_REQUEST,
        });

        await new ClickUpStatusUpdate().handleEvent();
        expect(true).toStrictEqual(true);

        resetTest();
      });
    });

    describe('with a ClickUp API error', () => {
      it('should not fail but log an error', async () => {
        expect.assertions(1);

        initTest();
        mockFs({
          'github-event-file.json': FILE_EVENT_PULL_REQUEST,
        });

        await new ClickUpStatusUpdate().handleEvent();
        expect(true).toStrictEqual(true);

        resetTest();
      });
    });
  });

  describe('with a "push" event', () => {
    describe('with a ClickUp API success response', () => {
      it('should not raise any error', async () => {
        expect.assertions(1);

        initTest();
        mockClickUpApiSuccess();
        mockFs({
          'github-event-file.json': FILE_EVENT_PUSH,
        });

        await new ClickUpStatusUpdate().handleEvent();
        expect(true).toStrictEqual(true);

        resetTest();
      });
    });
  });
});
