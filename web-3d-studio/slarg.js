
export function saveSLARG(filename, scene) {
    const data = {
        objects: scene.children.map((object) => ({
            type: object.type,
            position: object.position.toArray(),
            rotation: object.rotation.toArray(),
            scale: object.scale.toArray(),
            geometry: object.geometry ? object.geometry.toJSON() : null,
            material: object.material ? object.material.toJSON() : null,
        }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

export function loadSLARG() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.slarg';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const scene = new THREE.Scene();

                    data.objects.forEach((objData) => {
                        let object;
                        if (objData.geometry) {
                            const geometry = new THREE.BufferGeometry().fromJSON(objData.geometry);
                            const material = new THREE.MeshStandardMaterial().copy(objData.material);
                            object = new THREE.Mesh(geometry, material);
                        } else {
                            object = new THREE.Object3D();
                        }
                        object.position.fromArray(objData.position);
                        object.rotation.fromArray(objData.rotation);
                        object.scale.fromArray(objData.scale);
                        scene.add(object);
                    });
                    resolve(scene);
                } catch (error) {
                    reject(new Error("Failed to parse .SLARG file."));
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file."));
            reader.readAsText(file);
        };
        input.click();
    });
}
