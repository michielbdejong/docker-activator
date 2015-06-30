var startTime = new Date().getTime(),
    lastUsed = {};

function ping(containerName) {
  lastUsed[containerName] = new Date().getTime();
}

function pingList(list, callback) {
  for (var i=0; i<list.length; i++) {
    ping(list[i]);
  }
  callback(null);
}

function getOldest(callback) {
  var oldestName, oldestTime = Infinity;
  for (var i in lastUsed) {
    if (lastUsed[i] < oldestTime) {
      oldestName = i;
      oldestTime = lastUsed[i];
    }
  }
  callback(null, {
    containerName: oldestName,
    age: (new Date().getTime() - oldestTime)
  });
}

function remove(containerName) {
  delete lastUsed[containerName];
}

module.exports = {
  ping: ping,
  pingList: pingList,
  getOldest: getOldest,
  remove: remove
};
