broadcast [![build status](https://secure.travis-ci.org/WebReflection/broadcast.svg)](http://travis-ci.org/WebReflection/broadcast) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/broadcast/badge.svg?branch=master)](https://coveralls.io/github/WebReflection/broadcast?branch=master)
=========

A simplified global or private notification channel for values that happened in the past,
and those that will happen in the future.
[Related blog entry](https://www.webreflection.co.uk/blog/2015/08/14/the-line-between-events-and-promises).


## API
There are 2 main methods such `.that(type[, any1[, any2[, ...]]])` and `.when(type[, callback])`,
plus 3 extra helpers such `.drop(type, callback)`, `.all(type, callback)`, and `.new()`.


### broadcast.that(type[, ...])
This method is useful to broadcast about a generic channel.

```js
// whenever it happens ...
navigator.geolocation.getCurrentPosition(info => {
  // ... broadcast anyone asking for 'geo:position'
  broadcast.that('geo:position', info);
});

// equivalent shortcut, will resolve
// with the first argument
navigator.geolocation.getCurrentPosition(
  broadcast.that('geo:position')
);

// NodeJS API compatible
fs.readFile(
  'package.json',
  broadcast.that('fs:package.json')
);
```


#### broadcast.that(type) and Promises
This method can also be used as middleware, passing along whatever first argument it receives.

```js
// middleware
connectToDb
  // resolves and returns the value
  .then(broadcast.that('db:connected'))
  .then(readDatabaseInfo);
```


### broadcast.when(type[, callback])
Usable both through callbacks or as `Promise`, the `.when` method asks for a channel and resolves it once available.

```js
// using a callback
broadcast.when('geo:position', info => {
  console.log(info.coords);
});

// Promise based
broadcast.when('geo:position').then(info => {
  console.log(info.coords);
})
```

It doesn't matter if `.when` is used before or after a channel has been resolved, it will always pass along the last known resolved value.

```js
// log on 'timer' channel (will log 123)
broadcast.when('timer', console.log);

// resolves the channel with value 1
broadcast.that('timer', 123);

setTimeout(() => {
  // log resolved 'timer' channel value
  // (will log 123)
  broadcast.when('timer', console.log);
}, 200);
```


#### Callback or Promise ?
If you are resolving older APIs like NodeJS `require('fs').readFile`,
you probably want to use a callback because the resolution will pass along two arguments instead of one.

```js
fs.readFile(
  'package.json',
  (err, blob) => {
    broadcast.that('fs:package.json', err, blob);
  }
);

broadcast.when('fs:package.json', (err, blob) => {
  if (err) return console.error(err);
  console.log(blob.toString());
});
```

As previously mentioned, you can still use the shortcut to resolve with all arguments once that happens.

```js
fs.readFile(
  'package.json',
  broadcast.that('fs:package.json')
);
```


### broadcast.drop(type, callback)
Usable only for callbacks registered via `broadcast.when(type, callback)`,
the `.drop` method avoids triggering the channel in the immediate present or future.

```js
function log(value) {
  console.log(value);
}

// wait for it to happen
broadcast.when('happened', log);

// change your mind
broadcast.drop('happened', log);

// whenever it happens
// nothing will be logged
broadcast.that('happened', 'nope');
```
This method is particularly handy in conjunction of the `broadcast.all(type, callback)` method.


### broadcast.all(type, callback)
In case you'd like to react every time a channel is updated,
this method will register the `callback` and invoke it with the latest resolution each time.

```js
// each position change
navigator.geolocation.watchPosition(
  // update with latest info
  broadcast.that('geo:position')
);


// react to all position changes
broadcast.all(
  'geo:position',

  // tracker
  info => {
    console.log(info.coords);
  }
);
```

Registered callbacks can be dropped through the `broadcast.drop(type, callback)` method.

### broadcast.new()
There are basically two ways to have a private notification channel:

  * using a private `Symbol` as channel, like in `broadcast.when(privateSymbol).then(log)`
  * create a local version of the notifier that will share nothing with the main one:
    `const pvt = broadcast.new();`


## Which file ?
Browsers could use [the minified version](https://github.com/WebReflection/broadcast/blob/master/build/broadcast.js), otherwise there is a [node module](https://github.com/WebReflection/broadcast/blob/master/build/broadcast.node.js)
which is also available via npm as `npm install broadcast`.


## Compatibility
This library is compatible with every JS engine since ES3, both browser and server,
but a `Promise` polyfill might be needed to use Promise based patterns.
