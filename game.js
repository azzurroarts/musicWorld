import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 800, 6000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);


const textureLoader = new THREE.TextureLoader();
//
// LIGHTING
//

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(50, 100, 50);
scene.add(light);

const blueLight = new THREE.PointLight(0x4de2ff, 2, 900);
blueLight.position.set(0, 120, -250);
scene.add(blueLight);

//
// STARS
//

const starGeo = new THREE.BufferGeometry();
const starVerts = [];

for (let i = 0; i < 7000; i++) {
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
    color: 0x4de2ff,
    emissive: 0x123344
  })
);
wings.position.z = -2;
ship.add(wings);

const cockpit = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 16, 16),
  new THREE.MeshStandardMaterial({
    color: 0xff4dd2,
    emissive: 0xff4dd2,
    emissiveIntensity: 0.25
  })
);
cockpit.position.set(0, 1.1, -0.8);
ship.add(cockpit);

scene.add(ship);

//
// PLANETS
//



function createPlanet(x, y, z, size, texturePath = null, fallbackColor = 0xffffff) {
  const geometry = new THREE.SphereGeometry(size, 64, 64);

  let material;

  if (texturePath) {
    const planetTexture = textureLoader.load(
      texturePath,
      () => console.log('Planet texture loaded:', texturePath),
      undefined,
      (err) => console.error('Planet texture failed:', texturePath, err)
    );
planetTexture.colorSpace = THREE.SRGBColorSpace;
    material = new THREE.MeshBasicMaterial({
  map: planetTexture
});
  } else {
    material = new THREE.MeshStandardMaterial({
      color: fallbackColor,
      emissive: fallbackColor,
      emissiveIntensity: 0.15
    });
  }

  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(x, y, z);
  scene.add(planet);
planet.userData.radius = size;
  return planet;
}
const planets = [

  createPlanet(0, 800, -9000, 1100, 'assets/EquirectPurplePlanet.jpg'),

  createPlanet(-11000, 2200, -21000, 1700, 'assets/EquirectGreenPlanet.jpg'),

  createPlanet(13000, -1800, -26000, 2100, null, 0xff8833),

  createPlanet(-24000, 4500, -38000, 3200, null, 0xffdd55),

  createPlanet(31000, -7000, -60000, 6000, null, 0x5eff9b)

];

//
// 2D SPRITE BILLBOARDS / PLACEHOLDERS
//

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
  createBillboardSprite('https://threejs.org/examples/textures/sprite.png', 80, 20, -220, 35),
  createBillboardSprite('https://threejs.org/examples/textures/sprites/disc.png', -180, 60, -500, 45),
  createBillboardSprite('https://threejs.org/examples/textures/sprites/snowflake1.png', 260, -30, -380, 25)
];

//
// SIMPLE METEORS
//

function createMeteor(x, y, z, size = 12) {
  const meteor = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size, 1),
    new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      emissive: 0x111111
    })
  );

  meteor.position.set(x, y, z);
  meteor.userData.radius = size;
  meteor.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.7,
    (Math.random() - 0.5) * 0.7,
    (Math.random() - 0.5) * 0.7
  );

  scene.add(meteor);
  return meteor;
}

const meteors = [
  createMeteor(0, 30, -180, 11),
  createMeteor(170, -40, -430, 16),
  createMeteor(-130, 90, -360, 13),
  createMeteor(360, 40, -760, 22),
  createMeteor(-420, -20, -920, 18)
];

//
// CONTROLS
//

const keys = {};
const positionReadout = document.getElementById('positionReadout');
const bullets = [];
const planetVelocities = planets.map(() => new THREE.Vector3());
const meteorVelocities = meteors.map(meteor => meteor.userData.velocity.clone());

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (key === 'p') {
    positionReadout.innerHTML =
      `PLACE ITEM HERE:<br>` +
      `x: ${ship.position.x.toFixed(2)},<br>` +
      `y: ${ship.position.y.toFixed(2)},<br>` +
      `z: ${ship.position.z.toFixed(2)}`;
  }

  if (key === ' ') {
    shootBullet();
  }

  if (key === 'e') {
    if (landed) {
      landed = false;
      landedPlanet = null;
      velocity.copy(surfaceNormal.clone().multiplyScalar(4));
    } else {
      tryLand();
    }
  }
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

