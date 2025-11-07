import {
  Application,
  Graphics,
  Text,
  Container,
  AnimatedSprite,
  Sprite,
  Texture,
  Assets,
} from "pixi.js";
import type { Player, GameEvent } from "./lib/types.ts";
import "./global.css";

// Calculate 16:9 aspect ratio dimensions based on browser width
function getCanvasDimensions() {
  const width = window.innerWidth;
  const height = width * (9 / 16); // 16:9 aspect ratio
  return { width, height };
}

// Create and initialize Pixi application with 16:9 aspect ratio
const app = new Application();

const { width, height } = getCanvasDimensions();

await app.init({
  width,
  height,
  backgroundColor: 0x1a1a2e,
  antialias: true,
});

// Handle window resize to maintain 16:9 aspect ratio
window.addEventListener("resize", () => {
  const { width: newWidth, height: newHeight } = getCanvasDimensions();
  app.renderer.resize(newWidth, newHeight);
});

// Append canvas to DOM
const container = document.getElementById("game-container");
if (container) {
  container.appendChild(app.canvas);
} else {
  console.error("Game container not found");
}

console.log(
  `Pixi app initialized with ${width}x${height} canvas (16:9 aspect ratio)`,
);

// Player management
const playerSprites = new Map<string, Container>();
const messageTexts = new Map<string, Text>();
const playerData = new Map<string, Player>();

// Walk animation frames and dead sprite
let walkFrames: Texture[] = [];
let deadTexture: Texture | null = null;
let backgroundTexture: Texture | null = null;
let boltTexture: Texture | null = null;

// Load walk animation assets and dead sprite
async function loadWalkFrames() {
  try {
    const [frame1, frame2, deadFrame, background, bolt] = await Promise.all([
      Assets.load("/src/assets/walk-1.svg"),
      Assets.load("/src/assets/walk-2.svg"),
      Assets.load("/src/assets/dead.svg"),
      Assets.load("/src/assets/background.svg"),
      Assets.load("/src/assets/bolt.svg"),
    ]);
    walkFrames = [frame1, frame2];
    deadTexture = deadFrame;
    backgroundTexture = background;
    boltTexture = bolt;
    console.log("Walk frames, dead sprite, background, and bolt loaded successfully");
  } catch (error) {
    console.error("Failed to load walk frames:", error);
  }
}

// Initialize walk frames and dead sprite
await loadWalkFrames();

// Create and add background sprite
if (backgroundTexture) {
  const background = new Sprite(backgroundTexture);
  background.width = width;
  background.height = height;
  app.stage.addChildAt(background, 0);
  console.log("Background added to stage");
}

// Load custom font - PixiJS automatically registers it with the browser
await Assets.load({
  src: "/src/assets/WalterTurncoat-Regular.ttf",
  data: {
    family: "Walter Turncoat",
  },
});
console.log("Walter Turncoat font loaded successfully");

// Level display
let levelText: Text | null = null;

function createLevelDisplay(): Text {
  const text = new Text({
    text: "Level 1: Loading...",
    style: {
      fontFamily: "Walter Turncoat",
      fontSize: 56,
      fill: 0xffffff,
      align: "center",
      fontWeight: "bold",
      stroke: {
        color: 0x000000,
        width: 4,
      },
    },
  });
  text.anchor.set(0.5);
  text.x = width / 2;
  text.y = 50;
  return text;
}

function updateLevelDisplay(level: any) {
  if (!levelText) {
    levelText = createLevelDisplay();
    app.stage.addChild(levelText);
  }
  levelText.text = `Level ${level.levelNumber}: ${level.question}`;
}

function createPlayerSprite(player: Player): Container {
  const container = new Container();

  // Create animated sprite for player
  let playerSprite: AnimatedSprite | Graphics;

  if (walkFrames.length > 0) {
    // Use animated sprite if walk frames are loaded
    playerSprite = new AnimatedSprite(walkFrames);
    playerSprite.animationSpeed = 0.05;
    playerSprite.play();

    // Scale the sprite to appropriate size
    const scale = 60 / Math.max(playerSprite.width, playerSprite.height);
    playerSprite.scale.set(scale * 1.8);

    // Center the sprite anchor point
    playerSprite.anchor.set(0.5);

    // Apply tint based on alive status
    playerSprite.tint = player.isAlive ? 0xffffff : 0x666666;
  } else {
    // Fallback to circle if walk frames not loaded
    playerSprite = new Graphics();
    playerSprite.circle(0, 0, 30);
    playerSprite.fill(player.isAlive ? 0x00ff00 : 0xff0000);
    playerSprite.stroke({ width: 2, color: 0xffffff });
  }

  // Create text label
  const text = new Text({
    text: player.name,
    style: {
      fontFamily: "Walter Turncoat",
      fontSize: 20,
      fill: 0xffffff,
      align: "center",
      stroke: {
        color: 0x000000,
        width: 3,
      },
    },
  });
  text.anchor.set(0.5);
  text.y = 60;
  text.scale.set(1.5);

  container.addChild(playerSprite);
  container.addChild(text);

  return container;
}

