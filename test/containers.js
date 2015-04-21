var assert = require('chai').assert;
var request = require('supertest');

var containers = require("../containers");

describe('containers file', function() {
  it('should have a getRunningContainers method', function(done) {
    assert.typeOf(containers.getRunningContainers, 'function');
    done();
  });
  it('should have a ensureStarted method', function(done) {
    assert.typeOf(containers.ensureStarted, 'function');
    done();
  });
  it('should have a stop method', function(done) {
    assert.typeOf(containers.stop, 'function');
    done();
  });
  it('should start and stop a container', function(done) {
    containers.ensureStarted('docker-activator-test1', 'ubuntu', {}, [], function(err1) {
      assert.equal(err1, null);
      containers.getRunningContainers(function(err2, list) {
        assert.equal(err2, null);
        assert.equal(list, ['docker-activator-test1']);
        containers.stop('docker-activator-test1', function(err3) {
          assert.equal(err3, null);
          containers.getRunningContainers(function(err4, list) {
            assert.equal(err4, null);
            assert.equal(list, []);
          });
       });
     });
   });
 });
});
