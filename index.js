const BadgeCoverageUpdater = require('./services/badge-coverage-updater');
const ClickUpStatusUpdater = require('./services/clickup-status-updater');

function CoverageManager() {
  this.updateBadge = async () => new BadgeCoverageUpdater().perform();
}

function ClickUpManager() {
  this.updateStatus = () => new ClickUpStatusUpdater().handleEvent();
}

module.exports = {
  CoverageManager,
  ClickUpManager,
};
