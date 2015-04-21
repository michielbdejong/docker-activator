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
        containers.stop(data.containerName, preShutDownCommand, callback);
      }
    }
  });
} 

//
// options:
// * imageName
// * containerName
// * envVars
// * memLimit
// * binds

function ensureStarted(options, callback) {
  if (typeof options !== 'object') {
    callback('please provide an options object');
  } else if (typeof options.imageName !== 'string') {
    callback('please provide an options.imageName string');
  } else if (typeof options.containerName !== 'string') {
    callback('please provide an options.containerName string');
  } else if (typeof options.envVars !== 'object') {
    callback('please provide an options.envVars object');
  } else if (typeof options.memLimit !== 'number') {
    callback('please provide an options.memLimit number');
  } else if (!Array.isArray(options.binds)) {
    callback('please provide an options.binds array');
  } else {
    var envVarArr = [];
    for (var i in options.envVars) {
      envVarArr.push(i + '=' + options.envVars[i]);
    }
    var createOptions = {
      Image: options.imageName,
      name: options.containerName,
      Hostname: options.containerName,
      Memory: options.memLimit,
      MemorySwap: -1,
      Env: envVarArr
    };
    containers.ensureStarted(options.containerName, options.imageName, createOptions, options.binds, callback);
  }
}

module.exports = {
  init: init,
  ensureStarted: ensureStarted,
  maybeStopOneContainer: maybeStopOneContainer
};
