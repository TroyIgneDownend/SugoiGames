// ─────────────────────────────────────────────
//  player.js — Pink Man player character
//  Edit this file to change how the player looks and feels.
// ─────────────────────────────────────────────

// ── Tuning values ──────────────────────────────
var PLAYER_SPEED = 165; // horizontal move speed (pixels/sec)
var PLAYER_JUMP = -353; // jump velocity — more negative = higher jump
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

// Attack mechanic — triggered by E key
var ATTACK_DAMAGE = 1; // base damage dealt to enemies
var ATTACK_SPEED = 3; // attacks per second (cooldown = 1/3 = 0.333s)
var ATTACK_DURATION = 0.3; // seconds that the red flash displays
var ATTACK_HITBOX_WIDTH = 30; // pixels wide
var ATTACK_HITBOX_HEIGHT = 30; // pixels tall
var ATTACK_RANGE = 16; // distance ahead of player center to place hitbox (roughly 1 tile)
var POGO_BOOST = 206; // extra horizontal speed burst added on a successful pogo

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

  // Initialize pogo boost
  player.pogoBoost = 0;
  player.pogoWindowEndTime = 0; // timestamp for pogo input window

  // Initialize attack state
  player.isAttacking = false; // locked during attack animation
  player.attackCooldownEnd = 0; // timestamp when cooldown expires

  return player;
}

// ── Movement + animation each frame ────────────
// Called from update() in game.js.
function playerUpdate(player, cursors, attackKey) {
  var onGround = player.body.blocked.down; // true when standing on a tile
  var crouching = cursors.down.isDown && onGround; // crouch only while on ground
  var attackKeyJustPressed = Phaser.Input.Keyboard.JustDown(attackKey); // Check key once to avoid consuming it

  // ── Attack mechanic ────────────────────────────
  // Check if E key was just pressed on ground and attack is off cooldown
  if (attackKeyJustPressed && !player.isAttacking && player.scene.time.now >= player.attackCooldownEnd && onGround) {
    // Start attack state
    player.isAttacking = true;
    player.setTint(0xff6b6b); // red tint for 0.3 seconds

    // Calculate hitbox position: 1 tile ahead in the facing direction
    var hitboxX = player.flipX ? player.x - ATTACK_RANGE : player.x + ATTACK_RANGE;
    var hitboxY = player.y;

    // Create a temporary damage hitbox (invisible rectangle for overlap detection)
    var attackHitbox = player.scene.add.rectangle(hitboxX, hitboxY, ATTACK_HITBOX_WIDTH, ATTACK_HITBOX_HEIGHT);
    attackHitbox.damage = ATTACK_DAMAGE;
    attackHitbox.isAttackHitbox = true;
    player.scene.physics.world.enable(attackHitbox);
    attackHitbox.body.setCollideWorldBounds(false); // hitbox doesn't collide with world

    // Schedule end of attack: reset color, remove hitbox, allow input again
    player.scene.time.delayedCall(ATTACK_DURATION * 1000, function () {
      player.isAttacking = false;
      player.clearTint(); // remove red tint
      attackHitbox.destroy();
    });

    // Set cooldown: next attack allowed after attack speed interval
    player.attackCooldownEnd = player.scene.time.now + (1000 / ATTACK_SPEED);
  }

  // ── Pogo mechanic: buffer E press while in air, pogo on landing within 0.2s ──
  // Attack (ground) and pogo (air) already can't conflict since their conditions are mutually exclusive.
  if (!onGround && attackKeyJustPressed) {
    player.pogoWindowEndTime = player.scene.time.now + 200; // 200ms window to land
  }

  // Check for landing within window
  if (onGround && player.pogoWindowEndTime > player.scene.time.now) {
    // Pogo: regain jump
    player.setVelocityY(PLAYER_JUMP);

    // Apply horizontal boost in the direction the player is already moving
    if (player.body.velocity.x > 0) {
      player.pogoBoost = POGO_BOOST;
    } else if (player.body.velocity.x < 0) {
      player.pogoBoost = -POGO_BOOST;
    }

    // Reset window
    player.pogoWindowEndTime = 0;
  }

  // Resize hitbox based on crouch state.
  // offsetY must increase when height shrinks to keep feet planted.
  if (crouching) {
    player.body.setSize(PLAYER_HITBOX_WIDTH, PLAYER_CROUCH_HEIGHT);
    player.body.setOffset(PLAYER_HITBOX_OFFSET_X, PLAYER_CROUCH_OFFSET_Y);
  } else {
    player.body.setSize(PLAYER_HITBOX_WIDTH, PLAYER_HITBOX_HEIGHT);
    player.body.setOffset(PLAYER_HITBOX_OFFSET_X, PLAYER_HITBOX_OFFSET_Y);
  }

  // Left / right movement — blocked while attacking or crouching
  if (!player.isAttacking && !crouching && cursors.left.isDown) {
    player.setVelocityX(-PLAYER_SPEED);
    player.setFlipX(true); // face left
  } else if (!player.isAttacking && !crouching && cursors.right.isDown) {
    player.setVelocityX(PLAYER_SPEED);
    player.setFlipX(false); // face right
  } else if (!player.isAttacking) {
    player.setVelocityX(0);
  } else if (player.isAttacking) {
    // Cancel all movement during attack
    player.setVelocityX(0);
  }

  // Jump — allowed from both standing and crouching (but not during attack)
  if (!player.isAttacking && cursors.up.isDown && onGround) {
    player.setVelocityY(PLAYER_JUMP);
  }

  // Play jump sound once per keypress (JustDown prevents repeating every frame)
  if (Phaser.Input.Keyboard.JustDown(cursors.up) && onGround) {
    player.scene.sound.play("jump-sfx");
  }

  // Apply and decay pogo boost
  if (player.pogoBoost !== 0) {
    player.setVelocityX(player.body.velocity.x + player.pogoBoost);
    player.pogoBoost *= 0.96; // decay over ~90 frames (~1.5s at 60fps)
    if (Math.abs(player.pogoBoost) < 1) {
      player.pogoBoost = 0; // stop when negligible
    }
  }

  // Play the right animation based on what the player is doing
  // During attack, hold current animation (player is locked)
  if (!player.isAttacking) {
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
}
