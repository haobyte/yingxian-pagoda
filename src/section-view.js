import * as THREE from 'three';

// Clip only architecture. Statues and the site's shared materials remain intact.
export function createSectionView(tower, renderer) {
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.35);
  const materials = new Map();
  const center = new THREE.Vector3();
  const fill = new THREE.HemisphereLight(0xfff0d8, 0xa6a297, 1.8);
  fill.name = 'sectionInteriorFill';
  fill.visible = false;
  tower.add(fill);
  let enabled = false;
  let reveal = 0;
  tower.traverse(object => {
    if (!object.isMesh || object.userData.statue || object.userData.statueSupport) return;
    const copy = original => {
      if (!materials.has(original)) {
        const material = original.clone();
        // Material.clone does not retain the wood's triplanar shader hooks.
        material.onBeforeCompile = original.onBeforeCompile;
        material.customProgramCacheKey = original.customProgramCacheKey;
        materials.set(original, material);
      }
      return materials.get(original);
    };
    object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material);
  });
  return {
    get enabled() { return enabled; },
    setEnabled(value) {
      if (value && !enabled) reveal = 0;
      enabled = value;
      fill.visible = value;
      renderer.localClippingEnabled = value;
      for (const [original, material] of materials) {
        material.clippingPlanes = value ? [plane] : null;
        material.clipShadows = value;
        material.side = value ? THREE.DoubleSide : original.side;
        material.needsUpdate = true;
      }
    },
    update(camera, dt = 1 / 60) {
      if (!enabled) return;
      tower.getWorldPosition(center);
      plane.normal.set(center.x - camera.position.x, 0, center.z - camera.position.z);
      if (plane.normal.lengthSq() < 0.0001) return;
      plane.normal.normalize();
      reveal = Math.min(1, reveal + dt / 1.8);
      const eased = reveal * reveal * (3 - 2 * reveal);
      // Sweep in from the facade; statues retain their original unclipped materials.
      plane.constant = -plane.normal.dot(center) + 0.35 + 22 * (1 - eased);
    },
  };
}
