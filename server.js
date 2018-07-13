// Dependencies
const express = require("express"); // use express to render static files
const server = express();
const helmet = require("helmet");
const cors = require("cors");

const PORT = 8081;

// middleware
server.use(helmet());
server.use(express.json());
server.use(cors());

// express.static() is middleware that will render static files
server.use(express.static(__dirname + "/public"));

// Root - server serves the index.html
server.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

server.listen(PORT, function() {
	console.log(`Listening on ${PORT}`);
});
