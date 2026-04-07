const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const levelDisplay = document.getElementById("level");
const restartBtn = document.getElementById("restartBtn");
const gameMessage = document.getElementById("gameMessage");
const powerTimerDisplay = document.getElementById("powerTimer");

let score = 0;
let lives = 5;
let level = 1;
let gameRunning = false;

// game area size
const gameWidth = 800;
const gameHeight = 500;

// player settings
const playerWidth = 40;
const playerHeight = 40;
const playerSpeed = 8;

let playerX = 380;
let playerY = 220;

// key tracking
const keys = {};

// enemy settings
let baseEnemySpeed = 1.8;
let enemySpeedIncrease = 0.02;
let enemySpawnRate = 1500;
let minSpawnRate = 450;

// power-up settings
let poweredUp = false;
let powerUpTimer = 0;
let powerUpDurationFrames = 300;

// arrays
let enemies = [];
let projectiles = [];
let powerUps = [];

// timers
let enemySpawner = null;
let powerUpSpawner = null;
let difficultyTimer = null;
let animationId = null;
let startTime = Date.now();

// ------------------------
// SHARED COUNT STORAGE
// ------------------------
function addToMainCount(amount) {
  let count = parseInt(localStorage.getItem("count")) || 0;
  count += amount;
  localStorage.setItem("count", count);
  console.log("main count is now", count);
}

// ------------------------
// INPUT
// ------------------------
document.addEventListener("keydown", function (e) {
  const key = e.key.toLowerCase();

  if (
    key === "arrowup" ||
    key === "arrowdown" ||
    key === "arrowleft" ||
    key === "arrowright" ||
    key === " " ||
    key === "w" ||
    key === "a" ||
    key === "s" ||
    key === "d"
  ) {
    e.preventDefault();
  }

  keys[key] = true;
});

document.addEventListener("keyup", function (e) {
  keys[e.key.toLowerCase()] = false;
});

gameArea.addEventListener("click", shoot);

// ------------------------
// PLAYER
// ------------------------
function movePlayer() {
  if (!gameRunning) return;

  if (keys["a"] || keys["arrowleft"]) playerX -= playerSpeed;
  if (keys["d"] || keys["arrowright"]) playerX += playerSpeed;
  if (keys["w"] || keys["arrowup"]) playerY -= playerSpeed;
  if (keys["s"] || keys["arrowdown"]) playerY += playerSpeed;

  if (playerX < 0) playerX = 0;
  if (playerX > gameWidth - playerWidth) playerX = gameWidth - playerWidth;
  if (playerY < 0) playerY = 0;
  if (playerY > gameHeight - playerHeight) playerY = gameHeight - playerHeight;

  player.style.left = playerX + "px";
  player.style.top = playerY + "px";

  if (poweredUp) {
    player.classList.add("powered");
  } else {
    player.classList.remove("powered");
  }
}

// ------------------------
// SHOOTING
// ------------------------
function shoot(e) {
  if (!gameRunning) return;

  const rect = gameArea.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const playerCenterX = playerX + playerWidth / 2;
  const playerCenterY = playerY + playerHeight / 2;

  let dx = mouseX - playerCenterX;
  let dy = mouseY - playerCenterY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return;

  dx /= length;
  dy /= length;

  const projectile = document.createElement("div");
  projectile.classList.add("bullet");
  projectile.style.left = playerCenterX - 4 + "px";
  projectile.style.top = playerCenterY - 4 + "px";
  gameArea.appendChild(projectile);

  projectiles.push({
    element: projectile,
    x: playerCenterX - 4,
    y: playerCenterY - 4,
    dx: dx,
    dy: dy,
    speed: 7,
    size: 8
  });
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    p.x += p.dx * p.speed;
    p.y += p.dy * p.speed;

    p.element.style.left = p.x + "px";
    p.element.style.top = p.y + "px";

    if (
      p.x < -20 ||
      p.x > gameWidth + 20 ||
      p.y < -20 ||
      p.y > gameHeight + 20
    ) {
      p.element.remove();
      projectiles.splice(i, 1);
    }
  }
}

// ------------------------
// ENEMIES
// ------------------------
function getCurrentEnemySpeed() {
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  return baseEnemySpeed + elapsedSeconds * enemySpeedIncrease;
}

function spawnEnemy() {
  if (!gameRunning) return;

  const enemy = document.createElement("div");
  enemy.classList.add("enemy");
  gameArea.appendChild(enemy);

  let x;
  let y;
  const side = Math.floor(Math.random() * 4);

  if (side === 0) {
    x = Math.random() * (gameWidth - 40);
    y = -40;
  } else if (side === 1) {
    x = Math.random() * (gameWidth - 40);
    y = gameHeight + 40;
  } else if (side === 2) {
    x = -40;
    y = Math.random() * (gameHeight - 40);
  } else {
    x = gameWidth + 40;
    y = Math.random() * (gameHeight - 40);
  }

  enemy.style.left = x + "px";
  enemy.style.top = y + "px";

  enemies.push({
    element: enemy,
    x: x,
    y: y,
    size: 40
  });
}

