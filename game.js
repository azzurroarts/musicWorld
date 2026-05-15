
const canvas = document.getElementById("game");
const targetInfo = document.getElementById("targetInfo");
const dialogueBox = document.getElementById("dialogueBox");
const closeDialogue = document.getElementById("closeDialogue");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02020c, 0.0018);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 8000);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const clock = new THREE.Clock();

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "f" && currentPlanet && !dialogueOpen()) {
    openDialogue(currentPlanet);
  }
});
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

closeDialogue.addEventListener("click", () => dialogueBox.classList.add("hidden"));

function dialogueOpen() {
  return !dialogueBox.classList.contains("hidden");
}

function openDialogue(planet) {
  document.getElementById("npcName").textContent = planet.userData.npc;
  document.getElementById("dialogueText").textContent = planet.userData.lesson;
  dialogueBox.classList.remove("hidden");
}

// Lights
scene.add(new THREE.AmbientLight(0x7a8cff, 0.55));

const sun = new THREE.PointLight(0xffffff, 2.4, 5000);
sun.position.set(400, 500, 600);
scene.add(sun);

const pinkLight = new THREE.PointLight(0xff4dd2, 1.4, 1600);
pinkLight.position.set(-500, -200, -300);
scene.add(pinkLight);

// Starfield
function createStars(count, spread, size) {
  const positions = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    positions.push(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );

    const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.18, 0.75, 0.72 + Math.random() * 0.25);
    colors.push(c.r, c.g, c.b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

const starsFar = createStars(2400, 7000, 2.1);
const starsNear = createStars(500, 2200, 3.4);

// Nebula clouds: transparent sprite discs
const nebulaGroup = new THREE.Group();
scene.add(nebulaGroup);

for (let i = 0; i < 24; i++) {
  const geo = new THREE.CircleGeometry(180 + Math.random() * 340, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: Math.random() > 0.5 ? 0x4de2ff : 0xff4dd2,
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const cloud = new THREE.Mesh(geo, mat);
  cloud.position.set((Math.random() - 0.5) * 2600, (Math.random() - 0.5) * 1600, (Math.random() - 0.5) * 2600);
  cloud.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  nebulaGroup.add(cloud);
}

// Ship model made from simple geometry. Replace this later with GLTF if you want.
const ship = new THREE.Group();
scene.add(ship);

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.35, roughness: 0.28 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x4de2ff, emissive: 0x1a8cff, emissiveIntensity: 0.45, metalness: 0.1, roughness: 0.15 });
const wingMat = new THREE.MeshStandardMaterial({ color: 0xff4dd2, emissive: 0x4d0028, emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.35 });

const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 4), bodyMat);
nose.rotation.x = Math.PI / 2;
nose.position.z = -1;
ship.add(nose);

const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 12), glassMat);
cabin.scale.set(0.8, 0.55, 1.1);
cabin.position.set(0, 0.22, -0.55);
ship.add(cabin);

const rear = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.2, 8), bodyMat);
rear.rotation.x = Math.PI / 2;
rear.position.z = 0.55;
ship.add(rear);

function wing(x) {
  const g = new THREE.BoxGeometry(1.8, 0.12, 0.65);
  const m = new THREE.Mesh(g, wingMat);
  m.position.set(x, -0.08, 0.35);
  m.rotation.z = x > 0 ? -0.22 : 0.22;
  return m;
}
ship.add(wing(0.95));
ship.add(wing(-0.95));

const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.9 });
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 16), flameMat);
flame.rotation.x = -Math.PI / 2;
flame.position.z = 1.45;
ship.add(flame);

const shipState = {
  velocity: new THREE.Vector3(),
  thrust: 0,
  turnSpeed: 1.8,
  rollSpeed: 2.0,
  drag: 0.985,
  maxSpeed: 58
};
ship.position.set(0, 0, 0);

// Planets
const planets = [];

function createPlanet({ name, npc, lesson, position, radius, color, emissive, ring = false }) {
  const group = new THREE.Group();
  group.position.copy(position);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.08, roughness: 0.65, metalness: 0.02 })
  );
  group.add(planet);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.05, 48, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.BackSide })
  );
  group.add(atmosphere);

  if (ring) {
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.35, radius * 1.9, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    ringMesh.rotation.x = Math.PI / 2.8;
    ringMesh.rotation.z = 0.35;
    group.add(ringMesh);
  }

  group.userData = { name, npc, lesson, radius };
  scene.add(group);
  planets.push(group);
  return group;
}

createPlanet({
  name: "Interval Station",
  npc: "CAPTAIN SOL",
  lesson: "Intervals are the distances between notes. A fifth feels big and heroic. A semitone feels tiny, tense, and a bit rude.",
  position: new THREE.Vector3(150, 40, -420),
  radius: 42,
  color: 0x4de2ff,
  emissive: 0x001d33,
  ring: true
});

