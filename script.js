// Core Engine Init
const lenis = new Lenis();
lenis.on("Scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// THREE Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.querySelector(".model").appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 3);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

// Global State
let loadedModels = []; 
let currentModelIndex = 0;
let isFloating = true;
let currentScroll = 0;
const floatAmplitude = 0.0125;
const floatSpeed = 1.5;
const rotationSpeed = 0.3;

// Model Selection Configuration
const modelsConfig = [
    { path: "./assets/bunny_can.glb",       scale: 0.7,   rotation: { z: -0.1645 }, offset: { x: 0, y: 0, z: 0 } }, 
    { path: "./assets/beer_can.glb",        scale: 1.1,   rotation: { y: 0 },       offset: { x: 0, y: 0, z: 0 } },
    { path: "./assets/retro_pepsi_can.glb", scale: 0.185, rotation: { y: 0 },       offset: { x: 0, y: 0, z: 0 } },
    { path: "./assets/can.glb",             scale: 20,    rotation: { y: 0 },       offset: { x: 0, y: 0, z: 0 } }
];

const loader = new THREE.GLTFLoader();

function loadAllModels() {
    modelsConfig.forEach((config, index) => {
        loader.load(config.path, (gltf) => {
            const modelInner = gltf.scene;

            // Compute true geometry center for perfect pivot
            modelInner.updateMatrixWorld(true);
            const box = new THREE.Box3();
            modelInner.traverse((node) => {
                if (node.isMesh) {
                    node.geometry.computeBoundingBox();
                    const meshBox = node.geometry.boundingBox.clone();
                    meshBox.applyMatrix4(node.matrixWorld);
                    box.union(meshBox);
                    
                    if (node.material) {
                        node.material.metalness = 0.3;
                        node.material.roughness = 0.4;
                        node.material.envMapIntensity = 1.5;
                    }
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            const center = box.getCenter(new THREE.Vector3());
            const group = new THREE.Group();
            
            // Pivot Correction
            modelInner.position.set(
                -center.x + (config.offset?.x || 0),
                -center.y + (config.offset?.y || 0),
                -center.z + (config.offset?.z || 0)
            );

            // Manual Rotation Adjustment
            if (config.rotation) {
                modelInner.rotation.x = config.rotation.x || 0;
                modelInner.rotation.y = config.rotation.y || 0;
                modelInner.rotation.z = config.rotation.z || 0;
            }

            group.add(modelInner);
            group.userData.targetScale = config.scale;
            group.scale.set(0, 0, 0);
            group.visible = false;
            
            scene.add(group);
            loadedModels[index] = group;

            if (index === 0) {
                group.visible = true;
                gsap.to(group.scale, { 
                    x: config.scale, 
                    y: config.scale, 
                    z: config.scale, 
                    duration: 1.5, 
                    ease: "power2.out" 
                });
            }
        });
    });
}

loadAllModels();

// Domestic Logic
const stickyHeight = window.innerHeight;
const scannerContainer = document.querySelector(".scan-container");
const scanSound = new Audio("./assets/scan.mp3");
gsap.set(scannerContainer, { scale: 1 });

// Model Switching
const buttons = document.querySelectorAll(".selector-btn");
buttons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
        switchModel(index);
    });
});

function switchModel(index) {
    if (index === currentModelIndex || !loadedModels[index]) return;

    buttons.forEach(b => b.classList.remove("active"));
    buttons[index].classList.add("active");

    const oldModel = loadedModels[currentModelIndex];
    const newModel = loadedModels[index];

    if (oldModel) {
        gsap.to(oldModel.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.in", onComplete: () => { oldModel.visible = false; }});
    }

    newModel.visible = true;
    const targetScale = newModel.userData.targetScale;
    gsap.to(newModel.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 0.8, delay: 0.2, ease: "back.out(1.7)" });

    currentModelIndex = index;
}

// Scroll Handling
lenis.on("scroll", (e) => {
    currentScroll = e.scroll;
});

// Animations
function animate() {
    const group = loadedModels[currentModelIndex];
    if (group) {
        if (isFloating) {
            const floatOffset = Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
            group.position.y = floatOffset;
        }

        const scrollProgress = Math.min(currentScroll / stickyHeight, 1);
        if (scrollProgress < 1) {
            group.rotation.y += 0.01 * rotationSpeed;
            group.rotation.x = scrollProgress * Math.PI * 2;
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Global Triggers
ScrollTrigger.create({
    trigger: ".scanner",
    start: "top top",
    end: `${stickyHeight}px`,
    pin: true,
    onEnter: () => {
        const model = loadedModels[currentModelIndex];
        if (model) {
            isFloating = false;
            model.position.y = 0;
            setTimeout(() => { scanSound.currentTime = 0; scanSound.play(); }, 500);

            gsap.to(model.rotation, {
                y: model.rotation.y + Math.PI * 2,
                duration: 1,
                ease: "power2.inOut",
                onComplete: () => {
                    gsap.to(model.scale, { x:0, y:0, z:0, duration:0.5, onComplete: () => {
                        gsap.to(scannerContainer, { scale: 0, duration: 0.5 });
                    }});
                }
            })
        }
    },
    onLeaveBack: () => {
        gsap.to(scannerContainer, { scale: 1, duration: 0.5 });
        const model = loadedModels[currentModelIndex];
        if (model) {
            const s = model.userData.targetScale;
            gsap.to(model.scale, { x:s, y:s, z:s, duration: 1 });
            isFloating = true;
        }
    }
});

// Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
