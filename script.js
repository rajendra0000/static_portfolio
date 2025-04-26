// Custom cursor
const cursor = document.getElementById('custom-cursor');

document.addEventListener('mousemove', (e) => {
  cursor.style.transform = `translate(${e.clientX - cursor.offsetWidth/2}px, ${e.clientY - cursor.offsetHeight/2}px)`;
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
});

// Enhanced Three.js Background
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Initialize OrbitControls
let controls;
if (typeof THREE.OrbitControls === 'function') {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 100;
  controls.maxDistance = 1000;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('stars-canvas').appendChild(renderer.domElement);

// Create floating grid
const gridGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
const gridMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vElevation;
    uniform float time;
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      float elevation = sin(modelPosition.x * 5.0 + time) * 
                       sin(modelPosition.z * 5.0 + time) * 5.0;
      modelPosition.y += elevation;
      vElevation = elevation;
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vElevation;
    void main() {
      float grid = abs(fract(vUv.x * 50.0) - 0.5) < 0.01 || 
                   abs(fract(vUv.y * 50.0) - 0.5) < 0.01 ? 1.0 : 0.0;
      vec3 color = mix(vec3(0.1, 0.3, 0.6), vec3(0.2, 0.5, 1.0), vElevation / 5.0);
      gl_FragColor = vec4(color * grid, grid * 0.5);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending
});

const grid = new THREE.Mesh(gridGeometry, gridMaterial);
grid.rotation.x = -Math.PI / 2;
grid.position.y = -200;
scene.add(grid);

// Create enhanced nebula
const nebulaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec2 vUv;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float n = noise(uv * 10.0 + time);
      vec3 color = vec3(0.1, 0.3, 0.6) * n;
      gl_FragColor = vec4(color, 0.3);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending
});

const nebulaGeometry = new THREE.PlaneGeometry(2000, 2000);
const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
nebula.position.z = -1000;
scene.add(nebula);

// Create meteors
const meteorCount = 20;
const meteors = [];
for(let i = 0; i < meteorCount; i++) {
  const geometry = new THREE.CylinderGeometry(0, 2, 20);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x6666ff
  });
  const meteor = new THREE.Mesh(geometry, material);
  meteor.position.set(
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000,
    -Math.random() * 1000
  );
  meteor.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() + 1) * 2
  );
  meteors.push(meteor);
  scene.add(meteor);
}

// Enhanced stars with different layers for parallax
const starLayers = [];
const layerCount = 3;
const textureLoader = new THREE.TextureLoader(); // Moved textureLoader declaration here

for(let i = 0; i < layerCount; i++) {
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 2000 * (i + 1); // Using loop variable i instead of layer
  const starsVertices = [];
  const starColors = [];

  for(let j = 0; j < starCount; j++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = -Math.random() * 1000 - (i * 500); // Using loop variable i instead of layer
    starsVertices.push(x, y, z);

    // Add color variation
    const color = new THREE.Color();
    color.setHSL(Math.random(), 0.5, 0.8);
    starColors.push(color.r, color.g, color.b);
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

  const starsMaterial = new THREE.PointsMaterial({
    size: 0.1 + (i * 0.1), // Using loop variable i instead of layer
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  starLayers.push(stars);
  scene.add(stars);
}

// Create Earth
const earthGeometry = new THREE.SphereGeometry(150, 64, 64);


const earthMaterial = new THREE.MeshPhongMaterial({
  map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
  normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
  specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
  shininess: 50
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(0, 0, -500);
scene.add(earth);

// Add clouds layer
const cloudGeometry = new THREE.SphereGeometry(51, 64, 64);
const cloudMaterial = new THREE.MeshPhongMaterial({
  map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
  transparent: true,
  opacity: 0.4
});

const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
earth.add(clouds);

// Create Moon
const moonGeometry = new THREE.SphereGeometry(40, 32, 32);
const moonMaterial = new THREE.MeshPhongMaterial({
  map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg'),
  bumpMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_bump_1024.jpg'),
  bumpScale: 0.2,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
const moonPivot = new THREE.Object3D();
moonPivot.position.copy(earth.position);
moon.position.set(300, 0, 0);
moonPivot.add(moon);
scene.add(moonPivot);

// Add sun light
const sunLight = new THREE.PointLight(0xffffff, 1.5, 2000);
sunLight.position.set(500, 0, -100);
scene.add(sunLight);

// Add ambient light for better visibility
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);


// Add point light
const pointLight = new THREE.PointLight(0x3366ff, 2, 1000);
pointLight.position.set(200, 200, 200);
scene.add(pointLight);

camera.position.z = 1000;

// Mouse movement for parallax
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - window.innerWidth / 2) * 0.1;
  mouseY = (event.clientY - window.innerHeight / 2) * 0.1;
});

// Create shooting stars
const shootingStarCount = 5;
const shootingStars = [];

for(let i = 0; i < shootingStarCount; i++) {
  const geometry = new THREE.BufferGeometry();
  const trail = new Float32Array(18); // 6 vertices for trail
  geometry.setAttribute('position', new THREE.BufferAttribute(trail, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      uniform float time;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
  });

  const star = new THREE.Line(geometry, material);
  star.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    0
  );
  star.lifetime = 0;
  star.maxLifetime = Math.random() * 2 + 1;
  shootingStars.push(star);
  scene.add(star);
}

// Create lens flare

const lensFlare = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABCSURBVChTY/wPBAxUAEzYBISFhRlgbGQxJmQJZWVlsBjMAKyaMGsoKSmB2TADsBqNLAGTxKoTRRJZM7oEQjU2CQYGAIyCH0WdIfhCAAAAAElFTkSuQmCC'),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    color: 0x0099ff
  })
);
lensFlare.scale.set(100, 100, 1);
lensFlare.visible = false;
scene.add(lensFlare);

