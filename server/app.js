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
    draw()
  })
})

var posX = 5, posY = 5
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

function draw() {
  for (var i = 0; i < gameState.length; i++)
    for (var j = 0; j < gameState.length; j++)
      gameState[i][j] = 0
  gameState[posX][posY] = 1
}

function updateClients() {
  io.sockets.emit('state', { state: gameState })
}
setInterval(updateClients, 50);
