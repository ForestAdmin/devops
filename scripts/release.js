require('dotenv').config(); // eslint-disable-line
const { ReleaseManager } = require('../index'); // eslint-disable-line

new ReleaseManager(process.env.DEVOPS_SLACK_TOKEN, '🤖', { channel: 'G501BDD5W' }).create();
