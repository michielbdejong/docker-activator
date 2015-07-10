var startTime = new Date().getTime(),
    lastUsed = {};

function ping(containerName) {
  lastUsed[containerName] = new Date().getTime();
}

function updateList(list, callback) {
  var now = new Date().getTime();
  var newList = {};
  for (var i=0; i<list.length; i++) {
    if (lastUsed[list[i]]) {
      newList[list[i]] = lastUsed[list[i]];
    } else {
      newList[list[i]] = now;
    }
  }
  lastUsed = newList;
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
  updateList: updateList,
  getOldest: getOldest,
  remove: remove
};
