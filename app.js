var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

var port = process.env.PORT || 3000;
app.listen(port);

function handler(req, res) {
	fs.readFile(__dirname + '/index.html',
		function(err, data) {
			if (err) {
				res.writeHead(500)
				return res.end('Error loading index.html')
			}

			res.writeHead(200)
			res.end(data)
		})
}

io.on('connection', function(socket) {

	// Add player and get reference as "me" variable
	players.push(new Player())
	var playerIndex = players.length - 1
	var me = players[playerIndex]

	socket.emit('state', {
		state: gameState
	})

	socket.on('move', function(data) {
		if (!me.alive) {
			socket.emit('dead', {
				status: 'dead'
			})
			players = players.splice(playerIndex, 1)
			return
		}

		// Special ability
		if (data.direction == "space")
			me.special.active = true

		if (data.direction == "up")
			if (me.y > 0) me.updatePos(0, -1)
		if (data.direction == "down")
			if (me.y < gameState[0].length - 1) me.updatePos(0, 1)
		if (data.direction == "left")
			if (me.x > 0) me.updatePos(-1, 0)
		if (data.direction == "right")
			if (me.x < gameState.length - 1) me.updatePos(1, 0)

		me.action()
		me.draw()
	})

	socket.on('disconnect', function() {
		me.alive = false
		gameState[me.x][me.y] = 0
		players = players.splice(playerIndex, 1)
		console.log("Online players: " + players.length);
	});
	console.log("Online players: " + players.length);
})

var players = []
var boardSize = 24
var foodX = 2,
	foodY = 2
var gameState = zeros([boardSize, boardSize / 2])
// Set players positions
for (var i = 0; i < players.length; i++) {
	gameState[players[i].x, players[i].y] = players[i]
}
gameState[foodX][foodY] = 2

function updateClients() {
	for (var i = 0; i < gameState.length; i++)
		for (var j = 0; j < gameState.length; j++)
			if (gameState[i][j]) {

				// Shrink players
				if (gameState[i][j].size > 1.25) {
					gameState[i][j].size -= 0.001 + gameState[i][j].size * 0.003
				}

				// Tick down the walls
				if (gameState[i][j].type == "WALL") {
					gameState[i][j].duration--
					if (gameState[i][j].duration < 0) {
						gameState[i][j] = 0
					}
				}
			}

	io.sockets.emit('state', {
		state: gameState
	})
}
setInterval(updateClients, 50);


// For initializing gamestate
function zeros(dimensions) {
	var array = [];
	for (var i = 0; i < dimensions[0]; ++i) {
		array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
	}
	return array;
}

// WALL OBJECT
function Wall() {
	this.type = "WALL",
	this.duration = 50
}

// PLAYER OBJECT
function Player() {
	this.id = Math.floor(Math.random() * 93513).toString()
	this.alive = true,
		this.x = 5,
		this.y = 5,
		this.oldX = this.x,
		this.oldY = this.y,
		this.size = 0.75,
		this.rotation = 0,

		this.special = {
			active: false,
			name: "WALL",
			blocks: 15
		},

		this.updatePos = function(dx, dy) {
			this.oldX = this.x
			this.oldY = this.y
			this.x += dx
			this.y += dy

			if (this.special.active) {

				// WALL ABILITY
				if (this.special.name == "WALL") {
					if (this.special.blocks < 0) {
						this.special.active = false
					} else {
						gameState[this.oldX][this.oldY] = new Wall()
						this.special.blocks--
					}
				}
			}
		},

		this.action = function() {

			// Food collision
			if (gameState[this.x][this.y] == 2) {
				this.size += 0.5

				if (this.special.blocks < 15) {
					this.special.blocks += 3
				}

				// New food
				foodX = Math.floor(Math.random() * boardSize)
				foodY = Math.floor(Math.random() * boardSize / 2)
				gameState[foodX][foodY] = 2
			}

			var enemy = gameState[this.x][this.y];

			// Check for walls
			if (enemy.type == "WALL") {
				gameState[this.oldX][this.oldY] = 0
				this.alive = false
			}

			// Check for other players
			if (enemy != 0 && this.x == enemy.x && this.y == enemy.y) {
				if (enemy.size > this.size) {
					enemy.size += this.size
					gameState[this.oldX][this.oldY] = 0
					this.alive = false
				} else if (enemy.size < this.size) {
					this.size += enemy.size
					gameState[enemy.x][enemy.y] = 0
					enemy.alive = false
				} else if (enemy.size == this.size) {
					this.x = this.oldX
					this.y = this.oldY
				}
			}
		},
		this.draw = function() {
			for (var i = 0; i < gameState.length; i++) {
				for (var j = 0; j < gameState.length; j++) {
					if (gameState[i][j] == this) {
						gameState[i][j] = 0
					}
				}
			}
			if (this.alive) {
				gameState[this.x][this.y] = this
			}
		}
}
