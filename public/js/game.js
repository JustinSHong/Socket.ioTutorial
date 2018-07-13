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

function preload() {}

function create() {}

function update() {}
