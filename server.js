// Dependencies
const express = require("express"); // use express to render static files
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const helmet = require("helmet");
const cors = require("cors");

const PORT = 8081;

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
	socket.on("disconnect", function() {
		console.log("a user disconnected");
	});
});

app.listen(PORT, function() {
	console.log(`Listening on ${PORT}`);
});