function updateEnemies() {
  const currentEnemySpeed = getCurrentEnemySpeed();

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    const enemyCenterX = enemy.x + enemy.size / 2;
    const enemyCenterY = enemy.y + enemy.size / 2;
    const playerCenterX = playerX + playerWidth / 2;
    const playerCenterY = playerY + playerHeight / 2;

    let dx = playerCenterX - enemyCenterX;
    let dy = playerCenterY - enemyCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      dx /= dist;
      dy /= dist;
    }

    enemy.x += dx * currentEnemySpeed;
    enemy.y += dy * currentEnemySpeed;

    enemy.element.style.left = enemy.x + "px";
    enemy.element.style.top = enemy.y + "px";

    // enemy hits player
    if (
      isColliding(
        enemy.x,
        enemy.y,
        enemy.size,
        enemy.size,
        playerX,
        playerY,
        playerWidth,
        playerHeight
      )
    ) {
      if (poweredUp) {
        enemy.element.remove();
        enemies.splice(i, 1);

        score += 5;
        scoreDisplay.textContent = score;
        addToMainCount(5);
      } else {
        enemy.element.remove();
        enemies.splice(i, 1);

        lives--;
        livesDisplay.textContent = lives;

        if (lives <= 0) {
          endGame();
          return;
        }
      }

      continue;
    }

    // projectile hits enemy
    for (let j = projectiles.length - 1; j >= 0; j--) {
      const p = projectiles[j];

      if (
        isColliding(
          enemy.x,
          enemy.y,
          enemy.size,
          enemy.size,
          p.x,
          p.y,
          p.size,
          p.size
        )
      ) {
        enemy.element.remove();
        enemies.splice(i, 1);

        p.element.remove();
        projectiles.splice(j, 1);

        score += 1;
        scoreDisplay.textContent = score;
        addToMainCount(1);
        break;
      }
    }
  }
}

// ------------------------
// POWER UPS
// ------------------------
function spawnPowerUp() {
  if (!gameRunning) return;
  if (powerUps.length > 0) return;

  const powerUp = document.createElement("div");
  powerUp.classList.add("powerup");

  const x = Math.random() * (gameWidth - 40);
  const y = Math.random() * (gameHeight - 40);

  powerUp.style.left = x + "px";
  powerUp.style.top = y + "px";

  gameArea.appendChild(powerUp);

  powerUps.push({
    element: powerUp,
    x: x,
    y: y,
    size: 40
  });
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];

    if (
      isColliding(
        p.x,
        p.y,
        p.size,
        p.size,
        playerX,
        playerY,
        playerWidth,
        playerHeight
      )
    ) {
      p.element.remove();
      powerUps.splice(i, 1);

      poweredUp = true;
      powerUpTimer = powerUpDurationFrames;
    }
  }

  if (poweredUp) {
    powerUpTimer--;

    const secondsLeft = Math.max(0, powerUpTimer / 60);
    powerTimerDisplay.textContent = secondsLeft.toFixed(1) + "s";

    if (powerUpTimer <= 0) {
      poweredUp = false;
      powerUpTimer = 0;
      powerTimerDisplay.textContent = "0.0s";
    }
  } else {
    powerTimerDisplay.textContent = "0.0s";
  }
}

// ------------------------
// DIFFICULTY
// ------------------------
function increaseDifficulty() {
  if (!gameRunning) return;

  if (enemySpawnRate > minSpawnRate) {
    enemySpawnRate -= 75;

    if (enemySpawnRate < minSpawnRate) {
      enemySpawnRate = minSpawnRate;
    }

    clearInterval(enemySpawner);
    enemySpawner = setInterval(spawnEnemy, enemySpawnRate);
  }
}

function updateLevel() {
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  level = 1 + Math.floor(elapsedSeconds / 10);
  levelDisplay.textContent = level;
}

// ------------------------
// HELPERS
// ------------------------
function isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

// ------------------------
// GAME LOOP
// ------------------------
function gameLoop() {
  if (!gameRunning) return;

  movePlayer();
  updateProjectiles();
  updateEnemies();
  updatePowerUps();
  updateLevel();

  animationId = requestAnimationFrame(gameLoop);
}

// ------------------------
// GAME STATE
// ------------------------
function clearAllObjects() {
  enemies.forEach(enemy => enemy.element.remove());
  projectiles.forEach(projectile => projectile.element.remove());
  powerUps.forEach(powerUp => powerUp.element.remove());

  enemies = [];
  projectiles = [];
  powerUps = [];
}

function clearGameTimers() {
  clearInterval(enemySpawner);
  clearInterval(powerUpSpawner);
  clearInterval(difficultyTimer);
  cancelAnimationFrame(animationId);

  enemySpawner = null;
  powerUpSpawner = null;
  difficultyTimer = null;
  animationId = null;
}

function startGame() {
  clearGameTimers();
  clearAllObjects();

  score = 0;
  lives = 5;
  level = 1;
  gameRunning = true;

  playerX = 380;
  playerY = 220;

  poweredUp = false;
  powerUpTimer = 0;

  enemySpawnRate = 1000;
  startTime = Date.now();

  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;
  levelDisplay.textContent = level;
  powerTimerDisplay.textContent = "0.0s";

  gameMessage.textContent = "";
  gameMessage.style.display = "none";
  restartBtn.style.display = "none";

  movePlayer();
  gameLoop();

  enemySpawner = setInterval(spawnEnemy, enemySpawnRate);
  powerUpSpawner = setInterval(spawnPowerUp, 8000);
  difficultyTimer = setInterval(increaseDifficulty, 5000);
}

function endGame() {
  gameRunning = false;
  clearGameTimers();

  gameMessage.textContent = "Game Over";
  gameMessage.style.display = "block";
  restartBtn.style.display = "inline-block";
}

restartBtn.addEventListener("click", startGame);

startGame();