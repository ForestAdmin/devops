# Forest Admin DevOps Tools
[![npm package](https://badge.fury.io/js/%40forestadmin%2Fdevops.svg)](https://badge.fury.io/js/%40forestadmin%2Fdevops)
[![Build Status](https://travis-ci.com/ForestAdmin/devops.svg?token=GhLkKxborSQok42EpFsc&branch=devel)](https://travis-ci.org/ForestAdmin/devops)
![Coverage](https://img.shields.io/badge/coverage-99%25%0A-success)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Slack Token
You can create a token by following this link https://api.slack.com/custom-integrations/legacy-tokens.

## How to?

### Release
This process will:
- merge `devel` into `master` (if necessary),
- add a specific tag (if necessary).

```javascript
require('dotenv').config();
import { ReleaseManager } from '@forestadmin/devops';

const OPTIONS = { withVersion: true };
new ReleaseManager(OPTIONS).create();
```

Arguments:
- `options`:
  - `withVersion`: Boolean. True if project has version.

### Send a release note
Sends a note of the changes released to a specific Slack channel.

```javascript
require('dotenv').config();
import { ReleaseNoteManager } from '@forestadmin/devops';

const { DEVOPS_SLACK_TOKEN, DEVOPS_SLACK_CHANNEL } = process.env;
const OPTIONS = { releaseIcon: '🌱', withVersion: true };

new ReleaseNoteManager(DEVOPS_SLACK_TOKEN, DEVOPS_SLACK_CHANNEL, OPTIONS).create();
```

Arguments:
- `slackToken`: A Slack token that you can generate here https://api.slack.com/custom-integrations/legacy-tokens.
- `slackChannel`: A Slack channel identifier to publish.
- `options`:
  - `withVersion`: Boolean. True if project has version.
  - `releaseIcon`: An icon representing the project.


### Update the coverage badge
This process will update the coverage badge in the `README.md` file base on the `lcov` coverage report.

```javascript
import { CoverageManager } from '@forestadmin/devops';

new CoverageManager().updateBadge();
```