// Add ambient sound
const audioListener = new THREE.AudioListener();
camera.add(audioListener);
const ambientSound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
let isSoundPlaying = false;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;

  // Smooth camera movement
  targetX += (mouseX - targetX) * 0.02;
  targetY += (mouseY - targetY) * 0.02;
  camera.position.x += (targetX - camera.position.x) * 0.05;
  camera.position.y += (-targetY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  // Animate nebula
  nebulaMaterial.uniforms.time.value = time * 0.2;

  // Animate meteors
  meteors.forEach(meteor => {
    meteor.position.add(meteor.velocity);
    meteor.rotation.x += 0.1;

    if (meteor.position.z > 500) {
      meteor.position.z = -1000;
      meteor.position.x = (Math.random() - 0.5) * 2000;
      meteor.position.y = (Math.random() - 0.5) * 2000;
    }
  });

  // Animate star layers with twinkling
  starLayers.forEach((stars, i) => {
    stars.rotation.y += 0.0002 * (i + 1);
    stars.rotation.x += 0.0001 * (i + 1);
    stars.material.size = 0.1 + (i * 0.1) + Math.sin(time + i) * 0.02;
  });

  // Animate Earth
  earth.rotation.y += 0.001;
  clouds.rotation.y += 0.0005;

  // Animate Moon orbit
  moonPivot.rotation.y += 0.003;
  moon.rotation.y += 0.001;

  // Update OrbitControls if available
  if (controls) {
    controls.update();
  }

  // Animate grid
  grid.material.uniforms.time.value = time * 0.5;

  // Animate shooting stars
  shootingStars.forEach(star => {
    star.lifetime += 0.016;
    if (star.lifetime > star.maxLifetime) {
      star.lifetime = 0;
      star.position.set(
        -1000 + Math.random() * 500,
        500 + Math.random() * 500,
        -500 + Math.random() * 200
      );
    }

    star.position.add(star.velocity);

    const positions = star.geometry.attributes.position.array;
    for(let i = positions.length - 3; i >= 3; i -= 3) {
      positions[i] = positions[i - 3];
      positions[i + 1] = positions[i - 2];
      positions[i + 2] = positions[i - 1];
    }
    positions[0] = star.position.x;
    positions[1] = star.position.y;
    positions[2] = star.position.z;
    star.geometry.attributes.position.needsUpdate = true;
  });

  // Update lens flare position on hover
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (mouseX > rect.left && mouseX < rect.right && 
        mouseY > rect.top && mouseY < rect.bottom) {
      lensFlare.visible = true;
      lensFlare.position.set(
        (mouseX / window.innerWidth) * 1000 - 500,
        -(mouseY / window.innerHeight) * 500 + 250,
        -100
      );
    }
  });

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// Intersection Observer for reveal animations
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all sections with reveal-section class
document.querySelectorAll('.reveal-section').forEach(section => {
  observer.observe(section);
});

// Add hover effect to skill cards
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  });
});

// Hover sound for social icons
const hoverSound = new Audio('data:audio/wav;base64,UklGRHwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////w==');

document.querySelectorAll('.social-icon').forEach(icon => {
  icon.addEventListener('mouseenter', () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Sound toggle functionality
const soundToggle = document.getElementById('sound-toggle');
const soundOnIcon = soundToggle.querySelector('.sound-on');
const soundOffIcon = soundToggle.querySelector('.sound-off');

function updateSoundToggle(isPlaying) {
  soundOnIcon.classList.toggle('hidden', !isPlaying);
  soundOffIcon.classList.toggle('hidden', isPlaying);
  soundToggle.title = isPlaying ? '🔇 Mute Sound' : '🔊 Play Sound';
}

function toggleSound() {
  if (!ambientSound.buffer) {
    audioLoader.load('sound.mp3', (buffer) => {
      ambientSound.setBuffer(buffer);
      ambientSound.setLoop(true);
      ambientSound.setVolume(0.3);
      ambientSound.play();
      isSoundPlaying = true;
      updateSoundToggle(true);
    });
  } else if (isSoundPlaying) {
    ambientSound.pause();
    isSoundPlaying = false;
    updateSoundToggle(false);
  } else {
    ambientSound.play();
    isSoundPlaying = true;
    updateSoundToggle(true);
  }
}

soundToggle.addEventListener('click', toggleSound);

// Form validation
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add your form submission logic here
    alert('Message sent successfully!');
    contactForm.reset();
  });
}

// Initialize Three.js scene first
animate();

// Then handle preloader
window.addEventListener('load', () => {
  document.getElementById('preloader').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('preloader').style.display = 'none';
  }, 500);
});