// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

// Setup raycaster and mouse vector for object selection
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

// Animation state variables
let animateRotation = false;
let animatePosition = false;
let animateScale = false;

// Function to create a low-poly rigged person
function createRiggedPerson() {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.25), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const legR = legL.clone();
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    const armR = armL.clone();
    const jointL = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    const jointR = jointL.clone();

    // Position rig parts
    head.position.set(0, 0.75, 0);
    legL.position.set(-0.15, -0.75, 0);
    legR.position.set(0.15, -0.75, 0);
    armL.position.set(-0.4, 0.25, 0);
    armR.position.set(0.4, 0.25, 0);
    jointL.position.set(-0.4, 0.0, 0);
    jointR.position.set(0.4, 0.0, 0);

    const personGroup = new THREE.Group();
    personGroup.add(body, head, legL, legR, armL, armR, jointL, jointR);

    scene.add(personGroup);
    objects.push(personGroup);
    updateObjectList(); // Update the object directory list
}

// Add shapes (cube, sphere, cone)
function addShape(type, color) {
    let geometry;
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
    const material = new THREE.MeshBasicMaterial({ color });
    const shape = new THREE.Mesh(geometry, material);
    shape.position.x = (Math.random() - 0.5) * 4;
    shape.position.y = (Math.random() - 0.5) * 4;
    scene.add(shape);
    objects.push(shape);
    updateObjectList(); // Update the object directory list
}

// Event listeners for shape controls
document.getElementById('add-shape').addEventListener('click', () => {
    const shapeType = document.getElementById('shape-select').value;
    const color = document.getElementById('color-picker').value;
    addShape(shapeType, color);
});

document.getElementById('duplicate-shape').addEventListener('click', () => {
    if (selectedObject) {
        const clone = selectedObject.clone();
        clone.position.x += 0.5;
        scene.add(clone);
        objects.push(clone);
        updateObjectList(); // Update the object directory list
    }
});

document.getElementById('lock-shape').addEventListener('click', () => {
    if (selectedObject && !lockedObjects.has(selectedObject)) {
        lockedObjects.add(selectedObject);
        selectedObject.material.transparent = true;
        selectedObject.material.opacity = 0.5;
    }
});

// Check if the object is locked
function isObjectLocked() {
    return selectedObject && lockedObjects.has(selectedObject);
}

// Scale, rotate, and translate controls
document.getElementById('scale-x').addEventListener('input', event => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.scale.x = event.target.value;
    }
});

document.getElementById('scale-y').addEventListener('input', event => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.scale.y = event.target.value;
    }
});

document.getElementById('scale-z').addEventListener('input', event => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.scale.z = event.target.value;
    }
});

document.getElementById('rotate-x').addEventListener('input', event => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.rotation.x = event.target.value;
    }
});

document.getElementById('rotate-y').addEventListener('input', event => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.rotation.y = event.target.value;
    }
});

document.getElementById('rotate-z').addEventListener('input', event => {
    if (selectedObject && !isObjectLocked()) {
        selectedObject.rotation.z = event.target.value;
    }
});

// Material controls
document.getElementById('material-type').addEventListener('change', event => {
    if (selectedObject) {
        const materialType = event.target.value;
        let newMaterial;
        switch (materialType) {
            case 'basic':
                newMaterial = new THREE.MeshBasicMaterial({ color: selectedObject.material.color });
                break;
            case 'lambert':
                newMaterial = new THREE.MeshLambertMaterial({ color: selectedObject.material.color });
                break;
            case 'phong':
                newMaterial = new THREE.MeshPhongMaterial({ color: selectedObject.material.color, shininess: 50 });
                break;
        }
        selectedObject.material = newMaterial;
    }
});

// Delete shape
document.getElementById('delete-shape').addEventListener('click', () => {
    if (selectedObject && !isObjectLocked()) {
        scene.remove(selectedObject);
        objects.splice(objects.indexOf(selectedObject), 1);
        selectedObject = null;
        document.getElementById('transform-panel').style.display = 'none';
        updateObjectList(); // Update the object directory list
    }
});

// Object selection and mouse click detection
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        document.getElementById('transform-panel').style.display = 'block';
    } else {
        // Deselect if clicking elsewhere
        selectedObject = null;
        document.getElementById('transform-panel').style.display = 'none';
    }
}

window.addEventListener('click', onMouseClick);

