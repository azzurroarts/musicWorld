import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

//
// LIGHTING
//

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const light = new THREE.DirectionalLight(0xffffff, 2);

light.position.set(50, 100, 50);

scene.add(light);

//
// STARS
//

const starGeo = new THREE.BufferGeometry();

const starVerts = [];

for (let i = 0; i < 6000; i++) {

  starVerts.push(
    (Math.random() - 0.5) * 10000,
    (Math.random() - 0.5) * 10000,
    (Math.random() - 0.5) * 10000
  );

}

starGeo.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVerts, 3)
);

const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2
  })
);

scene.add(stars);

//
// SHIP
//

const ship = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.ConeGeometry(2, 8, 16),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x111111
  })
);

body.rotation.x = Math.PI / 2;

ship.add(body);

const wings = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.4, 2),
  new THREE.MeshStandardMaterial({
    color: 0x4de2ff
  })
);

wings.position.z = -2;

ship.add(wings);

scene.add(ship);

//
// PLANETS
//

function createPlanet(x, y, z, size, color) {

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(size, 32, 32),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15
    })
  );

  planet.position.set(x, y, z);

  scene.add(planet);

  return planet;
}

const planets = [
  createPlanet(100, 0, -300, 30, 0xff4dd2),
  createPlanet(-250, 80, -700, 60, 0x4de2ff),
  createPlanet(500, -100, -1200, 120, 0x5eff9b)
];
//
// 2D SPRITE BILLBOARDS
//

const textureLoader = new THREE.TextureLoader();

function createBillboardSprite(url, x, y, z, scale = 30) {

  const texture = textureLoader.load(url);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });

  const sprite = new THREE.Sprite(material);

  sprite.position.set(x, y, z);

  sprite.scale.set(scale, scale, 1);

  scene.add(sprite);

  return sprite;
}

const spriteNPCs = [

  createBillboardSprite(
    'https://threejs.org/examples/textures/sprite.png',
    80,
    20,
    -220,
    35
  ),

  createBillboardSprite(
    'https://threejs.org/examples/textures/sprites/disc.png',
    -180,
    60,
    -500,
    45
  ),

  createBillboardSprite(
    'https://threejs.org/examples/textures/sprites/snowflake1.png',
    260,
    -30,
    -380,
    25
  )

];
//
// CONTROLS
//
const positionReadout = document.getElementById('positionReadout');

window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'p') {
    positionReadout.innerHTML =
      `PLACE ITEM HERE:<br>
      x: ${ship.position.x.toFixed(2)},<br>
      y: ${ship.position.y.toFixed(2)},<br>
      z: ${ship.position.z.toFixed(2)}`;
  }
});
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

//
// POINTER LOCK
//

document.body.addEventListener('click', () => {
  document.body.requestPointerLock();
});

let yaw = 0;
let pitch = 0;

document.addEventListener('mousemove', (e) => {

  if (document.pointerLockElement === document.body) {

    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  }

});

//
// MOVEMENT
//

const velocity = new THREE.Vector3();

function animate() {

  requestAnimationFrame(animate);

  //
  // CAMERA ROTATION
  //

  camera.rotation.order = 'YXZ';

  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  //
  // FORWARD VECTOR
  //

  const forward = new THREE.Vector3();

  camera.getWorldDirection(forward);

  //
  // MOVEMENT
  //

  if (keys['w']) {

    velocity.add(
      forward.clone().multiplyScalar(0.08)
    );

  }

  if (keys['s']) {

    velocity.add(
      forward.clone().multiplyScalar(-0.05)
    );

  }

  velocity.multiplyScalar(0.98);

  ship.position.add(velocity);

  //
  // SHIP ROTATION
  //

  ship.lookAt(
    ship.position.clone().add(forward)
  );

  //
  // CAMERA FOLLOW
  //

  const camOffset = new THREE.Vector3(0, 4, 16);

  camOffset.applyEuler(camera.rotation);

  camera.position.copy(
    ship.position.clone().add(camOffset)
  );

  camera.lookAt(ship.position);

  //
  // PLANET ROTATION
  //

  planets.forEach((planet, i) => {
    planet.rotation.y += 0.002 * (i + 1);
  });

  renderer.render(scene, camera);

}

animate();

//
// RESIZE
//

window.addEventListener('resize', () => {

  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

});
