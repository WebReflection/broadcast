// run the test
var delay = 30;
var later = 1;
var test = require('tressa');

if (!process.env.NATIVE) {
  // drop native to force use polyfills
  // and be sure everything is covered
  var WeakMap = global.WeakMap;
  global.WeakMap = undefined;
  var Promise = global.Promise;
  global.Promise = undefined;
  var indexOf = global.Array.prototype.indexOf;
  global.Array.prototype.indexOf = undefined;
  var bind = global.Function.prototype.bind;
  global.Function.prototype.bind = undefined;
  var create = global.Object.create;
  global.Object.create = undefined;
  var freeze = global.Object.freeze;
  global.Object.freeze = undefined;
}
// grab the module
var notify = require('../build/broadcast.node.js');

if (!process.env.NATIVE) {
  // put everything back where it was
  global.WeakMap = WeakMap;
  global.Promise = Promise;
  global.Array.prototype.indexOf = indexOf;
  global.Function.prototype.bind = bind;
  global.Object.create = create;
  global.Object.freeze = freeze;
}

test.title('broadcast');
test(typeof notify === 'object', 'module');

test.async(function (done) {
  var i = 0, r = Math.random();
  function increase() { i++; }
  notify.when('test-when', increase);
  setTimeout(function () {
    test.log('## when');
    test(i === 0, 'did not happen');
    notify.that('test-when', r);
    test(i === 0, 'happens asynchronously');
    setTimeout(function () {
      test(i === 1, 'it was invoked');
      notify.that('test-when', r);
      setTimeout(function () {
        test(i === 1, 'it was NOT invoked');
        notify.when('test-when', increase);
        setTimeout(function () {
          test(i === 2, 'it was invoked again');
          done();
        }, delay);
      }, delay);
    }, delay);
  }, delay * later);
});

later += 5;

test.async(function (done) {
  var
    r1 = Math.random(),
    r2 = r1 + Math.random(),
    v
  ;
  function about(value) { v = value; }
  notify.when('test-about', about);
  setTimeout(function () {
    test.log('## that');
    test(v === undefined, 'never invoked');
    notify.that('test-about', r1);
    setTimeout(function () {
      test(v === r1, 'value assigned');
      v = null;
      notify.when('test-about', about);
      notify.that('test-about', r2);
      notify.when('test-about', about);
      setTimeout(function () {
        test(v === r2, 'new value');
        done();
      }, delay);
    }, delay);
  }, delay * later);
});

later += 5;

test.async(function (done) {
  var i = 0, r = Math.random();
  function increase() { i++; }
  notify.when('test-drop', increase);
  notify.drop('test-drop', increase);
  notify.that('test-drop', r);
  setTimeout(function () {
    test.log('## drop');
    test(i === 0, 'it was NOT invoked');
    done();
  }, delay * later);
});


later += 5;

test.async(function (done) {
  var other = notify['new']();
  var which = '', r = Math.random();
  other.when('test-new', function () {
    which += 'other';
  });
  notify.when('test-new', function () {
    which += 'notify';
  });
  other.that('test-new', r);
  setTimeout(function () {
    test.log('## new');
    test(which === 'other', 'invoked as other');
    notify.that('test-new', r);
    setTimeout(function () {
      test(which === 'othernotify', 'invoked as notify');
      done();
    }, delay);
  }, delay * later);
});

later += 5;

test.async(function (done) {
  var args;
  function increase() { args = arguments; }
  notify.when('test-multiple-arguments', increase);
  notify.that('test-multiple-arguments', 1, 2);
  setTimeout(function () {
    test.log('## multiple arguments');
    test(args[0] === 1 && args[1] === 2 && args.length === 2, 'expected arguments');
    done();
  }, delay * later);
});

later += 5;

test.async(function (done) {
  var args;
  function increase() { args = arguments; }
  notify.when('test-create-callback', increase);
  setTimeout(function () {
    test.log('## create callback');
    var fn = notify.that('test-create-callback');
    test(typeof fn === 'function', 'a function is returned');
    setTimeout(function () {
      test(!args, 'nothing was resolved');
      fn('a', 'b', 'c');
      setTimeout(function () {
        test(
          args[0] === 'a' &&
          args[1] === 'b' &&
          args[2] === 'c',
          'listeners was invoked'
        );
        done();
      }, delay);
    }, delay);
  }, delay * later);
});

later += 5;

test.async(function (done) {
  var i = 0, r = Math.random();
  function increase() { i++; }
  notify.all('test-all', increase);
  setTimeout(function () {
    test.log('## all');
    test(i === 0, 'did not happen');
    notify.that('test-all', r);
    test(i === 0, 'happens asynchronously');
    setTimeout(function () {
      test(i === 1, 'it was invoked');
      notify.that('test-all', r);
      test(i === 1, 're-happens asynchronously');
      setTimeout(function () {
        test(i === 2, 'it was invoked');
        notify.drop('test-all', increase);
        notify.that('test-all', r);
        setTimeout(function () {
          test(i === 2, 'it was NOT invoked again');
          done();
        }, delay);
      }, delay);
    }, delay);
  }, delay * later);
});

later += 5;

test.async(function (done) {
  setTimeout(function () {
    test.log('## .that(type, value):value');
    var rand = Math.random();
    var through = notify.that('test-through', rand);
    notify.when('test-through', function (value) {
      test(value === rand, 'same value resolved');
      done();
    });
  }, delay * later);
});

if (typeof Promise !== 'undefined') {
    later += 5;

    test.async(function (done) {
    setTimeout(function () {
        test.log('## .when(type):Promise');
        var v = Math.random(), args;
        var p = notify.when('test-promise');
        test(typeof p === 'object', 'object returned');
        notify.that('test-promise', v);
        p.then(function (value) {
        test(value === v, 'the value is the right one');
        done();
        });
    }, delay * later);
  });

  later += 5;

  test.async(function (done) {
    setTimeout(function () {
      var rand = Math.random();
      test.log('## .when(type):futureValue');
      Promise.resolve(rand)
        .then(notify.that('test-future-value'))
        .then(function (value) {
          notify.when('test-future-value').then(function (later) {
            test(value === later, 'later value is the same');
            test(value === rand, 'later value is correct');
            done();
          });
      });
    }, delay * later);
  });

}
