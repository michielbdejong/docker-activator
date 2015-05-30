var Docker = require('dockerode'),
    docker = new Docker();

var stoppingContainerWaiters = {};

function getImageStatus(imageName, callback) {
  callback(null, { exists: false});
}

function getContainerStatus(containerName, callback) {
  docker.getContainer(containerName).inspect(function(err, res) {
    if (err) {
      if (err.statusCode === 404) {
        callback(null, { started: false, exists: false });
      } else {
        callback(err);
      }
    } else {
      var ipaddr = res.NetworkSettings.IPAddress;
      callback(err, {
        ipaddr: ipaddr,
        started: res.State.Running,
        exists: true
      });
    }
  });
}

function getRunningContainers(callback) {
  callback(null, []);
}

function pullImage(imageName, callback) {
  docker.pull(imageName, function(err, stream) {
    if (err) {
      callback(err);
    } else {
      stream.pipe(process.stdout);
      stream.on('end', function() {
        callback(null);
      });
    }
  });
}

function ensureImageExists(imageName, callback) {
  getImageStatus(imageName, function(err, data) {
    if (err) {
      callback(err);
    } else if (data.exists) {
      callback(null);
    } else {
      pullImage(imageName, callback);
    }
  });
}

function startContainer(container, containerName, callback) {
  container.start(function (err1) {
    if (err1) {
      callback(err1);
    } else {
      getContainerStatus(containerName, function(err2, data) {
console.log('container status', containerName, err2, data);
        callback(err2, data.ipaddr);
      });
    }
  });
}

//The startOptions parameter is set as the container's default start options
//whenever the requested container does not exist and needs to be created.
//It is are ignored when an existing container is already running,
//and also when it exists but was stopped.
function createAndStart(options, callback) {
  ensureImageExists(options.createOptions.Image, function(err1) {
    if (err1) {
      callback(err1);
    } else {
      //options.createOptions.Cmd = ['/bin/bash'];
      docker.createContainer(options.createOptions, function(err2, container) {
        if (err2) {
          callback(err2);
        } else {
          try {
            container.defaultOptions.start = options.startOptions;
          } catch(e) {
            callback('Could not bind in local data' + e);
            return;
          }
          startContainer(container, options.createOptions.name, callback);
        }
      });
    }
  });
}

function dockerStart(containerName, callback) {
  docker.getContainer(containerName, function(err1, container) {
    if (err1) {
      callback(err1);
    } else {
      startContainer(container, containerName, callback);
    }
  });
}

function ensureStarted(options, callback) {
  if (stoppingContainerWaiters[options.createOptions.name]) {
    stoppingContainerWaiters[options.createOptions.name].push(callback);
console.log('ensureStarted - container is stopping!');
  } else {
    getContainerStatus(options.createOptions.name, function(err, containerStatus) {
console.log('ensureStarted - container status', options.createOptions.name, err, containerStatus);
      if (err) {
        callback(err);
      } else if (containerStatus.started) {
        callback(null, containerStatus);
      } else if (containerStatus.exists) {
        dockerStart(options.createOptions.name, callback);
      } else {
        createAndStart(options, callback);
      }
    });
  }
}

function exec(containerName, command, callback) {
  docker.getContainer(containerName).exec({ Cmd: [ 'sh', command ] }, function(err, exec) {
    exec.start(function(err, stream) {
      if (err) {
        if (callback) {
          callback(err);
        }
      } else {
        stream.setEncoding('utf8');
        stream.pipe(process.stdout);
        stream.on('end', function() {
          //done with preShutDownCommand inside the container
          if (callback) {
            callback(null);
          }
        });
      }
    });
  });
}

function stop(containerName, preShutDownCommand, callback) {
  if (stoppingContainerWaiters[containerName]) {
    callback(null);
    return;
  } else {
    stoppingContainerWaiters[containerName] = [];
    exec(containerName, preShutDownCommand, function(err) {
      if (err) {
        callback('backup failed, not stopping this container now');
        delete stoppingContainerWaiters[containerName];
      } else {
        var container = docker.getContainer(containerName);
        container.stop(function(err) {
          var waiters = stoppingContainerWaiters[containerName];
          delete stoppingContainerWaiters[containerName];
          callback(err);
          if (waiters.length) {
            container.start(function(err, res) {
              for (var i=0; i<waiters.length; i++) {
                waiters[i](err);
              }
            });
          }
        });
      }
    });
  }
}

module.exports = {
  getRunningContainers: getRunningContainers,
  ensureStarted: ensureStarted,
  stop: stop
};
