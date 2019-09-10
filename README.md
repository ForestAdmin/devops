# Forest Admin DevOps Tools
[![Build Status](https://travis-ci.com/ForestAdmin/devops.svg?token=GhLkKxborSQok42EpFsc&branch=devel)](https://travis-ci.org/ForestAdmin/devops)
![Coverage](https://img.shields.io/badge/coverage-94%25%0A-important)

## Slack Token
You can create a token by following this link https://api.slack.com/custom-integrations/legacy-tokens.

## How to ?

### Do a release
This will merge if necessary devel onto master, add specific tag and send a note to slack.
```JavaScript
import { ReleaseManager } from '@forestadmin/devops';
// Or with require
const { ReleaseManager } = require('@forestadmin/devops');

new ReleaseManager(slackToken, releaseIcon, options);
```

Arguments:
- slackToken: A token that you can get here https://api.slack.com/custom-integrations/legacy-tokens
- releaseIcon: An icon representing the project
- options:
  - withVersion: Boolean. True if project has version.
  - channel: String. The slack channel to send to.
