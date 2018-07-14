const config = {
  type: Phaser.AUTO, // renderer type - use WebGL if available otherwise use Canvas
  // render game in an existing canvas element with the parent, otherwise create a canvas el
  parent: "phaser-example",
  // viewable game area
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// pass configuration to Phaser when making a new game instance
const game = new Phaser.Game(config);

function preload() {
  this.load.image("ship", "assets/spaceShips_001.png");
  this.load.image("otherPlayer", "assets/enemyBlack5.png");
}

function create() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  // listen for the currentPlayers event
  this.socket.on("currentPlayers", function(players) {
    Object.keys(players).forEach(function(id) {
      // find new player
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        // player is not the current player
        addOtherPlayers(self, players[id]);
      }
    });
  });
  // create another group, otherPlayers, to manage all other players
  // groups are a way to manage similar objects and control them as one unit
  this.socket.on("newPlayer", function(playerInfo) {
    // listen for newPlayer event
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on("disconnect", function(playerId) {
    // listen for disconnect event
    self.otherPlayers.getChildren().forEach(function(otherPlayer) {
      // remove the disconnected player's ship from the game
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
}

function update() {}

// create a new player
function addPlayer(self, playerInfo) {
  // allow ship to use arcade physics
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5) // set origin of the ship to be in the middle of the object
    .setDisplaySize(53, 40); // set size and scale of the game object
  if (playerInfo.team === "blue") {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  // modify how the game object reacts to the arcade physics
  self.ship.setDrag(100); // affects resistance
  self.ship.setAngularDrag(100); // affects resistance
  self.ship.setMaxVelocity(200); // max speed
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add
    .sprite(playerInfo.x, playerInfo.y, "otherPlayer")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);
  if (playerInfo.team === "blue") {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}