// Scene animation
function animate() {
    requestAnimationFrame(animate);

    // Apply animations based on the selected options
    objects.forEach(obj => {
        if (animateRotation) {
            obj.rotation.y += 0.01;
        }
        if (animatePosition) {
            obj.position.x += 0.01 * Math.sin(Date.now() * 0.001);
        }
        if (animateScale) {
            const scale = Math.abs(Math.sin(Date.now() * 0.002)) + 0.5;
            obj.scale.set(scale, scale, scale);
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Resize event handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation control event listeners
document.getElementById('animate-rotation').addEventListener('change', (event) => {
    animateRotation = event.target.checked;
});

document.getElementById('animate-position').addEventListener('change', (event) => {
    animatePosition = event.target.checked;
});

document.getElementById('animate-scale').addEventListener('change', (event) => {
    animateScale = event.target.checked;
});

// Export the scene as OBJ
document.getElementById('export-scene').addEventListener('click', () => {
    const exporter = new THREE.OBJExporter();
    // Ensure that the OBJExporter is created correctly
    if (!exporter) {
        console.error("OBJExporter not found or failed to initialize.");
        return;
    }

    // Clone the scene objects to export
    const exportScene = new THREE.Scene();
    objects.forEach(obj => exportScene.add(obj.clone()));

    const result = exporter.parse(exportScene);

    const blob = new Blob([result], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scene.obj';
    link.click();
});

// Dynamic import for slarg.js saveSLARG and loadSLARG functions
document.getElementById('export-slarg').addEventListener('click', async () => {
    const { saveSLARG } = await import('./slarg.js');
    exportSceneAsSlarg(saveSLARG);
});

document.getElementById('import-slarg').addEventListener('click', async () => {
    const { loadSLARG } = await import('./slarg.js');
    loadSceneFromSlarg(loadSLARG);
});

function exportSceneAsSlarg(saveSLARG) {
    const sceneData = objects.map(object => {
        return {
            position: object.position,
            rotation: object.rotation,
            scale: object.scale,
            type: object.geometry.type,
            color: object.material.color.getHex()
        };
    });

    saveSLARG('scene.slarg', sceneData);
}

async function loadSceneFromSlarg(loadSLARG) {
    try {
        const sceneData = await loadSLARG();
        sceneData.forEach(data => {
            let geometry;
            switch (data.type) {
                case 'BoxGeometry':
                    geometry = new THREE.BoxGeometry();
                    break;
                case 'SphereGeometry':
                    geometry = new THREE.SphereGeometry(0.5, 32, 32);
                    break;
                case 'ConeGeometry':
                    geometry = new THREE.ConeGeometry(0.5, 1, 32);
                    break;
            }

            const material = new THREE.MeshBasicMaterial({ color: data.color });
            const object = new THREE.Mesh(geometry, material);
            object.position.copy(data.position);
            object.rotation.copy(data.rotation);
            object.scale.copy(data.scale);
            scene.add(object);
            objects.push(object);
        });
        updateObjectList(); // Update the object directory list
    } catch (error) {
        console.error("Failed to load .slarg file:", error);
    }
}

// Update object list in the directory panel
function updateObjectList() {
    const objectList = document.getElementById('object-list');
    objectList.innerHTML = '';

    objects.forEach((obj, index) => {
        const li = document.createElement('li');
        li.textContent = obj.name || `Object ${index + 1}`;
        li.addEventListener('click', () => {
            selectedObject = obj;
            document.getElementById('transform-panel').style.display = 'block';
            updateTransformPanel();
        });
        objectList.appendChild(li);
    });
}

// Function to update the transform panel with the selected object's transformations
function updateTransformPanel() {
    if (!selectedObject) return;

    document.getElementById('scale-x').value = selectedObject.scale.x;
    document.getElementById('scale-y').value = selectedObject.scale.y;
    document.getElementById('scale-z').value = selectedObject.scale.z;

    document.getElementById('rotate-x').value = selectedObject.rotation.x;
    document.getElementById('rotate-y').value = selectedObject.rotation.y;
    document.getElementById('rotate-z').value = selectedObject.rotation.z;
}

document.getElementById('save-scene').addEventListener('click', () => {
    alert('Save scene functionality is not implemented yet.');
});

document.getElementById('load-scene').addEventListener('click', () => {
    alert('Load scene functionality is not implemented yet.');
});