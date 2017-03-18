
## broadcast API
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