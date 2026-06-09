var assert = require('node:assert/strict');
var test = require('node:test');
var GameCollection = require('../games.js').GameCollection;

function seededRandom(seed) {
  var value = seed;

  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function randomString(random, maxLength) {
  var chars = ' abcXYZ0123456789_-:/\\\n\t\u0000\u00e7\u00e3\u2603';
  var length = Math.floor(random() * maxLength);
  var value = '';
  var i;

  for (i = 0; i < length; i += 1) {
    value += chars[Math.floor(random() * chars.length)];
  }

  return value;
}

function generateFuzzInputs() {
  var random = seededRandom(20260609);
  var inputs = [
    undefined,
    null,
    true,
    false,
    0,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER,
    '',
    '   ',
    '\n\t',
    'arena',
    'arena com espacos',
    '../escape',
    '<script>alert(1)</script>',
    '__proto__',
    'constructor',
    'x'.repeat(10000),
    [],
    ['arena'],
    {},
    { id: 'arena' },
    { nested: { value: 'arena' } }
  ];
  var i;

  for (i = 0; i < 100; i += 1) {
    inputs.push(randomString(random, 512));
  }

  return inputs;
}

test('GameCollection handles unexpected game ids without throwing', function () {
  var inputs = generateFuzzInputs();
  var i;

  for (i = 0; i < inputs.length; i += 1) {
    assert.doesNotThrow(function () {
      var games = new GameCollection();
      var created = games.createGame(inputs[i]);

      assert.equal(typeof created, 'boolean');
      assert.doesNotThrow(function () {
        games.getGame(inputs[i]);
      });
      assert.doesNotThrow(function () {
        games.removeGame(inputs[i]);
      });
    });
  }
});

test('GameCollection does not store invalid fuzzed game ids', function () {
  var inputs = generateFuzzInputs();
  var games = new GameCollection();
  var i;

  for (i = 0; i < inputs.length; i += 1) {
    if (typeof inputs[i] !== 'string' || !inputs[i].trim()) {
      assert.equal(games.createGame(inputs[i]), false);
      assert.equal(Object.prototype.hasOwnProperty.call(games._games, inputs[i]), false);
    }
  }
});
