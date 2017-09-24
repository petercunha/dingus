var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500)
      return res.end('Error loading index.html')
    }

    res.writeHead(200)
    res.end(data)
  })
}

io.on('connection', function (socket) {
  var index = players.length
  players.push(new Player())

  socket.emit('state', { state: gameState })
  socket.on('move', function (data) {
    if (data.direction == "up")
      if (players[index].y > 0) players[index].y--
    if (data.direction == "down")
      if (players[index].y < gameState.length-1) players[index].y++
    if (data.direction == "left")
      if (players[index].x > 0) players[index].x--
    if (data.direction == "right")
      if (players[index].x < gameState[0].length-1) players[index].x++
    players[index].action()
    players[index].draw()
  })
  console.log(players.length);
})

function Player() {
  this.x = 5,
  this.y = 5,
  this.size = 1,
  this.rotation = 0.1,
  this.action = function() {
    if (this.x == foodX && this.y == foodY) {
      this.rotation += 0.1
      io.sockets.emit('update', { rotation: rotation })

      // New food
      foodX = Math.floor(Math.random() * 8)
      foodY = Math.floor(Math.random() * 8)
      gameState[foodX][foodY] = 2
    }
  },
  this.draw = function() {
    for (var i = 0; i < gameState.length; i++)
      for (var j = 0; j < gameState.length; j++)
        if (gameState[i][j] != 2)
          gameState[i][j] = 0
    gameState[this.x][this.y] = this
  }
}
var players = []

var foodX = 2, foodY = 2
var gameState = [
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 0, 0, 0, 0]
]
// Set players positions
for (var i = 0; i < players.length; i++) {
  gameState[players[i].x, players[i].y] = players[i]
}
gameState[foodX][foodY] = 2

// Fun stuff
var rotation = 0.1

function updateClients() {
  io.sockets.emit('state', { state: gameState })
}
setInterval(updateClients, 50);
