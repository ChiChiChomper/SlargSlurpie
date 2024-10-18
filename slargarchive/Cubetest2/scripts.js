let scene, camera, renderer, orbitControls, transformControls, actionHistory = [], redoStack = [];
let gridHelper, selectedObjects = new Set(), objectGroups = [];
let isPerspective = true;

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    setupControls();
    createTerrain();
    setupLighting();
    setupGrid();
    setupEventListeners();
    setupDragAndDrop();
    render();
}

function setupControls() {
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.25;
    orbitControls.enableZoom = true;

    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('change', render);
    transformControls.addEventListener('objectChange', () => {
        recordAction({ type: 'update', objects: [...selectedObjects] });
        updateInspector();
    });
    scene.add(transformControls);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

function setupGrid() {
    gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);
}

function createTerrain() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0x7cfc00 });
    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
}

function addShape(shapeType) {
    let geometry;
    const color = document.getElementById('color-picker').value;
    const materialType = document.getElementById('material-select').value;
    const material = getMaterial(color, materialType);

    switch (shapeType) {
        case 'box':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
            break;
        default:
            return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.y = 0.5;
    scene.add(mesh);

    const objectName = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} ${scene.children.length}`;
    const li = document.createElement('li');
    li.textContent = objectName;
    li.dataset.objectId = scene.children.length - 1;
    li.draggable = true;
    li.onclick = (event) => toggleSelection(mesh, li, event);
    document.getElementById('object-list').appendChild(li);

    recordAction({ type: 'add', objects: [mesh] });
    render();
}

function getMaterial(color, type) {
    switch (type) {
        case 'basic':
            return new THREE.MeshBasicMaterial({ color: color });
        case 'phong':
            return new THREE.MeshPhongMaterial({ color: color });
        case 'lambert':
            return new THREE.MeshLambertMaterial({ color: color });
        default:
            return new THREE.MeshStandardMaterial({ color: color });
    }
}

function toggleSelection(object, listItem, event) {
    if (event.ctrlKey || event.metaKey) {
        if (selectedObjects.has(object)) {
            selectedObjects.delete(object);
            listItem.classList.remove('selected');
        } else {
            selectedObjects.add(object);
            listItem.classList.add('selected');
        }
    } else {
        if (selectedObjects.size > 0) {
            [...selectedObjects].forEach(obj => obj !== object && deselectObject(obj));
        }
        selectedObjects = new Set([object]);
        listItem.classList.add('selected');
    }
    transformControls.detach();
    if (selectedObjects.size > 0) {
        transformControls.attach([...selectedObjects][0]);
    }
    updateInspector();
}

function deselectObject(obj) {
    selectedObjects.delete(obj);
    const objectList = document.getElementById('object-list');
    const listItem = Array.from(objectList.children).find(li => li.dataset.objectId === obj.id.toString());
    if (listItem) {
        listItem.classList.remove('selected');
    }
}

function updateInspector() {
    const firstObject = [...selectedObjects][0];
    if (firstObject) {
        const pos = firstObject.position;
        const rot = firstObject.rotation;
        const scale = firstObject.scale;
        document.getElementById('position').textContent = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`;
        document.getElementById('rotation').textContent = `X: ${THREE.MathUtils.radToDeg(rot.x).toFixed(1)}°, Y: ${THREE.MathUtils.radToDeg(rot.y).toFixed(1)}°, Z: ${THREE.MathUtils.radToDeg(rot.z).toFixed(1)}°`;
        document.getElementById('scale').textContent = `X: ${scale.x.toFixed(2)}, Y: ${scale.y.toFixed(2)}, Z: ${scale.z.toFixed(2)}`;
    } else {
        document.getElementById('position').textContent = '';
        document.getElementById('rotation').textContent = '';
        document.getElementById('scale').textContent = '';
    }
}

function toggleGrid() {
    gridHelper.visible = !gridHelper.visible;
    render();
}

