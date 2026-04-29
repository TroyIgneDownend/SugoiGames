var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  backgroundColor: "#1a1a2e",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 }, // how fast the player falls
      debug: false, // set to true to see physics boxes
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var game = new Phaser.Game(config);

function preload() {
  // Background grid texture
  this.load.image("grid", "assets/2d/Background/Grid.png");

  // Tiled map and tileset image
  this.load.tilemapTiledJSON("level1", "maps/level1.tmj");
  this.load.image("terrain", "assets/2d/Terrain/Terrain (16x16).png");

  // Apple pickup image
  this.load.image("apple", "assets/2d/Items/Fruits/Apple_idle.png");

  // Pickup sound effect
  this.load.audio("pickup-sfx", "assets/audio/GameSFX/PickUp/Retro PickUp Coin 07.wav");

  // Player assets — defined in player.js
  playerPreload(this);
}

function create() {
  // Build the tilemap from the loaded JSON file
  var map = this.make.tilemap({ key: "level1" });
  // 'Terrain' must match the tileset name inside level1.tmj
  var tileset = map.addTilesetImage("Terrain", "terrain");

  // Grid background — added first so it renders behind everything
  this.add
    .tileSprite(0, 0, map.widthInPixels, map.heightInPixels, "grid")
    .setOrigin(0, 0);

  // Ground tile layer — all non-empty tiles get collision
  var groundLayer = map.createLayer("ground", tileset, 0, 0);
  groundLayer.setCollisionByExclusion([-1]);

  // Raise the tile collision bias to match tile size (16px).
  // This prevents the player from snagging on tile corners while moving horizontally.
  this.physics.world.TILE_BIAS = 32;

  // Read the spawn position from the Tiled object layer
  var spawnLayer = map.getObjectLayer("spawnpoints");
  var spawn = spawnLayer.objects.find(function (obj) {
    return obj.name === "player";
  });

  // Create the player at the spawn point — defined in player.js
  var player = playerCreate(this, spawn.x, spawn.y, groundLayer);

  // ── Pickups ──────────────────────────────────
  // Read all objects from the spawnpoints layer that have type "pickups"
  var pickupGroup = this.physics.add.staticGroup();
  spawnLayer.objects.forEach(function (obj) {
    if (obj.type === "pickups") {
      // Tiled tile-objects have their origin at bottom-left, so shift to center
      var sprite = pickupGroup.create(
        obj.x + obj.width / 2,
        obj.y - obj.height / 2,
        "apple"
      );
      // Read health_points from object properties if present, otherwise default to 10
      var hp = 10;
      if (obj.properties) {
        var hpProp = obj.properties.find(function (p) {
          return p.name === "health_points";
        });
        if (hpProp) hp = hpProp.value;
      }
      sprite.healthPoints = hp;
    }
  });

  // Keep a reference to the scene so the callback below can use it
  var scene = this;

  // When the player overlaps an apple, flash it, remove it, and show popup text
  this.physics.add.overlap(player, pickupGroup, function (playerSprite, pickup) {
    var hp = pickup.healthPoints;
    var worldX = pickup.x;
    var worldY = pickup.y;

    // Disable physics body so this callback can't fire again for the same apple
    pickup.body.enable = false;

    // Play the pickup sound
    scene.sound.play("pickup-sfx");

    // Flash the apple: quickly blink alpha 3 times, then destroy it
    scene.tweens.add({
      targets: pickup,
      alpha: 0,
      duration: 80,       // each half-blink is 80ms
      yoyo: true,         // bounce back to alpha 1
      repeat: 2,          // 3 full blinks total
      onComplete: function () {
        pickup.destroy();
      }
    });

    // Show "+N Health!" text floating up from the apple's position, then fade out
    var popupText = scene.add.text(worldX, worldY - 20, "+" + hp + " Health!", {
      fontSize: "22px",
      color: "#00ff44",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5, 1);

    scene.tweens.add({
      targets: popupText,
      y: worldY - 80,     // floats upward
      alpha: 0,
      duration: 1200,     // 1.2 seconds — long enough to read, quick enough to feel snappy
      ease: "Power1",
      onComplete: function () {
        popupText.destroy();
      }
    });
  });
  // ─────────────────────────────────────────────

  // Camera follows the player and stays within the map
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.cameras.main.startFollow(player);
  this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  // Arrow key input
  this.cursors = this.input.keyboard.createCursorKeys();

  // Attach to the scene so update() can access them
  this.player = player;
}

function update() {
  // Movement and animation — defined in player.js
  playerUpdate(this.player, this.cursors);
}
