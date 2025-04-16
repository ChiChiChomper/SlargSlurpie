// THREE.js Scene Initialization
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
let lockedObjects = new Set();
const objects = [];

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 2).normalize();
scene.add(light);

// Add Shape Function
function addShape(type, color) {
    let geometry;
    let material = new THREE.MeshBasicMaterial({ color });

    switch (type) {
        case 'cube':
            geometry = new THREE.BoxGeometry();
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(0.5, 1, 32);
            break;
        case 'rig':
            createRiggedPerson();
            return;
    }

    const shape = new THREE.Mesh(geometry, material);
    shape.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
    );

    scene.add(shape);
    objects.push(shape);
    selectedObject = shape;
}

// Create Low Poly Person
function createRiggedPerson() {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.25), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const legR = legL.clone();
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const armR = armL.clone();

    head.position.set(0, 0.75, 0);
    legL.position.set(-0.15, -0.75, 0);
    legR.position.set(0.15, -0.75, 0);
    armL.position.set(-0.4, 0.25, 0);
    armR.position.set(0.4, 0.25, 0);

    const personGroup = new THREE.Group();
    personGroup.add(body, head, legL, legR, armL, armR);
    personGroup.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
    );

    personGroup.userData = {
        type: 'rigged',
        limbs: { head, legL, legR, armL, armR },
    };

    scene.add(personGroup);
    objects.push(personGroup);
    selectedObject = personGroup;
}

// Handle Material Application (Group/Mesh)
function applyMaterialToObject(obj, material) {
    if (obj instanceof THREE.Group) {
        obj.traverse(child => {
            if (child.isMesh) child.material = material;
        });
    } else if (obj.isMesh) {
        obj.material = material;
    }
}

// Handle Lock Visuals
function setLockedVisual(obj, locked) {
    const apply = (mesh) => {
        if (!mesh.material) return;
        mesh.material.transparent = locked;
        mesh.material.opacity = locked ? 0.5 : 1.0;
    };

    if (obj instanceof THREE.Group) {
        obj.traverse(child => child.isMesh && apply(child));
    } else {
        apply(obj);
    }
}

// UI Event Bindings
document.getElementById('add-shape').addEventListener('click', () => {
    const shapeType = document.getElementById('shape-select').value;
    const color = document.getElementById('color-picker').value;
    addShape(shapeType, color);
});

document.getElementById('duplicate-shape').addEventListener('click', () => {
    if (selectedObject) {
        const clone = selectedObject.clone(true);
        clone.position.x += 0.5;
        scene.add(clone);
        objects.push(clone);
    }
});

document.getElementById('lock-shape').addEventListener('click', () => {
    if (selectedObject && !lockedObjects.has(selectedObject)) {
        lockedObjects.add(selectedObject);
        setLockedVisual(selectedObject, true);
    }
});

function isObjectLocked() {
    return selectedObject && lockedObjects.has(selectedObject);
}

document.getElementById('scale-range').addEventListener('input', (event) => {
    if (selectedObject && !isObjectLocked()) {
        const scaleValue = event.target.value;
        selectedObject.scale.set(scaleValue, scaleValue, scaleValue);
    }
});

document.getElementById('rotate-range').addEventListener('input', (event) => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.rotation.y = event.target.value;
    }
});

document.getElementById('translate-x').addEventListener('input', (event) => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.position.x = event.target.value;
    }
});
document.getElementById('translate-y').addEventListener('input', (event) => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.position.y = event.target.value;
    }
});
document.getElementById('translate-z').addEventListener('input', (event) => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.position.z = event.target.value;
    }
});

document.getElementById('material-select').addEventListener('change', (event) => {
    if (selectedObject) {
        const materialType = event.target.value;
        const color = selectedObject.material?.color ?? new THREE.Color(0xffffff);
        let newMaterial;

        switch (materialType) {
            case 'basic':
                newMaterial = new THREE.MeshBasicMaterial({ color });
                break;
            case 'phong':
                newMaterial = new THREE.MeshPhongMaterial({ color });
                break;
            case 'wireframe':
                newMaterial = new THREE.MeshBasicMaterial({ color, wireframe: true });
                break;
        }

        applyMaterialToObject(selectedObject, newMaterial);
    }
});

document.getElementById('delete-shape').addEventListener('click', () => {
    if (selectedObject && !isObjectLocked()) {
        scene.remove(selectedObject);
        objects.splice(objects.indexOf(selectedObject), 1);
        selectedObject = null;
        document.getElementById('transform-panel').style.display = 'none';
    }
});

// Selection with Group Support
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        while (selectedObject.parent && !(objects.includes(selectedObject))) {
            selectedObject = selectedObject.parent;
        }
        document.getElementById('transform-panel').style.display = 'block';
    }
}
window.addEventListener('click', onMouseClick);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
