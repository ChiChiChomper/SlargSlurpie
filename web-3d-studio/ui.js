
import { saveSLARG, loadSLARG } from './slarg.js';
import * as THREE from './libs/three/build/three.module.js';

export function createUI(scene, renderer, camera) {
    document.getElementById('saveButton').addEventListener('click', () => saveSLARG('scene.slarg', scene));
    document.getElementById('loadButton').addEventListener('click', async () => {
        try {
            const loadedScene = await loadSLARG();
            scene.clear();
            loadedScene.children.forEach(child => scene.add(child));
        } catch (error) {
            console.error("Failed to load .SLARG file:", error);
        }
    });
    document.querySelectorAll('#assets button').forEach(button => {
        button.addEventListener('click', () => {
            let geometry;
            switch (button.dataset.shape) {
                case 'cube':
                    geometry = new THREE.BoxGeometry();
                    break;
                case 'sphere':
                    geometry = new THREE.SphereGeometry(0.5, 32, 32);
                    break;
            }
            const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            updateExplorer(scene);
        });
    });
    updateExplorer(scene);
}

function updateExplorer(scene) {
    const explorerList = document.getElementById('objectList');
    explorerList.innerHTML = '';
    scene.children.forEach(object => {
        const li = document.createElement('li');
        li.textContent = object.name || object.type;
        explorerList.appendChild(li);
    });
}
