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
  socket.emit('state', { state: gameState })
  socket.on('move', function (data) {
    if (data.direction == "up")
      if (posY > 0) posY--
    if (data.direction == "down")
      if (posY < gameState.length-1) posY++
    if (data.direction == "left")
      if (posX > 0) posX--
    if (data.direction == "right")
      if (posX < gameState[0].length-1) posX++
    action()
    draw()
  })
})

var posX = 5, posY = 5
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
gameState[posX][posY] = 1
gameState[foodX][foodY] = 2

// Fun stuff
var rotation = 0.1

function action() {
  if (posX == foodX && posY == foodY) {
    rotation += 0.1
    io.sockets.emit('update', { rotation: rotation })

    // New food
    foodX = Math.floor(Math.random() * 8)
    foodY = Math.floor(Math.random() * 8)
    gameState[foodX][foodY] = 2
  }
}

function draw() {
  for (var i = 0; i < gameState.length; i++)
    for (var j = 0; j < gameState.length; j++)
      if (gameState[i][j] != 2)
        gameState[i][j] = 0
  gameState[posX][posY] = 1
}

function updateClients() {
  io.sockets.emit('state', { state: gameState })
}
setInterval(updateClients, 50);
