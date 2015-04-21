var assert = require('chai').assert;
var request = require('supertest');

var lru = require("../lru");

describe('lru file', function(){
  it('should have a ping method', function(done){
    assert.typeOf(lru.ping, 'function');
    done();
  });
  it('should have a pingList method', function(done){
    assert.typeOf(lru.pingList, 'function');
    done();
  });
  it('should have a getOldest method', function(done){
    assert.typeOf(lru.getOldest, 'function');
    done();
  });
  it('should return only pinged as oldest', function(done){
    lru.ping('foo');
    lru.getOldest(function(err, data) {
      assert.equal(err, null);
      assert.typeOf(data, 'object');
      assert.equal(data.containerName, 'foo');
      assert.typeOf(data.age, 'number');
      done();
    });
  });
  it('should ping a list', function(done){
    lru.pingList(['bar']);
    lru.remove('foo');
    lru.getOldest(function (err, data) {
      assert.equal(err, null);
      assert.typeOf(data, 'object');
      assert.equal(data.containerName, 'bar');
      assert.typeOf(data.age, 'number');
      done();
    });
  });
});
