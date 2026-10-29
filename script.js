const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const leftScoreEl = document.getElementById("leftScore");
const rightScoreEl = document.getElementById("rightScore");
const startBtn = document.getElementById("startBtn");

const leftPaddle = {
  x: 20,
  y: canvas.height / 2 - 60,
  width: 14,
  height: 120,
  speed: 7,
  color: "#50f5ff"
};

const rightPaddle = {
  x: canvas.width - 34,
  y: canvas.height / 2 - 60,
  width: 14,
  height: 120,
  speed: 5.8,
  color: "#ff4fd8"
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  vx: 0,
  vy: 0
};

const scores = { left: 0, right: 0 };
const keys = { ArrowUp: false, ArrowDown: false };
let mouseY = canvas.height / 2;
let mouseActive = false;
let gameRunning = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function playTone(freq = 300, duration = 0.06, type = "sine") {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const audioCtx = new AudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.03;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

function resetBall(direction = Math.random() < 0.5 ? -1 : 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;

  const speed = 5.2 + Math.random() * 1.3;
  ball.vx = direction * speed;
  ball.vy = (Math.random() * 3.8 - 1.9);

  if (Math.abs(ball.vy) < 1) {
    ball.vy = ball.vy >= 0 ? 1 : -1;
  }
}

function updateScores() {
  leftScoreEl.textContent = scores.left;
  rightScoreEl.textContent = scores.right;
}

function startGame() {
  scores.left = 0;
  scores.right = 0;
  updateScores();
  gameRunning = true;
  resetBall(Math.random() < 0.5 ? -1 : 1);
  startBtn.textContent = "Restart Game";
}

function updateLeftPaddle() {
  if (keys.ArrowUp) leftPaddle.y -= leftPaddle.speed;
  if (keys.ArrowDown) leftPaddle.y += leftPaddle.speed;

  if (mouseActive) {
    const targetY = mouseY - leftPaddle.height / 2;
    leftPaddle.y += (targetY - leftPaddle.y) * 0.2;
  }

  leftPaddle.y = clamp(leftPaddle.y, 0, canvas.height - leftPaddle.height);
}

function updateRightPaddle() {
  const targetY = ball.y - rightPaddle.height / 2;
  const diff = targetY - (rightPaddle.y + rightPaddle.height / 2);

  if (Math.abs(diff) > 0.5) {
    rightPaddle.y += Math.sign(diff) * rightPaddle.speed;
  }

  rightPaddle.y = clamp(rightPaddle.y, 0, canvas.height - rightPaddle.height);
}

function handleWallCollision() {
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
    playTone(240, 0.04, "square");
  }

  if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.vy *= -1;
    playTone(240, 0.04, "square");
  }
}

function handlePaddleCollision() {
  // left paddle
  if (
    ball.x - ball.radius <= leftPaddle.x + leftPaddle.width &&
    ball.x + ball.radius >= leftPaddle.x &&
    ball.y >= leftPaddle.y &&
    ball.y <= leftPaddle.y + leftPaddle.height &&
    ball.vx < 0
  ) {
    const relativeY = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
    ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
    ball.vx = Math.abs(ball.vx) + 0.3;
    ball.vy = relativeY * 6.5;
    playTone(420, 0.06, "triangle");
  }

  // right paddle
  if (
    ball.x + ball.radius >= rightPaddle.x &&
    ball.x - ball.radius <= rightPaddle.x + rightPaddle.width &&
    ball.y >= rightPaddle.y &&
    ball.y <= rightPaddle.y + rightPaddle.height &&
    ball.vx > 0
  ) {
    const relativeY = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
    ball.x = rightPaddle.x - ball.radius;
    ball.vx = -(Math.abs(ball.vx) + 0.3);
    ball.vy = relativeY * 6.5;
    playTone(420, 0.06, "triangle");
  }
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  handleWallCollision();
  handlePaddleCollision();

  if (ball.x + ball.radius < 0) {
    scores.right += 1;
    updateScores();
    playTone(180, 0.2, "sawtooth");
    resetBall(1);
  }

  if (ball.x - ball.radius > canvas.width) {
    scores.left += 1;
    updateScores();
    playTone(180, 0.2, "sawtooth");
    resetBall(-1);
  }
}

function drawPaddle(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd166";
  ctx.fill();
  ctx.closePath();
}

function drawCenterLine() {
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background glow
  ctx.fillStyle = "rgba(80, 245, 255, 0.04)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCenterLine();

  drawPaddle(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, leftPaddle.color);
  drawPaddle(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, rightPaddle.color);
  drawBall();
}

function gameLoop() {
  if (gameRunning) {
    updateLeftPaddle();
    updateRightPaddle();
    updateBall();
  }

  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    keys[event.key] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    keys[event.key] = false;
  }
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  mouseY = (event.clientY - rect.top) * scaleY;
  mouseActive = true;
});

canvas.addEventListener("mouseleave", () => {
  mouseActive = false;
});

startBtn.addEventListener("click", startGame);

updateScores();
resetBall(1);
requestAnimationFrame(gameLoop);
