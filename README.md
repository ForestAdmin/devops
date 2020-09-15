# Forest Admin DevOps Tools
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm package](https://badge.fury.io/js/%40forestadmin%2Fdevops.svg)](https://badge.fury.io/js/%40forestadmin%2Fdevops)
[![Build Status](https://travis-ci.com/ForestAdmin/devops.svg?token=GhLkKxborSQok42EpFsc&branch=devel)](https://travis-ci.org/ForestAdmin/devops)
[![Maintainability](https://api.codeclimate.com/v1/badges/195b22d2a89905891ec3/maintainability)](https://codeclimate.com/github/ForestAdmin/devops/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/195b22d2a89905891ec3/test_coverage)](https://codeclimate.com/github/ForestAdmin/devops/test_coverage)

## How to?

### Update the coverage badge
This process will update the coverage badge in the `README.md` file base on the `lcov` coverage report.

```javascript
import { CoverageManager } from '@forestadmin/devops';

new CoverageManager().updateBadge();
```