function addPlayerToScene(player: Player) {
  if (playerSprites.has(player.name)) {
    return; // Player already exists
  }

  const sprite = createPlayerSprite(player);

  // Position players in a circle initially
  const playerCount = playerSprites.size;
  const angle = (playerCount * 2 * Math.PI) / 8; // Max 8 players in circle
  const radius = Math.min(width, height) * 0.3;
  const centerX = width / 2;
  const centerY = height / 2;

  sprite.x = centerX + Math.cos(angle) * radius;
  sprite.y = centerY + Math.sin(angle) * radius;

  app.stage.addChild(sprite);
  playerSprites.set(player.name, sprite);

  // Initialize player data and movement
  const playerWithMovement: Player = {
    ...player,
    velocityX: 0,
    velocityY: 0,
    speed: 0.2 + Math.random() * 0.1,
  };
  playerData.set(player.name, playerWithMovement);
  initializePlayerMovement(player.name);

  console.log(`Added player ${player.name} to scene`);
}

function updatePlayerSprite(playerName: string, player: Player) {
  const sprite = playerSprites.get(playerName);
  if (!sprite) return;

  const playerSprite = sprite.children[0] as AnimatedSprite | Graphics;

  if (playerSprite instanceof AnimatedSprite) {
    if (!player.isAlive && deadTexture) {
      // Show bolt sprite first, then switch to dead sprite
      if (boltTexture) {
        playerSprite.stop();
        playerSprite.textures = [boltTexture];
        playerSprite.gotoAndStop(0);
        
        // Scale the bolt to be big
        const boltScale = 120 / Math.max(playerSprite.width, playerSprite.height);
        playerSprite.scale.set(boltScale * 2);
        
        // After a few frames, switch to dead sprite
        setTimeout(() => {
          if (deadTexture) {
            playerSprite.textures = [deadTexture];
            playerSprite.gotoAndStop(0);
            // Reset scale for dead sprite
            const deadScale = 60 / Math.max(playerSprite.width, playerSprite.height);
            playerSprite.scale.set(deadScale * 1.8);
          }
        }, 500); // Show bolt for 500ms
      }
    } else if (player.isAlive && walkFrames.length > 0) {
      // Restore walk animation
      playerSprite.textures = walkFrames;
      playerSprite.play();
      // Reset scale for walk animation
      const walkScale = 60 / Math.max(playerSprite.width, playerSprite.height);
      playerSprite.scale.set(walkScale * 1.8);
    }
  } else {
    // Update fallback circle
    playerSprite.clear();
    playerSprite.circle(0, 0, 30);
    playerSprite.fill(player.isAlive ? 0x00ff00 : 0xff0000);
    playerSprite.stroke({ width: 2, color: 0xffffff });
  }

  // Update player data and stop movement if dead
  playerData.set(playerName, { ...player });
  if (!player.isAlive) {
    const data = playerData.get(playerName);
    if (data) {
      data.velocityX = 0;
      data.velocityY = 0;
    }
  }
}

// Movement system
function getRandomTarget(): { x: number; y: number } {
  const padding = 0.1;
  const minX = width * padding;
  const maxX = width * (1 - padding);
  const minY = height * padding;
  const maxY = height * (1 - padding);

  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
  };
}

function initializePlayerMovement(playerName: string) {
  const target = getRandomTarget();
  const data = playerData.get(playerName);
  if (data) {
    data.targetX = target.x;
    data.targetY = target.y;
    data.speed = 0.2 + Math.random() * 0.1; // Random speed between 0.2-0.3
  }
}

