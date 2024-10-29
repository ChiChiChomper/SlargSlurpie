
import * as THREE from './libs/three/build/three.module.js';
import { saveSLARG, loadSLARG } from './slarg.js';
import { createUI } from './ui.js';

let scene, camera, renderer;
init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 5);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('viewport').appendChild(renderer.domElement);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    createUI(scene, renderer, camera);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
