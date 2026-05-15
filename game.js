// game.js

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const dialogueBox = document.getElementById("dialogueBox");
const closeDialogue = document.getElementById("closeDialogue");

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  speed: 0,
  maxSpeed: 5
};

const planet = {
  x: 1200,
  y: 800,
  radius: 80,
  color: "#4de2ff",
  name: "Planet Interval"
};

const camera = {
  x: 0,
  y: 0
};

const stars = [];

for (let i = 0; i < 300; i++) {
  stars.push({
    x: Math.random() * 4000 - 2000,
    y: Math.random() * 4000 - 2000,
    size: Math.random() * 2
  });
}

function drawStars() {
  ctx.fillStyle = "white";

  stars.forEach(star => {
    const sx = star.x - camera.x * 0.2;
    const sy = star.y - camera.y * 0.2;

    ctx.fillRect(sx, sy, star.size, star.size);
  });
}

function drawPlanet() {
  const px = planet.x - camera.x;
  const py = planet.y - camera.y;

  const gradient = ctx.createRadialGradient(
    px - 20,
    py - 20,
    10,
    px,
    py,
    planet.radius
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, planet.color);

  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawShip() {
  const x = ship.x;
  const y = ship.y;

  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(ship.angle);

  // Thruster glow
  ctx.fillStyle = "orange";
  ctx.fillRect(-25, -4, -10 - Math.random() * 10, 8);

  // Ship body
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-20, -12);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-20, 12);
  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

function updateShip() {

  if (dialogueBox.classList.contains("hidden")) {

    if (keys["a"]) ship.angle -= 0.05;
    if (keys["d"]) ship.angle += 0.05;

    if (keys["w"]) {
      ship.speed += 0.1;
    } else {
      ship.speed *= 0.98;
    }

    ship.speed = Math.min(ship.speed, ship.maxSpeed);

    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    camera.x = ship.x - canvas.width / 2;
    camera.y = ship.y - canvas.height / 2;
  }

  const dx = (planet.x - camera.x) - ship.x;
  const dy = (planet.y - camera.y) - ship.y;

  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 140 && keys["e"]) {
    openDialogue();
  }
}

function openDialogue() {
  dialogueBox.classList.remove("hidden");
}

closeDialogue.addEventListener("click", () => {
  dialogueBox.classList.add("hidden");
});

function drawHUD() {

  ctx.fillStyle = "#4de2ff";
  ctx.font = "16px Arial";

  ctx.fillText(
    "W = THRUST | A/D = TURN | E = LAND",
    20,
    30
  );

}

function gameLoop() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars();

  drawPlanet();

  updateShip();

  drawShip();

  drawHUD();

  requestAnimationFrame(gameLoop);
}

gameLoop();
