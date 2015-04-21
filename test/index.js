var assert = require('chai').assert;
var request = require('supertest');

var index = require("../index");

describe('index file', function() {
  it('should have a init method', function(done) {
    assert.typeOf(index.init, 'function');
    done();
  });
  it('should have a ensureStarted method', function(done) {
    assert.typeOf(index.ensureStarted, 'function');
    done();
  });
  it('should have a maybeStopOneContainer method', function(done) {
    assert.typeOf(index.maybeStopOneContainer, 'function');
    done();
  });
  it('should start and stop a container', function(done) {
    index.init();
    index.ensureStarted({
      imageName: 'ubuntu',
      containerName: 'docker-activator-test',
      memLimit: 200 * 1024 * 1024,
      envVars: {
        FOO: 'bar'
      },
      binds: [ '/tmp:/data'],
    }, function(err1, data) {
      assert.equal(err1, null);
      assert.typeOf(data, 'object');
      assert.typeOf(data.ipaddr, 'string');
      index.maybeStopOneContainer(0, 'echo $FOO > /data/docker-activator-test.txt', function(err2) {
        assert.equal(err2, null);
        fs.readFile('/tmp/docker-activator-test.txt', function(err3, data) {
          assert.equal(err3, null);
          assert.equal(data, 'bar');
          done();
        });
      });
    });
  });
});
