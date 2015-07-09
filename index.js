var containers = require('./containers'),
    lru = require('./lru');

function init(callback) {
  containers.getRunningContainers(function(err, list) {
    if (err) {
      callback(err);
    } else {
      lru.pingList(list, callback);
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
