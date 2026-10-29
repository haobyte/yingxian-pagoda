import * as THREE from 'three';

// Opt-in, development-only measurements from the real tower scene, excluding halo sprites.
export function installStatueAudit({ statues, camera }) {
  const output = document.createElement('script');
  output.id = 'statue-browser-audit';
  output.type = 'application/json';
  document.body.append(output);
  function sample() {
    statues.root.updateWorldMatrix(true, true);
    const supports = [];
    statues.root.parent.traverse(o => {
      if (!o.userData.statueSupport) return;
      const box = new THREE.Box3().setFromObject(o);
      supports.push({ floor: o.userData.statueFloor, min: box.min.toArray(), max: box.max.toArray(), clipped: !!o.material.clippingPlanes?.length });
    });
    const items = statues.items.map(it => {
      const model = it.g.userData.assetModel;
      if (!model) return { key: it.sp.glb, state: it.g.userData.assetState };
      const box = new THREE.Box3().setFromObject(model);
      const rootPosition = new THREE.Vector3();
      it.g.getWorldPosition(rootPosition);
      const quaternion = new THREE.Quaternion();
      model.getWorldQuaternion(quaternion);
      const front = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
      const expectedGround = statues.root.localToWorld(it.home.clone());
      const floorSupports = supports.filter(s => s.floor === it.level);
      const supportTop = floorSupports.length ? Math.max(...floorSupports.map(s => s.max[1])) : expectedGround.y;
      return {
        key: it.sp.glb, floor: it.level, state: it.g.userData.assetState,
        displayHeight: it.sp.assetHeight ?? it.sp.height,
        worldBounds: { min: box.min.toArray(), max: box.max.toArray() },
        actualHeight: box.max.y - box.min.y,
        expectedGround: expectedGround.toArray(), baseDelta: box.min.y - expectedGround.y,
        supportTop, supportDelta: box.min.y - supportTop,
        actualPosition: rootPosition.toArray(), home: it.home.toArray(),
        front: front.toArray(), configuredAzimuth: it.sp.face,
        visible: it.g.visible, scale: it.g.scale.toArray(),
      };
    });
    output.textContent = JSON.stringify({
      status: statues.status, camera: camera.position.toArray(), supports, items,
    });
  }
  sample();
  const timer = setInterval(sample, 500);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
}
