var tressa = require('tressa');

var broadcast = require('../cjs').new();

tressa.title('broadcast');
tressa.assert(typeof broadcast === 'object', 'module');

tressa.async(function (done) {
  var random = Math.random();
  var sameCalls = 0;
  var thingsCalls = [];
  broadcast.that('random', random);
  broadcast.when('random').then(function (value) {
    tressa.assert(value === random, 'promise resolved with right value');
  });
  broadcast.when('random', function (value) {
    tressa.assert(value === random, 'callback executed with right value');
  });
  broadcast.when('another').then(function (value) {
    tressa.assert(value !== random, 'another promise resolved with right value');
  });
  broadcast.when('another', same);
  broadcast.when('another', same);
  broadcast.that('another')(Math.random());
  broadcast.all('things', things);
  broadcast.all('things', things);
  broadcast.that('things')(1);
  broadcast.that('things')(2);
  broadcast.that('things')(3);
  setTimeout(function () {
    tressa.assert(JSON.stringify(thingsCalls) === '[1,2,3]', 'things invoked 3 times with 3 values');
    broadcast.drop('things', things);
    broadcast.that('things')(1);
    setTimeout(function () {
      tressa.assert(thingsCalls.length === 3, 'things was removed from invokes');
      broadcast.drop('things', things);
      broadcast.drop('things');
      broadcast.when('dropped', function (value) {
        tressa.assert(value === true, 'even dropped right away, .that(...) notifies listeners');
        done();
      });
      broadcast.that('dropped', true);
      broadcast.drop('dropped');
    }, 100);
  }, 100);
  function things(value) {
    thingsCalls.push(value);
  }
  function same(value) {
    if (sameCalls++) throw new Error('too many invokes');
    tressa.assert(value !== random, 'another callback executed with right value');
  }
});
