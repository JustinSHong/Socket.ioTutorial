// Dependencies
const express = require("express"); // use express to render static files
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const helmet = require("helmet");
const cors = require("cors");

const PORT = 8081;

const players = {};

// middleware
app.use(helmet());
app.use(express.json());
app.use(cors());

// express.static() is middleware that will render static files
app.use(express.static(__dirname + "/public"));

// Root - server serves the index.html
app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

// listen for connections and disconnections
io.on("connection", function(socket) {
	console.log("a user connected");
	// create a new player and add it to our players object
	players[socket.id] = {
		// player data used to create sprites on client side and to update all players games
		rotation: 0,
		x: Math.floor(Math.random() * 700) + 50,
		y: Math.floor(Math.random() * 500) + 50,
		playerId: socket.id,
		team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue"
	};
	// send the players object to the new player
	socket.emit("currentPlayers", players);
	// update all other players of the new player
	socket.broadcast.emit("newPlayer", players[socket.id]);
	// when a player disconnects, remove them from the players object
	socket.on("disconnect", function() {
		console.log("a user disconnected");
		delete players[socket.id];
		// emit a message to all players to remove this player
		io.emit("disconnect", socket.id);
	});
	// when a player moves, update the player data
	socket.on("playerMovement", function(movementData) {
		players[socket.id].x = movementData.x;
		players[socket.id].y = movementData.y;
		players[socket.id].rotation = movementData.rotation;
		// emit a message to all players about the player that moved
		socket.broadcast.emit("playerMoved", players[socket.id]);
	});
});

server.listen(PORT, function() {
	console.log(`Listening on ${PORT}`);
});
