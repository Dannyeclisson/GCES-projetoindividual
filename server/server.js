var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
  io = require('socket.io')(server),
    GameCollection = require('./games.js').GameCollection,
  games = new GameCollection(),
  db = require('./db.js'),
  port = Number(process.env.PORT || 55555);

app.use(express.static(__dirname + '/../game'));

db.initDatabase();

server.listen(port, '0.0.0.0', function () {
  console.log('Server running on port ' + port);
});

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

app.get('/api/game-history', async function (req, res) {
  try {
    res.json(await db.listRecentEvents(20));
  } catch (error) {
    console.warn('Could not load game history: ' + error.message);
    res.json([]);
  }
});

app.get('/health', function (req, res) {
  res.json({
    status: 'ok'
  });
});

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
