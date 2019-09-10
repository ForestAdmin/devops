# Forest Admin DevOps Tools
[![Build Status](https://travis-ci.com/ForestAdmin/devops.svg?token=GhLkKxborSQok42EpFsc&branch=devel)](https://travis-ci.org/ForestAdmin/devops)
![Coverage](https://img.shields.io/badge/coverage-100%25%0A-success)

## Slack Token
You can create a token by following this link https://api.slack.com/custom-integrations/legacy-tokens.

## How to?

### Release
This process will:
- merge `devel` into `master` (if necessary),
- add a specific tag (if necessary)
- send a note of the changes released to a specific Slack channel.

```JavaScript
import { ReleaseManager } from '@forestadmin/devops';

const slackToken = process.env.DEVOPS_SLACK_TOKEN;
const releaseIcon = '🌱';
const options = {};

new ReleaseManager(slackToken, releaseIcon, options).create();
```

Arguments:
- `slackToken`: A token that you can get here https://api.slack.com/custom-integrations/legacy-tokens
- `releaseIcon`: An icon representing the project
- `options`:
  - `withVersion`: Boolean. True if project has version.
  - `channel`: String. The slack channel to send to.

### Update the coverage badge
This process will update the coverage badge in the `README.md` file base on the `lcov` coverage report.

```JavaScript
import { CoverageManager } from '@forestadmin/devops';

new CoverageManager().updateBadge();
```
