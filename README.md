# broadcast

[![build status](https://github.com/WebReflection/broadcast/actions/workflows/node.js.yml/badge.svg)](https://github.com/WebReflection/broadcast/actions) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/broadcast/badge.svg)](https://coveralls.io/github/WebReflection/broadcast)

Previously known as [notify-js](https://www.webreflection.co.uk/blog/2015/08/14/the-line-between-events-and-promises),
`broadcast` is a private or public notification chanel inspired by standards.

Useful for loaders, components bootstrap, geo position updates, and all other asynchronous or on demand user granted privileges operations, `broadcast` works on every browser and every platform, it's 100% tests covered, and it weights about 0.3K.

### V4 Release

  * **Breaking**
    * removed `new` method; the export now is `broadcast` and the `Broadcast` class
    * changed `when` signature; it now always returns a *Promise*
    * no transpilation anymore, usable by ES2015+ compatible engines
  * **New**
    * smaller
    * faster
    * better
    * stronger

### API

  * `.all(type:any, callback:Function):void` to be notified every time a specific _type_ changes (i.e. each `.that(type, value)` call in the future).
  * `.drop(type:any[, callback:Function]):void` remove a specific _callback_ from all future changes. If the callback is omitted, it removes _type_ from the internal _Map_ (drop all callbacks and value).
  * `.that(type:any[, value:any]):Function|void` broadcast to all callbacks and resolves all promises with `value`. If omitted, it returns a callback that will broadcast, once invoked, the received `value` (i.e. `thing.addListener(any, broadcast.that(type))`).
  * `.when(type:any):Promise` returns a _Promise_ that will resolve once _type_ is known.

### Examples

```js
import {broadcast} from 'broadcast';

// as Promise,
//  inspired by customRegistry.whenDefined(...).then(...)
// will you ever ask for a geo position or
// have you asked for it already ?
broadcast.when('geo:position').then(info => {
  showOnMap(info.coords);
});

// as one-off Event (Promise or Callback)
broadcast
  .when('dom:DOMContentLoaded')
  .then(boostrapMyApp);
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

  * using a secret `type` as channel, like in `broadcast.when(privateSymbol)`
  * create an instance a part via `import {Broadcast} from 'broadcast';` and `const bc = new Broadcast;`

The first way enables shared, yet private, resolutions while the second one would be unreachable outside its scope.
