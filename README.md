broadcast [![build status](https://secure.travis-ci.org/WebReflection/broadcast.svg)](http://travis-ci.org/WebReflection/broadcast) [![Coverage Status](https://s3.amazonaws.com/assets.coveralls.io/badges/coveralls_100.svg)](https://coveralls.io/github/WebReflection/broadcast?branch=master)
=========

Previously known as [notify-js](https://www.webreflection.co.uk/blog/2015/08/14/the-line-between-events-and-promises),
`broadcast` is a private or public notification chanel inspired by standards.

Useful for loaders, components bootstrap, geo position updates, and all other asynchronous or on demand user granted privileges operations, `broadcast` works on every browser and every platform, it's 100% tests covered, and it weights less than 1Kb.

### V3 Release

  * **Breaking**
    * all callbacks now are invoked with a single parameter/argument to normalize Promise vs callback behavior
    * removed `about` alias for `that` as just redundant / confusing
  * **New**
    * Fully Promises micro-tasks based, including callbacks.
    * `drop(type)` to delete from the internal Map the `type`. Watch out, if the type was unresolved and there were promises related to such type, these promises will be inevitably forever pending. If you drop a type without ever resolving it, please be sure you either never returned promises or resolve it via `that(type, void 0)` then `drop` it.
    * ESM module as `broadcast/esm/index.js`
    * CJS module as `broadcast/cjs`

### API

  * `.all(type:any, callback:Function):void` to be notified every time a specific _type_ changes (i.e. each `.that(type, value)` call in the future)
  * `.drop(type:any[, callback:Function]):void` remove a specific _callback_ from all future changes. If omitted, it removes _type_ from the internal _Map_
  * `.new():broadcast` create a new private broadcaster.
  * `.that(type:any[, value:any]):Function|void` broadcast to all callbacks and resolves all promises with `value`. If omitted, it returns a callback that will broadcast, once invoked, the received `value` (i.e. `thing.addListener(any, broadcast.that(type))`).
  * `.when(type:any[, callback:Function]):Promise|void` invokes the callback next tick if _type_ is already known, it will invoke it as soon as _type_ is known otherwise. If omitted, it returns a _Promise_ that will resolve once _type_ is known.

### Examples

```js
// as Promise,
//  inspired by customRegistry.whenDefined(...).then(...)
// will you ever ask for a geo position or
// have you asked for it already ?
broadcast.when('geo:position').then(info => {
  showOnMap(info.coords);
});

// as Callback,
//  receiving one or more arguments
// have you read that file before or
// will you read it at some point ?
broadcast.when('fs:README.md', data => {
  echomd(data.toString());
});

// as one-off Event (Promise or Callback)
broadcast.when(
  'dom:DOMContentLoaded',
  boostrapMyApp
);
```

It doesn't matter if a channel was resolved, updated, or never asked for,
whenever that happens, broadcasts will follow.

```js
// that position? only once asked for it
navigator.geolocation.getCurrentPosition(info => {
  // manual broadcast
  broadcast.that('geo:position', info);
});

// update the position each change? same
navigator.geolocation.watchPosition(
  // implicit broadcast once executed
  broadcast.that('geo:position')
);

// the file? You got it.
fs.readFile(
  'README.md',
  // will broadcast once executed
  (err, data) => broadcast.that('fs:README.md', err || data)
);

// top of the page
document.addEventListener(
  'DOMContentLoaded',
  broadcast.that('dom:DOMContentLoaded')
);
```

#### one broadcast VS all broadcasts

A `broadcast` happens only once asked for it, and it will receive the latest resolution.

If you'd like to listen to all broadcasted changes, you can use `broadcast.all(type, callback)`,
and eventually stop listening to it via `broadcast.drop(type, callback)`.

```js

let watchId;

function updatePosition(info) {
  mapTracker.setCoords(info.coords);
}

button.addEventListener('click', e => {
  if (watchId) {
    navigator.geolocation.clearWatch(watcher);
    watchId = 0;
    broadcast.drop('geo:position', updatePosition);
  } else {
    watchId = navigator.geolocation.watchPosition(
      // updates the latest position info on each call
      broadcast.that('geo:position')
    );
    broadcast.all('geo:position', updatePosition);
  }
});
```


#### private broadcasts
There are two different ways to have a private broadcasts:

  * using a secret `type` as channel, like in `broadcast.when(privateSymbol).then(log)`
  * create a local version of the notifier that will share nothing with the main one:
    `const pvt = broadcast.new();`

The first way enables shared, yet private, resolutions while the second one would be unreachable outside its scope.


## Compatibility
This library is compatible with every JS engine since ES3, both browser and server,
but a `Promise` and a `Map` polyfill might be needed in very old engines.
