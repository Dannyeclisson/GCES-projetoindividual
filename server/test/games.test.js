var assert = require('node:assert/strict');
var test = require('node:test');
var GameCollection = require('../games.js').GameCollection;

test('GameCollection creates a game only once for the same id', function () {
  var games = new GameCollection();

  assert.equal(games.createGame('arena-1'), true);
  assert.equal(games.createGame('arena-1'), false);
});

test('GameCollection rejects blank game ids', function () {
  var games = new GameCollection();

  assert.equal(games.createGame('   '), false);
  assert.equal(games.getGame('   '), undefined);
});
