var Docker = require('dockerode'),
    docker = new Docker();

var stoppingContainerWaiters = {};

function getImageStatus(imageName, callback) {
  callback(null, { exists: true});
}

function getContainerStatus(containerName, callback) {
  docker.getContainer(containerName).inspect(function(err, res) {
    console.log(err, res);
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

function dockerRun(containerName, imageName, createOptions, binds, callback) {
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

function startContainer(container, callback) {
  container.start(function (err1) {
    if (err1) {
      callback(err1);
    } else {
      getContainerStatus(containerName, function(err2, data) {
        callback(err2, data.ipaddr);
      });
    }
  });
}

//The startOptions parameter is set as the container's default start options
//whenever the requested container does not exist and needs to be created.
//It is are ignored when an existing container is already running,
//and also when it exists but was stopped.
function createAndStart(containerName, imageName, createOptions, startOptions, callback) {
  console.log('createAndStart', containerName, imageName, createOptions, binds);
  ensureImageExists(imageName, function(err1) {
    if (err1) {
      callback(err1);
    } else {
      createOptions.Cmd = ['/bin/bash'];
      docker.createContainer(createOptions, function(err2, container) {
        if (err2) {
          callback(err2);
        } else {
          try {
            container.defaultOptions.start = startOptions;
          } catch(e) {
            callback('Could not bind in local data' + e);
            return;
          }
          startContainer(container, callback);
        }
      });
    }
  });
}

function dockerStart(containerName, callback) {
  console.log('dockerStart', containerName);
  docker.getContainer(containerName, function(err1, container) {
    if (err1) {
      callback(err1);
    } else {
      startContainer(container, callback);
    }
  });
}

function ensureStarted(containerName, imageName, createOptions, startOptions, callback) {
  if (stoppingContainerWaiters[containerName]) {
    stoppingContainerWaiters[containerName].push(callback);
  } else {
    getContainerStatus(containerName, function(err, containerStatus) {
      if (err) {
        callback(err);
      } else if (containerStatus.started) {
        callback(null, containerStatus);
      } else if (containerStatus.exists) {
        dockerStart(containerName, callback);
      } else {
        createAndStart(containerName, imageName, createOptions, startOptions, callback);
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
        console.log('backup failed, not stopping this container now');
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
