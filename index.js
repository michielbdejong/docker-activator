var containers = require('./containers'),
    lru = require('./lru'),
    lastRunningCheck = 0,
    RUNNING_CHECK_INTERVAL = 600 * 1000;

function init(callback) {
  maybeDoRunningCheck(callback);
}

function maybeDoRunningCheck(callback) {
  if (new Date().getTime() - lastRunningCheck < RUNNING_CHECK_INTERVAL) {
    callback(null);
    return;
  }
  containers.getRunningContainers(function(err, list) {
    if (err) {
      callback(err);
    } else {
      lru.updateList(list, callback);
    }
  });
}

function maybeStopOneContainer(maxIdle, preShutdownCommand, callback) {
  lru.getOldest(function(err, data) {
    if (err) {
      callback(err);
      return;
    } else {
      if (data.age > maxIdle) {
        containers.stop(data.containerName, preShutdownCommand, callback);
        lru.remove(data.containerName);
      }
    }
  });
} 

function ensureStarted(options, callback) {
  lru.ping(options.createOptions.name);
  containers.ensureStarted(options, callback);
}

module.exports = {
  init: init,
  ensureStarted: ensureStarted,
  maybeStopOneContainer: maybeStopOneContainer
};
