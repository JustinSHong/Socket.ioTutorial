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
  this.load.image("star", "assets/star_gold.png");
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
  this.socket.on("playerMoved", function(playerInfo) {
    self.otherPlayers.getChildren().forEach(function(otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  // handle player input with built in keyboard manager
  // populate cursors with up, down, left, right key objects and bind them to arrow keys
  this.cursors = this.input.keyboard.createCursorKeys();
  // handle score
  this.blueScoreText = this.add.text(16, 16, "", {
    fontSize: "32px",
    fill: "#0000FF"
  });
  this.redScoreText = this.add.text(584, 16, "", {
    fontSize: "32px",
    fill: "#FF0000"
  });
  // update score
  this.socket.on("scoreUpdate", function(scores) {
    self.blueScoreText.setText("Blue: " + scores.blue);
    self.redScoreText.setText("Red: " + scores.red);
  });
  // star collectible
  this.socket.on("starLocation", function(starLocation) {
    if (self.star) self.star.destroy(); // destroy star object if it exists
    // add a new star object to the game
    self.star = self.physics.add.image(starLocation.x, starLocation.y, "star");
    // check if the player's ship is overlapping with a star
    self.physics.add.overlap(
      self.ship,
      self.star,
      function() {
        this.socket.emit("starCollected");
      },
      null,
      self
    );
  });
}

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

function update() {
  // determine if arrow keys are being held down
  // setAngularVelocity() allows ship to rotate left and right
  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      // neither left or right keys pressed, reset to 0
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      // udpate ships velocity when up key is pressed
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        100,
        this.ship.body.acceleration
      );
    } else {
      this.ship.setAcceleration(0);
    }
    // load ship to the other side of the screen if it goes off screen
    // this.physics.world.wrap(this.ship, 5);

    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (
      this.ship.oldPosition &&
      (x !== this.ship.oldPosition.x ||
        y !== this.ship.oldPosition.y ||
        r !== this.ship.oldPosition.rotation)
    ) {
      // player position or rotation changed, emit a playerMovement event
      this.socket.emit("playerMovement", {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      });
    }

    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}