function resetCamera() {
    camera.position.set(0, 10, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    orbitControls.update();
    render();
}

function deleteSelectedObject() {
    if (selectedObjects.size > 0) {
        selectedObjects.forEach(object => {
            scene.remove(object);
            removeObjectFromList(object);
        });
        transformControls.detach();
        selectedObjects.clear();
        render();
    }
}

function removeObjectFromList(object) {
    const objectList = document.getElementById('object-list');
    const listItem = Array.from(objectList.children).find(li => li.dataset.objectId === object.id.toString());
    if (listItem) {
        objectList.removeChild(listItem);
    }
}

function groupObjects() {
    if (selectedObjects.size > 1) {
        const group = new THREE.Group();
        scene.add(group);
        selectedObjects.forEach(obj => {
            group.add(obj);
            removeObjectFromList(obj);
        });
        const li = document.createElement('li');
        li.textContent = `Group ${scene.children.length}`;
        li.onclick = () => toggleSelection(group, li);
        li.draggable = true;
        document.getElementById('object-list').appendChild(li);

        selectedObjects.clear();
        selectedObjects.add(group);
        transformControls.attach(group);
    }
}

function ungroupObjects() {
    [...selectedObjects].forEach(selectedObject => {
        if (selectedObject instanceof THREE.Group) {
            selectedObject.children.forEach(child => {
                scene.add(child);
                const li = document.createElement('li');
                li.textContent = `Object ${scene.children.length}`;
                li.onclick = () => toggleSelection(child, li);
                li.draggable = true;
                document.getElementById('object-list').appendChild(li);
            });
            scene.remove(selectedObject);
        }
    });
    transformControls.detach();
    selectedObjects.clear();
    render();
}

function recordAction(action) {
    actionHistory.push(action);
    redoStack = [];
}

function undo() {
    const action = actionHistory.pop();
    if (action) {
        redoStack.push(action);
        switch (action.type) {
            case 'add':
                action.objects.forEach(obj => {
                    scene.remove(obj);
                    deselectObject(obj);
                    removeObjectFromList(obj);
                });
                break;
            case 'update':
                action.objects.forEach(obj => {
                    const { oldPosition, oldRotation, oldScale } = obj.userData;
                    obj.position.copy(oldPosition);
                    obj.rotation.copy(oldRotation);
                    obj.scale.copy(oldScale);
                });
                break;
        }
        render();
    }
}

function redo() {
    const action = redoStack.pop();
    if (action) {
        actionHistory.push(action);
        switch (action.type) {
            case 'add':
                action.objects.forEach(obj => scene.add(obj));
                break;
            case 'update':
                action.objects.forEach(obj => {
                    const { newPosition, newRotation, newScale } = obj.userData;
                    obj.position.copy(newPosition);
                    obj.rotation.copy(newRotation);
                    obj.scale.copy(newScale);
                });
                break;
        }
        render();
    }
}

function saveState(objects) {
    objects.forEach(obj => {
        if (!obj.userData.oldPosition) {
            obj.userData.oldPosition = obj.position.clone();
            obj.userData.oldRotation = obj.rotation.clone();
            obj.userData.oldScale = obj.scale.clone();
        }
        obj.userData.newPosition = obj.position.clone();
        obj.userData.newRotation = obj.rotation.clone();
        obj.userData.newScale = obj.scale.clone();
    });
}

function setupDragAndDrop() {
    const list = document.getElementById('object-list');
    let dragged;

    list.addEventListener('dragstart', (e) => {
        dragged = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    list.addEventListener('drop', (e) => {
        e.stopPropagation();
        if (dragged !== e.target && dragged.parentElement === e.target.parentElement) {
            dragged.parentElement.removeChild(dragged);
            e.target.parentElement.insertBefore(dragged, e.target.nextSibling);
        }
    });
}

function render() {
    orbitControls.update();
    renderer.render(scene, camera);
}

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);

    document.getElementById('add-box').addEventListener('click', () => addShape('box'));
    document.getElementById('add-sphere').addEventListener('click', () => addShape('sphere'));
    document.getElementById('add-cylinder').addEventListener('click', () => addShape('cylinder'));
    document.getElementById('toggle-grid').addEventListener('click', toggleGrid);
    document.getElementById('reset-camera').addEventListener('click', resetCamera);
    document.getElementById('delete-object').addEventListener('click', deleteSelectedObject);
    document.getElementById('group-objects').addEventListener('click', groupObjects);
    document.getElementById('ungroup-objects').addEventListener('click', ungroupObjects);
    document.getElementById('undo').addEventListener('click', undo);
    document.getElementById('redo').addEventListener('click', redo);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

initScene();