createPlanet({
  name: "Chord Moon",
  npc: "LADY TRIAD",
  lesson: "A chord is three or more notes stacked together. Major chords sound bright; minor chords sound like they just read an old text message at 2am.",
  position: new THREE.Vector3(-330, -90, -760),
  radius: 58,
  color: 0xff4dd2,
  emissive: 0x330011
});

createPlanet({
  name: "Rhythm Giant",
  npc: "METRONOME BASTARD",
  lesson: "Rhythm is music organised through time. If pitch is where you are, rhythm is when you crash into the asteroid.",
  position: new THREE.Vector3(520, 180, -1100),
  radius: 88,
  color: 0xffdf70,
  emissive: 0x332000,
  ring: true
});

// Asteroids
const asteroidGroup = new THREE.Group();
scene.add(asteroidGroup);
const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x7b7285, roughness: 0.9 });

for (let i = 0; i < 55; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(4 + Math.random() * 12, 0), asteroidMat);
  rock.position.set((Math.random() - 0.5) * 900, (Math.random() - 0.5) * 420, -250 - Math.random() * 900);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock.userData.spin = new THREE.Vector3(Math.random() * 0.6, Math.random() * 0.6, Math.random() * 0.6);
  asteroidGroup.add(rock);
}

let currentPlanet = null;

function updateShip(dt) {
  if (dialogueOpen()) return;

  const boost = keys["shift"] ? 2.1 : 1;

  if (keys["a"] || keys["arrowleft"]) ship.rotation.y += shipState.turnSpeed * dt;
  if (keys["d"] || keys["arrowright"]) ship.rotation.y -= shipState.turnSpeed * dt;
  if (keys["arrowup"]) ship.rotation.x += shipState.turnSpeed * 0.65 * dt;
  if (keys["arrowdown"]) ship.rotation.x -= shipState.turnSpeed * 0.65 * dt;
  if (keys["q"]) ship.rotation.z += shipState.rollSpeed * dt;
  if (keys["e"]) ship.rotation.z -= shipState.rollSpeed * dt;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);

  if (keys["w"]) {
    shipState.velocity.addScaledVector(forward, 38 * boost * dt);
    shipState.thrust = THREE.MathUtils.lerp(shipState.thrust, 1, 0.2);
  } else if (keys["s"]) {
    shipState.velocity.addScaledVector(forward, -20 * dt);
    shipState.thrust = THREE.MathUtils.lerp(shipState.thrust, 0.45, 0.14);
  } else {
    shipState.thrust = THREE.MathUtils.lerp(shipState.thrust, 0.08, 0.08);
  }

  if (shipState.velocity.length() > shipState.maxSpeed * boost) {
    shipState.velocity.setLength(shipState.maxSpeed * boost);
  }

  ship.position.addScaledVector(shipState.velocity, dt);
  shipState.velocity.multiplyScalar(Math.pow(shipState.drag, dt * 60));

  flame.scale.setScalar(0.5 + shipState.thrust * 1.9 + Math.random() * 0.2);
  flame.visible = shipState.thrust > 0.12;
}

function updateCamera(dt) {
  const behind = new THREE.Vector3(0, 4.5, 12).applyQuaternion(ship.quaternion);
  const desiredPos = ship.position.clone().add(behind);
  camera.position.lerp(desiredPos, 1 - Math.pow(0.001, dt));

  const lookAt = ship.position.clone().add(new THREE.Vector3(0, 0, -18).applyQuaternion(ship.quaternion));
  camera.lookAt(lookAt);
}

function updateWorld(dt) {
  starsFar.rotation.y += dt * 0.006;
  starsNear.rotation.y -= dt * 0.012;
  nebulaGroup.rotation.z += dt * 0.003;

  planets.forEach((p) => {
    p.children[0].rotation.y += dt * 0.12;
    if (p.children[2]) p.children[2].rotation.z += dt * 0.05;
  });

  asteroidGroup.children.forEach((rock) => {
    rock.rotation.x += rock.userData.spin.x * dt;
    rock.rotation.y += rock.userData.spin.y * dt;
    rock.rotation.z += rock.userData.spin.z * dt;
  });
}

function checkPlanetProximity() {
  currentPlanet = null;
  let closestDistance = Infinity;

  for (const planet of planets) {
    const dist = ship.position.distanceTo(planet.position);
    const landRange = planet.userData.radius + 38;

    if (dist < landRange && dist < closestDistance) {
      currentPlanet = planet;
      closestDistance = dist;
    }
  }

  if (currentPlanet) {
    targetInfo.textContent = `Near ${currentPlanet.userData.name} · Press F to hail / land`;
  } else {
    const nearest = planets
      .map((p) => ({ p, d: ship.position.distanceTo(p.position) }))
      .sort((a, b) => a.d - b.d)[0];

    targetInfo.textContent = `Nearest: ${nearest.p.userData.name} · ${Math.round(nearest.d)}m`;
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  updateShip(dt);
  updateCamera(dt);
  updateWorld(dt);
  checkPlanetProximity();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
