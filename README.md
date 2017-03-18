broadcast [![build status](https://secure.travis-ci.org/WebReflection/broadcast.svg)](http://travis-ci.org/WebReflection/broadcast) [![Coverage Status](https://s3.amazonaws.com/assets.coveralls.io/badges/coveralls_100.svg)](https://coveralls.io/github/WebReflection/broadcast?branch=master)
=========

Previously known as [notify-js](https://www.webreflection.co.uk/blog/2015/08/14/the-line-between-events-and-promises),
`broadcast` is a private or public notification chanel inspired by standards.

Useful for loaders, components bootstrap, geo position updates, and all other asynchronous or on demand user granted privileges operations, `broadcast` works on every browser and every platform, it's 100% tests covered, and it weights less than 1Kb.

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
broadcast.when('fs:README.md', (err, result) => {
  if (!err) echomd(result.toString());
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
  broadcast.that('fs:README.md')
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

  * using a secret unique string or a private `Symbol` as channel, like in `broadcast.when(privateSymbol).then(log)`
  * create a local version of the notifier that will share nothing with the main one:
    `const pvt = broadcast.new();`

The first way enables shared, yet private, resolutions while the second one would be unreachable outside its scope.


### broadcast files
The [node module](https://github.com/WebReflection/broadcast/blob/master/build/broadcast.node.js) is available via `npm install broadcast`.

The [minified version](https://github.com/WebReflection/broadcast/blob/master/build/min.js) is available through https://unpkg.com/broadcast@latest/min.js


## Compatibility
This library is compatible with every JS engine since ES3, both browser and server,
but a `Promise` polyfill might be needed to use Promise based patterns.
