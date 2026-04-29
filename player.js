// ─────────────────────────────────────────────
//  player.js — Pink Man player character
//  Edit this file to change how the player looks and feels.
// ─────────────────────────────────────────────

// ── Tuning values ──────────────────────────────
var PLAYER_SPEED = 220; // horizontal move speed (pixels/sec)
var PLAYER_JUMP = -500; // jump velocity — more negative = higher jump
var PLAYER_CHAR = "Pink Man"; // folder name inside assets/2d/Main Characters/

// Hitbox size — smaller than the 32x32 sprite frame to avoid snagging on tile corners
// and to give the player a "generous" feel (hazards must clearly overlap to register).
// Turn on debug: true in game.js to see the green hitbox while tuning these.
var PLAYER_HITBOX_WIDTH = 20; // pixels wide  (sprite frame is 32px)
var PLAYER_HITBOX_HEIGHT = 28; // pixels tall  (sprite frame is 32px)
var PLAYER_HITBOX_OFFSET_X = 6; // shift right to center the hitbox in the frame
var PLAYER_HITBOX_OFFSET_Y = 4; // shift down  to align feet with the bottom of the frame

// Crouched hitbox — shorter than standing; offsetY keeps feet planted on the ground.
// Rule: CROUCH_OFFSET_Y = HITBOX_OFFSET_Y + (HITBOX_HEIGHT - CROUCH_HEIGHT)
var PLAYER_CROUCH_HEIGHT = 16; // pixels tall while crouching
var PLAYER_CROUCH_OFFSET_Y = 16; // = 4 + (28 - 16)

// ── Asset loading ──────────────────────────────
// Called from preload() in game.js
function playerPreload(scene) {
  var base = "assets/2d/Main Characters/" + PLAYER_CHAR + "/";
  scene.load.spritesheet("player-idle", base + "Idle (32x32).png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.spritesheet("player-run", base + "Run (32x32).png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.spritesheet("player-jump", base + "Jump (32x32).png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.spritesheet("player-fall", base + "Fall (32x32).png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.spritesheet("player-crouch", base + "Crouch (32x32).png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.audio(
    "jump-sfx",
    "assets/audio/GameSFX/Bounce Jump/Retro Jump Simple C2 02.wav",
  ); // jump sound effect
}

// ── Create player sprite + animations ──────────
// Called from create() in game.js. Returns the player sprite.
function playerCreate(scene, x, y, groundLayer) {
  var player = scene.physics.add.sprite(x, y, "player-idle");
  player.setCollideWorldBounds(true); // can't walk off the edge of the map

  // Shrink the physics hitbox so it matches the visible character, not the full frame.
  // Reduces edge-lock on tile corners and makes hazard hits feel fair.
  player.body.setSize(PLAYER_HITBOX_WIDTH, PLAYER_HITBOX_HEIGHT);
  player.body.setOffset(PLAYER_HITBOX_OFFSET_X, PLAYER_HITBOX_OFFSET_Y);

  // Collide with ground tiles
  scene.physics.add.collider(player, groundLayer);

  // Animations — edit frameRate to speed up or slow down
  scene.anims.create({
    key: "idle",
    frames: scene.anims.generateFrameNumbers("player-idle", {
      start: 0,
      end: 10,
    }),
    frameRate: 11,
    repeat: -1, // loop forever
  });
  scene.anims.create({
    key: "run",
    frames: scene.anims.generateFrameNumbers("player-run", {
      start: 0,
      end: 11,
    }),
    frameRate: 12,
    repeat: -1,
  });
  scene.anims.create({
    key: "jump",
    frames: scene.anims.generateFrameNumbers("player-jump", {
      start: 0,
      end: 0,
    }),
    frameRate: 1,
    repeat: 0,
  });
  scene.anims.create({
    key: "fall",
    frames: scene.anims.generateFrameNumbers("player-fall", {
      start: 0,
      end: 0,
    }),
    frameRate: 1,
    repeat: 0,
  });
  scene.anims.create({
    key: "crouch",
    frames: scene.anims.generateFrameNumbers("player-crouch", {
      start: 0,
      end: 1,
    }),
    frameRate: 10, // plays the drop in ~0.2 seconds, then holds on the crouched pose
    repeat: 0,
  });

  return player;
}

// ── Movement + animation each frame ────────────
// Called from update() in game.js.
function playerUpdate(player, cursors) {
  var onGround = player.body.blocked.down; // true when standing on a tile
  var crouching = cursors.down.isDown && onGround; // crouch only while on ground

  // Resize hitbox based on crouch state.
  // offsetY must increase when height shrinks to keep feet planted.
  if (crouching) {
    player.body.setSize(PLAYER_HITBOX_WIDTH, PLAYER_CROUCH_HEIGHT);
    player.body.setOffset(PLAYER_HITBOX_OFFSET_X, PLAYER_CROUCH_OFFSET_Y);
  } else {
    player.body.setSize(PLAYER_HITBOX_WIDTH, PLAYER_HITBOX_HEIGHT);
    player.body.setOffset(PLAYER_HITBOX_OFFSET_X, PLAYER_HITBOX_OFFSET_Y);
  }

  // Left / right movement — blocked while crouching
  if (!crouching && cursors.left.isDown) {
    player.setVelocityX(-PLAYER_SPEED);
    player.setFlipX(true); // face left
  } else if (!crouching && cursors.right.isDown) {
    player.setVelocityX(PLAYER_SPEED);
    player.setFlipX(false); // face right
  } else {
    player.setVelocityX(0);
  }

  // Jump — allowed from both standing and crouching
  if (cursors.up.isDown && onGround) {
    player.setVelocityY(PLAYER_JUMP);
  }

  // Play jump sound once per keypress (JustDown prevents repeating every frame)
  if (Phaser.Input.Keyboard.JustDown(cursors.up) && onGround) {
    player.scene.sound.play("jump-sfx");
  }

  // Play the right animation based on what the player is doing
  if (!onGround) {
    if (player.body.velocity.y < 0) {
      player.anims.play("jump", true);
    } else {
      player.anims.play("fall", true);
    }
  } else if (crouching) {
    // Only call play() when first entering crouch — once the 3 frames finish,
    // Phaser holds on the last frame. Re-calling play() would restart the drop.
    if (
      !player.anims.currentAnim ||
      player.anims.currentAnim.key !== "crouch"
    ) {
      player.anims.play("crouch");
    }
  } else if (cursors.left.isDown || cursors.right.isDown) {
    player.anims.play("run", true);
  } else {
    player.anims.play("idle", true);
  }
}
