import * as THREE from 'three';

// Runtime derivatives are Y-up, height 1, bottom y=0 and front +X.
// Keep the tower and comparison viewer on the same orientation/material contract.
export function prepareStatueModel(model, height = 1) {
  model.rotation.y = -Math.PI / 2;
  model.scale.setScalar(height);
  model.position.y = 0;
  const materials = new Map();
  model.traverse(o => {
    if (!o.isMesh) return;
    const adapt = original => {
      if (!materials.has(original)) {
        materials.set(original, new THREE.MeshStandardMaterial({
          map: original.map, roughness: 0.82, metalness: 0.02,
        }));
      }
      return materials.get(original);
    };
    o.material = Array.isArray(o.material) ? o.material.map(adapt) : adapt(o.material);
    o.castShadow = o.receiveShadow = true;
  });
  for (const original of materials.keys()) original.dispose();
  return model;
}