function updatePlayerMovement(playerName: string, sprite: Container) {
  const data = playerData.get(playerName);
  if (!data || !data.isAlive || !data.targetX || !data.targetY) return;

  const dx = data.targetX - sprite.x;
  const dy = data.targetY - sprite.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    // Reached target, get new target
    const newTarget = getRandomTarget();
    data.targetX = newTarget.x;
    data.targetY = newTarget.y;
  } else {
    // Move towards target
    const moveX = (dx / distance) * (data.speed ?? 1);
    const moveY = (dy / distance) * (data.speed ?? 1);
    sprite.x += moveX;
    sprite.y += moveY;
  }
}

function showMessageAbovePlayer(playerName: string, message: string) {
  const sprite = playerSprites.get(playerName);
  if (!sprite) return;

  // Remove existing message if any
  const existingMessage = messageTexts.get(playerName);
  if (existingMessage) {
    sprite.removeChild(existingMessage);
    messageTexts.delete(playerName);
  }

  // Create new message text
  const messageText = new Text({
    text: message,
    style: {
      fontFamily: "Walter Turncoat",
      fontSize: 24,
      fill: 0xffff00,
      align: "center",
      fontWeight: "bold",
      stroke: {
        color: 0x000000,
        width: 2,
      },
    },
  });

  messageText.anchor.set(0.5);
  messageText.y = -60; // Position above the player
  messageText.alpha = 0; // Start invisible for fade-in

  sprite.addChild(messageText);
  messageTexts.set(playerName, messageText);

  // Fade in animation
  let fadeIn = 0;
  const fadeInInterval = setInterval(() => {
    fadeIn += 0.1;
    messageText.alpha = fadeIn;
    if (fadeIn >= 1) {
      clearInterval(fadeInInterval);

      // Wait 3 seconds then fade out
      setTimeout(() => {
        let fadeOut = 1;
        const fadeOutInterval = setInterval(() => {
          fadeOut -= 0.1;
          messageText.alpha = fadeOut;
          if (fadeOut <= 0) {
            clearInterval(fadeOutInterval);
            sprite.removeChild(messageText);
            messageTexts.delete(playerName);
          }
        }, 50);
      }, 3000);
    }
  }, 50);
}

// SSE connection to server
const eventSource = new EventSource("http://localhost:3000/events");

eventSource.addEventListener("game-state", (event) => {
  const data = JSON.parse(event.data) as GameEvent;
  console.log("Received initial game state:", data);

  if (data.type === "game-state") {
    // Clear existing players
    playerSprites.forEach((sprite) => app.stage.removeChild(sprite));
    playerSprites.clear();

    // Add all players from initial state
    data.payload.players.forEach((player) => {
      addPlayerToScene(player);
    });

    // Update level display
    updateLevelDisplay(data.payload.currentLevel);
  }
});

eventSource.addEventListener("player-joined", (event) => {
  const data = JSON.parse(event.data) as GameEvent;
  console.log("Player joined:", data);

  if (data.type === "player-joined") {
    addPlayerToScene({ name: data.payload.user, isAlive: true });
  }
});

eventSource.addEventListener("judge-result", (event) => {
  const data = JSON.parse(event.data) as GameEvent;
  console.log("Judge result:", data);

  if (data.type === "judge-result") {
    const isAlive = data.payload.result === "correct";
    updatePlayerSprite(data.payload.playerName, {
      name: data.payload.playerName,
      isAlive,
    });
  }
});

eventSource.addEventListener("answer-submitted", (event) => {
  const data = JSON.parse(event.data) as GameEvent;
  console.log("Answer submitted:", data);

  if (data.type === "answer-submitted") {
    showMessageAbovePlayer(data.payload.user, `Answer: ${data.payload.answer}`);
  }
});

eventSource.addEventListener("new-message", (event) => {
  const data = JSON.parse(event.data) as GameEvent;
  console.log("New message:", data);

  if (data.type === "new-message") {
    showMessageAbovePlayer(data.payload.user, data.payload.message);
  }
});

eventSource.addEventListener("load-level", (event) => {
  const data = JSON.parse(event.data) as GameEvent;
  console.log("Load level:", data);

  if (data.type === "load-level") {
    updateLevelDisplay(data.payload.level);
    
    // Update all player sprites and reinitialize movement
    data.payload.players.forEach((player) => {
      updatePlayerSprite(player.name, player);
      initializePlayerMovement(player.name);
    });
  }
});

// Movement game loop
app.ticker.add(() => {
  playerSprites.forEach((sprite, playerName) => {
    updatePlayerMovement(playerName, sprite);
  });
});

eventSource.onerror = (error) => {
  console.error("SSE connection error:", error);
};
