var assert = require('node:assert/strict');
var test = require('node:test');
var GameCollection = require('../games.js').GameCollection;

function createSocket() {
  var handlers = {};

  return {
    emitted: [],
    disconnected: false,
    on: function (event, callback) {
      handlers[event] = callback;
    },
    emit: function (event, data) {
      this.emitted.push({
        event: event,
        data: data
      });
    },
    trigger: function (event, data) {
      handlers[event](data);
    },
    disconnect: function () {
      this.disconnected = true;
    }
  };
}

test('GameCollection creates a game only once for the same id', function () {
  var games = new GameCollection();

  assert.equal(games.createGame('arena-1'), true);
  assert.equal(games.createGame('arena-1'), false);
  assert.equal(games.getGame('arena-1').getId(), 'arena-1');
});

test('GameCollection rejects blank game ids', function () {
  var games = new GameCollection();

  assert.equal(games.createGame('   '), false);
  assert.equal(games.createGame(''), false);
  assert.equal(games.createGame(null), false);
  assert.equal(games.getGame('   '), undefined);
});

test('GameCollection removes existing games only once', function () {
  var games = new GameCollection();

  assert.equal(games.createGame('arena-2'), true);
  assert.equal(games.removeGame('arena-2'), true);
  assert.equal(games.removeGame('arena-2'), false);
  assert.equal(games.getGame('arena-2'), undefined);
});

test('Game accepts two players and rejects a third one', function () {
  var games = new GameCollection(),
    player1 = createSocket(),
    player2 = createSocket(),
    player3 = createSocket(),
    game;

  assert.equal(games.createGame('arena-3'), true);
  game = games.getGame('arena-3');

  assert.equal(game.addPlayer(player1), true);
  assert.equal(player1.emitted.length, 0);
  assert.equal(game.addPlayer(player2), true);
  assert.deepEqual(player1.emitted, [{
    event: 'player-connected',
    data: 0
  }]);
  assert.equal(game.addPlayer(player3), false);
});

test('Game forwards player events to the opponent', function () {
  var games = new GameCollection(),
    player1 = createSocket(),
    player2 = createSocket(),
    game;

  assert.equal(games.createGame('arena-4'), true);
  game = games.getGame('arena-4');
  game.addPlayer(player1);
  game.addPlayer(player2);

  player1.trigger('event', 'high-kick');
  player1.trigger('life-update', 80);
  player1.trigger('position-update', {
    x: 120,
    y: 230
  });
  player2.trigger('event', 'block');

  assert.deepEqual(player2.emitted.slice(0, 3), [
    {
      event: 'event',
      data: 'high-kick'
    },
    {
      event: 'life-update',
      data: 80
    },
    {
      event: 'position-update',
      data: {
        x: 120,
        y: 230
      }
    }
  ]);
  assert.deepEqual(player1.emitted.slice(1), [{
    event: 'event',
    data: 'block'
  }]);
});

test('Game ends when a player disconnects', function () {
  var games = new GameCollection(),
    player1 = createSocket(),
    player2 = createSocket(),
    game;

  assert.equal(games.createGame('arena-5'), true);
  game = games.getGame('arena-5');
  game.addPlayer(player1);
  game.addPlayer(player2);

  player1.trigger('disconnect');

  assert.equal(player2.disconnected, true);
  assert.equal(games.getGame('arena-5'), undefined);
});
