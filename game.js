var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 304,
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

  // Tiled map and tileset images
  this.load.tilemapTiledJSON("level1", "maps/level1+2nd(backup).tmj");
  this.load.image("Grassland_Terrain_47Tiles", "assets/2d/Terrain/Grassland_Terrain_47Tiles.png");
  this.load.image("Grassland_Terrain_BgdTiles", "assets/2d/Terrain/Grassland_Terrain_BgdTiles.png");
  this.load.image("Grassland_Terrain_ExtraTiles", "assets/2d/Terrain/Grassland_Terrain_ExtraTiles.png");

  // Apple pickup image
  this.load.image("apple", "assets/2d/Items/Fruits/Apple_idle.png");

  // Pickup sound effect
  this.load.audio(
    "pickup-sfx",
    "assets/audio/GameSFX/PickUp/Retro PickUp Coin 07.wav",
  );

  // Player assets — defined in player.js
  playerPreload(this);
}

function create() {
  // Build the tilemap from the loaded JSON file
  var map = this.make.tilemap({ key: "level1" });

  // Add all three tilesets — names must match what's inside level1+2nd(backup).tmj
  var tileset47     = map.addTilesetImage("Grassland_Terrain_47Tiles",    "Grassland_Terrain_47Tiles");
  var tilesetBgd    = map.addTilesetImage("Grassland_Terrain_BgdTiles",   "Grassland_Terrain_BgdTiles");
  var tilesetExtra  = map.addTilesetImage("Grassland_Terrain_ExtraTiles", "Grassland_Terrain_ExtraTiles");
  var allTilesets   = [tileset47, tilesetBgd, tilesetExtra];

  // Grid background — added first so it renders behind everything
  this.add
    .tileSprite(0, 0, map.widthInPixels, map.heightInPixels, "grid")
    .setOrigin(0, 0);

  // Ground tile layer — background only, no collision
  var groundLayer = map.createLayer("Tile Layer 1", allTilesets, 0, 0);

  // Middle layer — full solid collision on all sides
  var platformLayer = map.createLayer("middle layer", allTilesets, 0, 0);
  platformLayer.setCollisionByExclusion([-1]);

  // Raise the tile collision bias to match tile size (16px).
  // This prevents the player from snagging on tile corners while moving horizontally.
  this.physics.world.TILE_BIAS = 32;

  // Read the spawn position from the Tiled object layer, fall back to (100, 200)
  var spawn = { x: 100, y: 200 };
  var spawnLayer = map.getObjectLayer("spawnpoints");
  if (spawnLayer) {
    var spawnObj = spawnLayer.objects.find(function (obj) {
      return obj.name === "player";
    });
    if (spawnObj) spawn = spawnObj;
  }

  // Create the player at the spawn point — defined in player.js
  var player = playerCreate(this, spawn.x, spawn.y, platformLayer);

  // Middle layer collision
  this.physics.add.collider(player, platformLayer);

  // ── Pickups ──────────────────────────────────
  // Read all objects from the spawnpoints layer that have type "pickups"
  var pickupGroup = this.physics.add.staticGroup();
  var spawnObjects = (spawnLayer && spawnLayer.objects) ? spawnLayer.objects : [];
  spawnObjects.forEach(function (obj) {
    if (obj.type === "pickups") {
      // Tiled tile-objects have their origin at bottom-left, so shift to center
      var sprite = pickupGroup.create(
        obj.x + obj.width / 2,
        obj.y - obj.height / 2,
        "apple",
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
  this.physics.add.overlap(
    player,
    pickupGroup,
    function (playerSprite, pickup) {
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
        duration: 80, // each half-blink is 80ms
        yoyo: true, // bounce back to alpha 1
        repeat: 2, // 3 full blinks total
        onComplete: function () {
          pickup.destroy();
        },
      });

      // Show "+N Health!" text floating up from the apple's position, then fade out
      var popupText = scene.add
        .text(worldX, worldY - 20, "+" + hp + " Health!", {
          fontSize: "22px",
          color: "#00ff44",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5, 1);

      scene.tweens.add({
        targets: popupText,
        y: worldY - 80, // floats upward
        alpha: 0,
        duration: 1200, // 1.2 seconds — long enough to read, quick enough to feel snappy
        ease: "Power1",
        onComplete: function () {
          popupText.destroy();
        },
      });
    },
  );
  // ─────────────────────────────────────────────

  // Camera snap settings (instead of smooth follow)
  this.CAMERA_SNAP_DISTANCE_X = 730; // pixels to move camera horizontally (slightly less than full screen)
  this.CAMERA_SNAP_DISTANCE_Y = 350; // pixels to move camera vertically (slightly less than full screen)
  this.EDGE_THRESHOLD = 40; // how close to screen edge triggers snap (reduced for less sensitivity)
  this.DEADZONE = 50; // unused but kept for tuning if needed
  this.CAMERA_SNAP_COOLDOWN = 1000; // milliseconds to wait after a snap before allowing another

  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  // Snap camera state: require leaving the edge zone before being able to snap again
  var camera = this.cameras.main;
  this.cameraSnapState = {
    isRightReady:
      player.x <= camera.scrollX + camera.width - this.EDGE_THRESHOLD,
    isLeftReady: player.x >= camera.scrollX + this.EDGE_THRESHOLD,
    isDownReady:
      player.y <= camera.scrollY + camera.height - this.EDGE_THRESHOLD,
    isUpReady: player.y >= camera.scrollY + this.EDGE_THRESHOLD,
    lastSnapTime: 0, // timestamp of last snap
  };

  // Arrow key input
  this.cursors = this.input.keyboard.createCursorKeys();

  // E key for attack mechanic
  this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

  // Debug text for player coordinates
  this.debugText = this.add
    .text(0, 0, "", {
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    })
    .setScrollFactor(0); // Fixed to camera, doesn't scroll with world

  // Attach to the scene so update() can access them
  this.player = player;
  this.map = map;
}

function update() {
  // Movement and animation — defined in player.js
  playerUpdate(this.player, this.cursors, this.attackKey);

  // Update debug text with player coordinates
  var camera = this.cameras.main;
  this.debugText.setPosition(camera.width - 120, 10); // Top right corner, moved left for visibility
  this.debugText.setText(
    "X: " + Math.round(this.player.x) + "\nY: " + Math.round(this.player.y),
  );

  // ── Snap Camera Logic ──────────────────────────────
  // Camera snaps when player reaches screen edge; deadzone prevents bouncing
  var scene = this;
  var player = scene.player;
  var camera = scene.cameras.main;
  var map = scene.map;

  // Camera viewport edges
  var view = camera.worldView;
  var rightEdge = view.right - scene.EDGE_THRESHOLD;
  var leftEdge = view.left + scene.EDGE_THRESHOLD;
  var downEdge = view.bottom - scene.EDGE_THRESHOLD;
  var upEdge = view.top + scene.EDGE_THRESHOLD;

  var currentTime = scene.time.now;
  var canSnap =
    currentTime - scene.cameraSnapState.lastSnapTime >
    scene.CAMERA_SNAP_COOLDOWN;

  // RIGHT edge: player beyond right threshold
  if (player.x > rightEdge && canSnap) {
    if (scene.cameraSnapState.isRightReady) {
      var targetScrollX = Math.min(
        camera.scrollX + scene.CAMERA_SNAP_DISTANCE_X,
        map.widthInPixels - camera.width,
      );
      if (targetScrollX > camera.scrollX) {
        camera.scrollX = targetScrollX;
        scene.cameraSnapState.isRightReady = false;
        scene.cameraSnapState.lastSnapTime = currentTime;
      }
    }
  } else if (player.x < rightEdge - scene.DEADZONE) {
    // Player moved away from right threshold zone
    scene.cameraSnapState.isRightReady = true;
  }

  // LEFT edge: player beyond left threshold
  if (player.x < leftEdge && canSnap) {
    if (scene.cameraSnapState.isLeftReady) {
      var targetScrollX = Math.max(
        camera.scrollX - scene.CAMERA_SNAP_DISTANCE_X,
        0,
      );
      if (targetScrollX < camera.scrollX) {
        camera.scrollX = targetScrollX;
        scene.cameraSnapState.isLeftReady = false;
        scene.cameraSnapState.lastSnapTime = currentTime;
      }
    }
  } else if (player.x > leftEdge + scene.DEADZONE) {
    // Player moved away from left threshold zone
    scene.cameraSnapState.isLeftReady = true;
  }

  // DOWN edge: player beyond down threshold
  if (player.y > downEdge && canSnap) {
    if (scene.cameraSnapState.isDownReady) {
      var targetScrollY = Math.min(
        camera.scrollY + scene.CAMERA_SNAP_DISTANCE_Y,
        map.heightInPixels - camera.height,
      );
      if (targetScrollY > camera.scrollY) {
        camera.scrollY = targetScrollY;
        scene.cameraSnapState.isDownReady = false;
        scene.cameraSnapState.lastSnapTime = currentTime;
      }
    }
  } else if (player.y < downEdge - scene.DEADZONE) {
    // Player moved away from down threshold zone
    scene.cameraSnapState.isDownReady = true;
  }

  // UP edge: player beyond up threshold
  if (player.y < upEdge && canSnap) {
    if (scene.cameraSnapState.isUpReady) {
      var targetScrollY = Math.max(
        camera.scrollY - scene.CAMERA_SNAP_DISTANCE_Y,
        0,
      );
      if (targetScrollY < camera.scrollY) {
        camera.scrollY = targetScrollY;
        scene.cameraSnapState.isUpReady = false;
        scene.cameraSnapState.lastSnapTime = currentTime;
      }
    }
  } else if (player.y > upEdge + scene.DEADZONE) {
    // Player moved away from up threshold zone
    scene.cameraSnapState.isUpReady = true;
  }
  // ─────────────────────────────────────────────────
}
