const {broadcast} = require('../cjs');

const ms = delay => new Promise($ => setTimeout($, delay));

(async () => {
  let random = Math.random();
  let calls = 0;
  let value;
  let fn = (_) => {
    calls++;
    value = _;
  };

  broadcast.when('random').then(fn);
  await ms(10);
  console.assert(calls === 0);
  
  broadcast.that('random', random);
  await ms(10);
  console.assert(calls === 1);
  console.assert(value === random);

  broadcast.that('random')(Math.random());
  await ms(10);
  console.assert(calls === 1);
  console.assert(value === random);

  broadcast.when('random').then(fn);
  await ms(10);
  console.assert(calls === 2);
  console.assert(value !== random);
  random = value;

  broadcast.all('random', fn);
  await ms(10);
  console.assert(calls === 3);
  console.assert(value === random);

  broadcast.that('random')(Math.random());
  await ms(10);
  console.assert(calls === 4);
  console.assert(value !== random);
  random = value;

  broadcast.drop('random', fn);
  broadcast.that('random')(Math.random());
  await ms(10);
  console.assert(calls === 4);
  console.assert(value === random);

  broadcast.drop('random');
  broadcast.that('random')(Math.random());
  await ms(10);
  console.assert(calls === 4);
  console.assert(value === random);
})();