document.addEventListener('mousemove', e => {
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
let landed = false;
let landedPlanet = null;
let surfaceNormal = new THREE.Vector3();
const landingHeight = 10;

function shootBullet() {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );

  bullet.position.copy(ship.position).add(forward.clone().multiplyScalar(8));
  bullet.userData.velocity = forward.clone().multiplyScalar(8);
  bullet.userData.life = 120;

  scene.add(bullet);
  bullets.push(bullet);
}

function makeImpactFlash(position, color = 0xffff00) {
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(2, 12, 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
  );

  flash.position.copy(position);
  flash.userData.life = 14;
  flash.userData.startScale = 1;
  scene.add(flash);

  return flash;
}

const flashes = [];

function tryLand() {
  for (const planet of planets) {
    const distance = ship.position.distanceTo(planet.position);
    const landingDistance = planet.userData.radius + 80;

    if (distance < landingDistance) {
      landed = true;
      landedPlanet = planet;

      surfaceNormal.copy(
        ship.position.clone().sub(planet.position).normalize()
      );

      ship.position.copy(
        planet.position.clone().add(
          surfaceNormal.clone().multiplyScalar(
            planet.userData.radius + landingHeight
          )
        )
      );

      velocity.set(0, 0, 0);
      return;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  // CAMERA ROTATION
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  // FORWARD VECTOR
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

// MOVEMENT
if (!landed) {
  if (keys['w']) {
    velocity.add(forward.clone().multiplyScalar(0.22));
  }

  if (keys['s']) {
    velocity.add(forward.clone().multiplyScalar(-0.08));
  }

  velocity.multiplyScalar(0.98);
  ship.position.add(velocity);
// AUTO-LAND IF SHIP TOUCHES PLANET SURFACE
if (!landed) {
  for (const planet of planets) {
    const distance = ship.position.distanceTo(planet.position);
    const surfaceDistance = planet.userData.radius + landingHeight;

    if (distance <= surfaceDistance) {
      landed = true;
      landedPlanet = planet;

      surfaceNormal.copy(
        ship.position.clone().sub(planet.position).normalize()
      );

      ship.position.copy(
        planet.position.clone().add(
          surfaceNormal.clone().multiplyScalar(surfaceDistance)
        )
      );

      velocity.set(0, 0, 0);
      break;
    }
  }
}
  ship.lookAt(ship.position.clone().add(forward));
} else if (landedPlanet) {
  surfaceNormal.copy(
    ship.position.clone().sub(landedPlanet.position).normalize()
  );

  const right = new THREE.Vector3()
    .crossVectors(surfaceNormal, forward)
    .normalize();

  const tangentForward = new THREE.Vector3()
    .crossVectors(right, surfaceNormal)
    .normalize();

  if (keys['w']) {
    surfaceNormal.add(tangentForward.multiplyScalar(0.006)).normalize();
  }

  if (keys['s']) {
    surfaceNormal.add(tangentForward.multiplyScalar(-0.006)).normalize();
  }

  if (keys['a']) {
    surfaceNormal.add(right.multiplyScalar(-0.006)).normalize();
  }

  if (keys['d']) {
    surfaceNormal.add(right.multiplyScalar(0.006)).normalize();
  }

  ship.position.copy(
    landedPlanet.position.clone().add(
      surfaceNormal.clone().multiplyScalar(
        landedPlanet.userData.radius + landingHeight
      )
    )
  );

  const lookTarget = ship.position.clone().add(tangentForward);
  ship.up.copy(surfaceNormal);
  ship.lookAt(lookTarget);
}

// SHIP ROTATION
ship.lookAt(ship.position.clone().add(forward));

  // CAMERA FOLLOW
  const camOffset = new THREE.Vector3(0, 4, 16);
  camOffset.applyEuler(camera.rotation);
  camera.position.copy(ship.position.clone().add(camOffset));
  camera.lookAt(ship.position);

  // PLANET ROTATION — slows near ship so landing works
planets.forEach((planet, i) => {
  const distance = ship.position.distanceTo(planet.position);

  const slowStart = planet.userData.radius + 900;
  const fullStop = planet.userData.radius + 250;

  let rotationFactor = (distance - fullStop) / (slowStart - fullStop);

  rotationFactor = Math.max(0, Math.min(1, rotationFactor));

  if (landed && planet === landedPlanet) {
    rotationFactor = 0;
  }

  planet.rotation.y += 0.002 * (i + 1) * rotationFactor;
});

  // BULLETS
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    bullet.position.add(bullet.userData.velocity);
    bullet.userData.life--;

    if (bullet.userData.life <= 0) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }

    // Hit planets
    for (let j = 0; j < planets.length; j++) {
      const planet = planets[j];
      const distance = bullet.position.distanceTo(planet.position);

      if (distance < planet.userData.radius + 2) {
        const knockback = planet.position.clone()
          .sub(bullet.position)
          .normalize()
          .multiplyScalar(4);

        planetVelocities[j].add(knockback);
        planet.scale.set(1.25, 1.25, 1.25);
        flashes.push(makeImpactFlash(bullet.position, 0xffff00));

        scene.remove(bullet);
        bullets.splice(i, 1);
        break;
      }
    }

    // Hit meteors
    for (let j = 0; j < meteors.length && bullets[i]; j++) {
      const meteor = meteors[j];
      const distance = bullet.position.distanceTo(meteor.position);

      if (distance < meteor.userData.radius + 2) {
        const knockback = meteor.position.clone()
          .sub(bullet.position)
          .normalize()
          .multiplyScalar(2.5);

        meteorVelocities[j].add(knockback);
        meteor.scale.set(1.35, 1.35, 1.35);
        flashes.push(makeImpactFlash(bullet.position, 0xffaa00));

        scene.remove(bullet);
        bullets.splice(i, 1);
        break;
      }
    }
  }

  // PLANET BOUNCE / KNOCKBACK
  planets.forEach((planet, index) => {
    planet.position.add(planetVelocities[index]);
    planetVelocities[index].multiplyScalar(0.94);
    planet.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
  });

  // METEOR DRIFT / KNOCKBACK
  meteors.forEach((meteor, index) => {
    meteor.position.add(meteorVelocities[index]);
    meteorVelocities[index].multiplyScalar(0.985);
    meteor.rotation.x += 0.01 + index * 0.002;
    meteor.rotation.y += 0.015 + index * 0.002;
    meteor.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
  });

  // FLASHES
  for (let i = flashes.length - 1; i >= 0; i--) {
    const flash = flashes[i];
    flash.userData.life--;
    flash.scale.multiplyScalar(1.18);
    flash.material.opacity *= 0.84;

    if (flash.userData.life <= 0) {
      scene.remove(flash);
      flashes.splice(i, 1);
    }
  }

  stars.rotation.y += 0.00003;

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
