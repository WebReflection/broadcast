/*!
Copyright (C) 2015-2017 by Andrea Giammarchi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
/**
 * // assuming "data" event hasn't happened yet
 * broadcast.when("data", function (data) {
 *   console.log(data);
 * });
 *
 * // whenever it will happen
 * broadcast.that("data", {any:'value'});
 * // all listeners waiting for it, will be triggered
 *
 *
 * // what if you add a listener after the `.that` call?
 * broadcast.when("data", function (data) {
 *   console.log('yep, instantly called!', data);
 * });
 *
 *
 * // what if we redefine data ?
 * broadcast.that("data", {another:'value'});
 * // from now on, whoever will ask `.when` data
 * // the value will be the updated one
 * // but every listener already fired and satisfied
 * // will be simply ignored
 *
 *
 * // what if I want to be sure the channel is private?
 * // feel free to use a Symbol as channel
 * var myPrivateSymbol = Symbol();
 * broadcast.when(myPrivateSymbol, ...);
 *
 * // otherwise create a new broadcast like variable
 * var privateBroadcast = broadcast.new();
 */
function create(O) {'use strict';

  var
    // flag for internal operations (used by all)
    invoke = true,
    // create a dictionary, fallback as regular object
    _ = (O.create || O)(null),
    // dictionaries don't have this method, borrow it
    hOP = O.prototype.hasOwnProperty,
    // will invoke the callback within the Promise
    broadcast = function (args) {
      this.apply(null, args);
    },
    // IE < 9 doesn't have this method, sham it
    bind = O.bind || function (self) {
      var cb = this;
      return function () {
        return cb.apply(self, arguments);
      };
    },
    // IE < 9 doesn't have this method, sham it
    indexOf = Array.prototype.indexOf || function indexOf(v) {
      var i = this.length;
      while (i-- && this[i] !== v) {}
      return i;
    },
    resolve = typeof Promise == 'undefined' ?
      function (value) {
        return {then: function (cb) {
          setTimeout(cb, 1, value);
        }};
      } :
      function (value) {
        return Promise.resolve(value);
      },
    // little partial WeakMap poly
    wm = typeof WeakMap == 'undefined' ?
      (function (k, v) {
        return {
          // delete used to be a reserved property name
          'delete': function (x) {
            var i = indexOf.call(k, x);
            k.splice(i, 1);
            v.splice(i, 1);
          },
          get: function (x) {
            return v[indexOf.call(k, x)];
          },
          set: function (x, y) {
            v[k.push(x) - 1] = y;
          }
        };
      }([], [])) :
      new WeakMap()
  ;

  // check if a private _[type] is known
  // if not, create the info object
  // returns such object either cases
  function get(type) {
    return hOP.call(_, type) ?
      _[type] :
      (_[type] = {
        args: null,
        cb: []
      });
  }

  function that(type) {
    var
      len = arguments.length,
      info = get(type),
      i = 1,
      cb
    ;
    // in case it's invoked
    // without any error or value
    if (i === len) {
      // creates a callback
      // that once  invoked will resolve
      return function () {
        var args = [type];
        args.push.apply(args, arguments);
        return that.apply(null, args);
      };
    }
    // in  every other case
    // resolve the type with any amount
    // of arguments received
    else {
      info.args = [];
      while (i < len) info.args.push(arguments[i++]);
      i = 0;
      len = info.cb.length;
      // be sure the list of waiting listeners
      // will be cleaned up so these won't
      // every be notified more than  once
      // ( unless these are passed again via `.when` )
      // NOTE:  .splice(0) would be enough
      //        but IE8 wants the length too
      cb = info.cb.splice(i, len);
      while (i < len) resolve(info.args).then(bind.call(broadcast, cb[i++]));
    }
    return info.args[0];
  }

  function when(type, callback) {
    var info = get(type), out;
    if (arguments.length === 1) {
      out = new Promise(function (resolve) {
        callback = resolve;
      });
    }
    if (invoke && info.args) {
      resolve(info.args).then(bind.call(broadcast, callback));
    } else if(indexOf.call(info.cb, callback) < 0) {
      info.cb.push(callback);
    }
    return out;
  }

  // freeze, if possible, the broadcast object
  // to be sure no other scripts can change its methods
  return (O.freeze || O)({

    // There are two ways to use this method
    //
    // .when(type, callback)
    //    add a listener to a generic type
    //    whenever such type will happen
    //    or if it happened already
    //    invoke the callback with the resolved value
    //
    // .when(type)
    //    return a new Promise that will be resolved
    //    once the notification will happen
    //
    //    broadcast.when('event').then(function (data) { ... });
    //
    when: when,

    // .about is an alias for .that
    about: that,

    // There are two ways to use this method
    //
    // .that(type)
    //    will return a callback
    //    that will try to resolve once executed
    //    fs.readFile('setup.json', broadcast.that('setup.json'))
    //
    // overload
    // .that(type, any1[, any2[, ...]])
    //    resolve type passing anyValue around
    //
    //    // through one argument
    //    broadcast.that('some-event', {all: 'good'});
    //    // through more arguments
    //    broadcast.that('some-event', null, 'OK');
    //
    that: that,

    // if we set a listener through `.when`
    // and this hasn't been notified yet
    // but we changed our mind about such notification
    // we can still remove such listener via `.drop`
    drop: function drop(type, callback) {
      var fn = wm.get(callback), cb, i;
      if (fn) {
        wm['delete'](callback);
        drop(type, fn);
      } else {
        cb = get(type).cb;
        i = indexOf.call(cb, callback);
        if (~i) cb.splice(i, 1);
      }
    },

    // create a new broadcast-like object
    'new': function () {
      return create(O);
    },

    // in case we'd like to react each time
    // to a specific event.
    // In this case a callback is mandatory,
    // and it's also needed to eventually drop.
    all: function all(type, callback) {
      if (!wm.get(callback)) {
        wm.set(callback, function fn() {
          invoke = false;
          when(type, fn);
          invoke = true;
          resolve(arguments).then(bind.call(broadcast, callback));
        });
        when(type, wm.get(callback));
      }
    }
  });
}
module.exports = create(Object);