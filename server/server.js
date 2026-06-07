var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
  io = require('socket.io')(server),
    GameCollection = require('./games.js').GameCollection,
  games = new GameCollection(),
  db = require('./db.js');

app.use(express.static(__dirname + '/../game'));

db.initDatabase();

server.listen(55555);

var Responses = {
    SUCCESS: 0,
    GAME_EXISTS: 1,
    GAME_NOT_EXISTS: 2,
    GAME_FULL: 3
  },
  Requests = {
    CREATE_GAME: 'create-game',
    JOIN_GAME: 'join-game'
  };

io.on('connection', function (socket) {
  db.logEvent('socket_connected', {
    socketId: socket.id
  });

  socket.on(Requests.CREATE_GAME, function (gameName) {
    if (games.createGame(gameName)) {
      games.getGame(gameName).addPlayer(socket);
      db.logEvent('game_created', {
        gameName: gameName,
        socketId: socket.id
      });
      socket.emit('response', Responses.SUCCESS);
    } else {
      socket.emit('response', Responses.GAME_EXISTS);
    }
  });
  socket.on(Requests.JOIN_GAME, function (gameName) {
    var game = games.getGame(gameName);
    if (!game) {
      socket.emit('response', Responses.GAME_NOT_EXISTS);
    } else {
      if (game.addPlayer(socket)) {
        db.logEvent('game_joined', {
          gameName: gameName,
          socketId: socket.id
        });
        socket.emit('response', Responses.SUCCESS);
      } else {
        socket.emit('response', Responses.GAME_FULL);
      }
    }
  });
});
