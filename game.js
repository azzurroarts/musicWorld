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

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(10, 20, 10);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const ship = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.ConeGeometry(2, 8, 16),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
body.rotation.x = Math.PI / 2;
ship.add(body);

const wings = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.4, 2),
  new THREE.MeshStandardMaterial({ color: 0x4de2ff })
);
wings.position.z = -2;
ship.add(wings);

scene.add(ship);

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(25, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xff4dd2,
    emissive: 0x331122
  })
);
planet.position.set(80, 10, -160);
scene.add(planet);

const starGeo = new THREE.BufferGeometry();
const starPositions = [];

for (let i = 0; i < 2000; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000
  );
}

starGeo.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 2 })
);

scene.add(stars);

const keys = {};
let speed = 0;

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function animate() {
  requestAnimationFrame(animate);

  if (keys['a']) ship.rotation.y += 0.04;
  if (keys['d']) ship.rotation.y -= 0.04;

  if (keys['w']) speed += 0.04;
  else speed *= 0.96;

  speed = Math.min(speed, keys['shift'] ? 2 : 1);

  ship.position.x -= Math.sin(ship.rotation.y) * speed;
  ship.position.z -= Math.cos(ship.rotation.y) * speed;

  const camOffset = new THREE.Vector3(0, 8, 24);
  camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.rotation.y);

  camera.position.copy(ship.position).add(camOffset);
  camera.lookAt(ship.position);

  planet.rotation.y += 0.01;
  stars.rotation.y += 0.0002;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
