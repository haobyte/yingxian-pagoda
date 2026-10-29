import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FACES, T8, C8, cornerDir, BoxBatch } from './lib/kit.js';
import { apothemFromSide } from './pagoda-spec.js';

// 3D Visual Diagnostics & 1:1 Scale World Towers Comparison Overlays
export function createOverlays(scene, tower, info, setDeform) {
  const root = new THREE.Group();
  root.name = 'overlays';
  scene.add(root);

  const towerOverlays = new THREE.Group();
  towerOverlays.name = 'towerOverlays';
  tower.add(towerOverlays);

  // ============================================================================
  // 1. World's Three Great Towers 1:1 Scale Comparison + Elevation Grid (Chapter I)
  // ============================================================================
  const scaleGroup = new THREE.Group();
  scaleGroup.visible = false;
  root.add(scaleGroup);

  const worldTowersGroup = new THREE.Group();
  scaleGroup.add(worldTowersGroup);

  // High-contrast dark architectural elevation backdrop behind the 3 towers (fog: false, renderOrder: -1)
  const backdropGeo = new THREE.PlaneGeometry(152, 92);
  const backdropMat = new THREE.MeshBasicMaterial({
    color: 0x0b1322,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
  backdrop.position.set(0, 46, -20);
  backdrop.renderOrder = -1;
  worldTowersGroup.add(backdrop);

  // Subtle 10m elevation grid lines on the backdrop
  const gridPts = [];
  for (let y = 10; y <= 80; y += 10) {
    gridPts.push(new THREE.Vector3(-72, y, -19.8), new THREE.Vector3(72, y, -19.8));
  }
  for (let x = -60; x <= 60; x += 20) {
    gridPts.push(new THREE.Vector3(x, 0, -19.8), new THREE.Vector3(x, 86, -19.8));
  }
  const gridLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(gridPts),
    new THREE.LineBasicMaterial({ color: 0x8ab4f8, transparent: true, opacity: 0.22, fog: false }),
  );
  gridLines.renderOrder = 0;
  worldTowersGroup.add(gridLines);

  // ----------------------------------------------------------------------------
  // (a) Leaning Tower of Pisa — 1:1 Solid Opaque 3D Model (1173 AD, 58.36m, 3.99° tilt)
  // ----------------------------------------------------------------------------
  // Contrasting dark inner gallery wall + bright ivory-gold colonnade & cornices
  const pisaCoreMat = new THREE.MeshStandardMaterial({
    color: 0x4a3828,
    emissive: 0x24190e,
    emissiveIntensity: 0.35,
    roughness: 0.65,
    metalness: 0.1,
    fog: false,
  });
  const pisaBodyMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0,
    emissive: 0xc88a28,
    emissiveIntensity: 0.42,
    roughness: 0.3,
    metalness: 0.1,
    fog: false,
  });
  const pisaAccentMat = new THREE.MeshBasicMaterial({
    color: 0xffe294,
    fog: false,
  });
  const pisaEdgeMat = new THREE.LineBasicMaterial({
    color: 0x6b4c24,
    transparent: true,
    opacity: 0.7,
    fog: false,
  });

  const pisa = new THREE.Group();
  pisa.position.set(-40, 0, 2);
  pisa.rotation.z = -THREE.MathUtils.degToRad(3.99);

  const pisaCoreGeos = [];
  const pisaColonnadeGeos = [];
  const pisaRingGeos = [];
  const addGeo = (arr, geo, y, x = 0, z = 0) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.translate(x, y, z);
    arr.push(g);
  };

  // Dark recessed masonry cylinder behind the open colonnade galleries so columns stand out sharply
  addGeo(pisaCoreGeos, new THREE.CylinderGeometry(5.55, 6.05, 50.5, 32), 25.25);
  // Belfry inner core
  addGeo(pisaCoreGeos, new THREE.CylinderGeometry(3.8, 4.1, 7.6, 24), 50.5 + 3.8);

  // 7 tiers below belfry: ground blind arcade + 6 open colonnade galleries
  const tierY = [0, 10.5, 16.3, 22.1, 27.9, 33.7, 39.5, 45.3, 50.5];
  for (let t = 0; t < tierY.length - 1; t++) {
    const y0 = tierY[t];
    const y1 = tierY[t + 1];
    const h = y1 - y0;
    const rOuter = t === 0 ? 7.74 : 7.5 - t * 0.05;

    // Thick projecting cornice slab at base of each tier
    addGeo(pisaColonnadeGeos, new THREE.CylinderGeometry(rOuter + 0.32, rOuter + 0.32, 0.62, 36), y0 + 0.31);
    addGeo(pisaRingGeos, new THREE.CylinderGeometry(rOuter + 0.42, rOuter + 0.42, 0.26, 36), y0 + 0.31);

    // 3D Colonnade pillars & capitals around each tier
    const nCols = t === 0 ? 15 : 20;
    const colR = t === 0 ? 0.42 : 0.3;
    const colH = h - 1.05;
    for (let c = 0; c < nCols; c++) {
      const ang = (c / nCols) * Math.PI * 2;
      const cx = Math.cos(ang) * (rOuter - 0.15);
      const cz = Math.sin(ang) * (rOuter - 0.15);
      addGeo(pisaColonnadeGeos, new THREE.CylinderGeometry(colR, colR * 1.1, colH, 10), y0 + 0.55 + colH / 2, cx, cz);
      // Capital block
      addGeo(pisaRingGeos, new THREE.BoxGeometry(colR * 2.5, 0.28, colR * 2.5), y1 - 0.65, cx, cz);
    }
    // Arcade spandrel ring at top of columns
    addGeo(pisaColonnadeGeos, new THREE.CylinderGeometry(rOuter + 0.08, rOuter + 0.08, 0.62, 36), y1 - 0.32);
  }

  // Top gallery deck cornice at 50.5m
  addGeo(pisaColonnadeGeos, new THREE.CylinderGeometry(7.45, 7.45, 0.78, 36), 50.5);
  addGeo(pisaRingGeos, new THREE.CylinderGeometry(7.62, 7.62, 0.32, 36), 50.5);

  // 8th story: Belfry chamber (50.5m → 58.36m)
  for (let c = 0; c < 12; c++) {
    const ang = (c / 12) * Math.PI * 2;
    addGeo(pisaColonnadeGeos, new THREE.CylinderGeometry(0.28, 0.28, 6.6, 10), 50.5 + 3.5, Math.cos(ang) * 5.05, Math.sin(ang) * 5.05);
  }
  addGeo(pisaColonnadeGeos, new THREE.CylinderGeometry(5.35, 5.35, 0.7, 32), 57.65);
  addGeo(pisaRingGeos, new THREE.CylinderGeometry(5.55, 5.55, 0.42, 32), 58.15);

  const mergedPisaCore = mergeGeometries(pisaCoreGeos);
  const mergedPisaCol = mergeGeometries(pisaColonnadeGeos);
  const mergedPisaRings = mergeGeometries(pisaRingGeos);

  const pisaCoreMesh = new THREE.Mesh(mergedPisaCore, pisaCoreMat);
  const pisaColMesh = new THREE.Mesh(mergedPisaCol, pisaBodyMat);
  const pisaRingMesh = new THREE.Mesh(mergedPisaRings, pisaAccentMat);
  const pisaEdges = new THREE.LineSegments(new THREE.EdgesGeometry(mergedPisaCol, 28), pisaEdgeMat);
  pisa.add(pisaCoreMesh, pisaColMesh, pisaRingMesh, pisaEdges);

  // Plumb line vs tilted axis for Pisa
  const pisaAxis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-40, 0, 2), new THREE.Vector3(-40, 60, 2)]),
    new THREE.LineDashedMaterial({ color: 0xffe294, dashSize: 1.2, gapSize: 0.8, fog: false }),
  );
  pisaAxis.computeLineDistances();

  const pisaBaseRing = new THREE.Mesh(
    new THREE.RingGeometry(8.0, 9.2, 48).rotateX(-Math.PI / 2),
    pisaAccentMat,
  );
  pisaBaseRing.position.set(-40, 0.12, 2);
  worldTowersGroup.add(pisa, pisaAxis, pisaBaseRing);

  // ----------------------------------------------------------------------------
  // (b) Eiffel Tower — 1:1 Solid Opaque 3D Curved Lattice Model (1889 AD)
  // Shows 0–135m curved tower silhouette so the iconic Eiffel profile is unmistakable,
  // with the 1st Observation Deck at 57.63m highlighted at true 1:1 scale!
  // ----------------------------------------------------------------------------
  const eiffelMat = new THREE.MeshStandardMaterial({
    color: 0x6ce2ff,
    emissive: 0x1678a8,
    emissiveIntensity: 0.55,
    roughness: 0.25,
    metalness: 0.45,
    fog: false,
  });
  const eiffelDeckMat = new THREE.MeshBasicMaterial({
    color: 0xd8f9ff,
    fog: false,
  });
  const eiffelEdgeMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    fog: false,
  });

  const eiffel = new THREE.Group();
  eiffel.position.set(44, 0, 2);
  const eiffelGeos = [];
  const eiffelAccentGeos = [];

  const addBeam = (a, b, w, h, isAccent = false) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-3) return;
    const g = new THREE.BoxGeometry(w, len, h).toNonIndexed();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    (isAccent ? eiffelAccentGeos : eiffelGeos).push(g);
  };

  // True Eiffel exponential inward curve: outer half-width & leg thickness vs height y
  const deck1Y = 57.63;
  const deck2Y = 115.7;
  const eiffelOuterSpread = (y) => {
    const u = Math.min(1, y / 140);
    return 3.2 + 12.2 * Math.pow(1 - u, 1.65);
  };
  const eiffelLegWidth = (y) => {
    const u = Math.min(1, y / 140);
    return 1.3 + 2.5 * Math.pow(1 - u, 1.3);
  };

  // Build 4 curved lattice legs from y = 0 to y = 132m in 16 vertical tiers
  const yLevels = [0, 7, 14, 21, 28.5, 36, 43, 50, 57.63, 66, 75, 84, 94, 104, 115.7, 126];
  for (let i = 0; i < yLevels.length - 1; i++) {
    const y0 = yLevels[i];
    const y1 = yLevels[i + 1];
    const s0Out = eiffelOuterSpread(y0);
    const s1Out = eiffelOuterSpread(y1);
    const s0In = Math.max(0.6, s0Out - eiffelLegWidth(y0));
    const s1In = Math.max(0.6, s1Out - eiffelLegWidth(y1));

    const chordThick = y0 < deck1Y ? 0.78 : 0.62;
    const braceThick = y0 < deck1Y ? 0.42 : 0.34;

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const aOut = new THREE.Vector3(sx * s0Out, y0, sz * s0Out);
        const bOut = new THREE.Vector3(sx * s1Out, y1, sz * s1Out);
        const aIn = new THREE.Vector3(sx * s0In, y0, sz * s0In);
        const bIn = new THREE.Vector3(sx * s1In, y1, sz * s1In);

        // Main outer & inner leg chords
        addBeam(aOut, bOut, chordThick, chordThick, true);
        addBeam(aIn, bIn, chordThick * 0.85, chordThick * 0.85);

        // Horizontal & X-bracing within each leg
        addBeam(aOut, aIn, braceThick, braceThick);
        addBeam(aOut, bIn, braceThick * 0.85, braceThick * 0.85);
        addBeam(aIn, bOut, braceThick * 0.85, braceThick * 0.85);
      }
    }

    // Above 84m, legs merge into a unified central lattice shaft with cross-bracing between faces
    if (y0 >= 84) {
      for (const s of [-1, 1]) {
        addBeam(new THREE.Vector3(-s0Out, y0, s * s0Out), new THREE.Vector3(s1Out, y1, s * s1Out), 0.32, 0.32);
        addBeam(new THREE.Vector3(s0Out, y0, s * s0Out), new THREE.Vector3(-s1Out, y1, s * s1Out), 0.32, 0.32);
        addBeam(new THREE.Vector3(s * s0Out, y0, -s0Out), new THREE.Vector3(s * s1Out, y1, s1Out), 0.32, 0.32);
        addBeam(new THREE.Vector3(s * s0Out, y0, s0Out), new THREE.Vector3(s * s1Out, y1, -s1Out), 0.32, 0.32);
      }
    }
  }

  // 4 iconic decorative base arches between the legs (0 → 28m)
  const archSegs = 22;
  const archR = 11.6;
  for (let i = 0; i < archSegs; i++) {
    const a0 = (i / archSegs) * Math.PI;
    const a1 = ((i + 1) / archSegs) * Math.PI;
    for (const s of [-1, 1]) {
      const zPlane = s * 13.6;
      const pA = new THREE.Vector3(Math.cos(a0) * archR, Math.sin(a0) * 27.5, zPlane);
      const pB = new THREE.Vector3(Math.cos(a1) * archR, Math.sin(a1) * 27.5, zPlane);
      const pA2 = new THREE.Vector3(Math.cos(a0) * (archR - 2.0), Math.sin(a0) * 25.0, zPlane);
      const pB2 = new THREE.Vector3(Math.cos(a1) * (archR - 2.0), Math.sin(a1) * 25.0, zPlane);
      addBeam(pA, pB, 0.6, 0.6, true);
      addBeam(pA2, pB2, 0.48, 0.48);
      addBeam(pA, pA2, 0.36, 0.36);

      const qA = new THREE.Vector3(zPlane, Math.sin(a0) * 27.5, Math.cos(a0) * archR);
      const qB = new THREE.Vector3(zPlane, Math.sin(a1) * 27.5, Math.cos(a1) * archR);
      const qA2 = new THREE.Vector3(zPlane, Math.sin(a0) * 25.0, Math.cos(a0) * (archR - 2.0));
      const qB2 = new THREE.Vector3(zPlane, Math.sin(a1) * 25.0, Math.cos(a1) * (archR - 2.0));
      addBeam(qA, qB, 0.6, 0.6, true);
      addBeam(qA2, qB2, 0.48, 0.48);
    }
  }

  // Horizontal truss belt above base arches (y = 28.5m)
  const belt28 = new THREE.BoxGeometry(24.2, 1.5, 24.2).toNonIndexed();
  belt28.translate(0, 28.8, 0);
  eiffelGeos.push(belt28);

  // Prominent 1st Observation Deck at 57.63m (1:1 scale benchmark)
  const deck1Main = new THREE.BoxGeometry(19.2, 2.6, 19.2).toNonIndexed();
  deck1Main.translate(0, deck1Y, 0);
  eiffelAccentGeos.push(deck1Main);
  const deck1Upper = new THREE.BoxGeometry(21.0, 0.85, 21.0).toNonIndexed();
  deck1Upper.translate(0, deck1Y + 1.5, 0);
  eiffelAccentGeos.push(deck1Upper);

  // Mid-level horizontal belt at 84m
  const belt84 = new THREE.BoxGeometry(12.2, 1.3, 12.2).toNonIndexed();
  belt84.translate(0, 84.0, 0);
  eiffelGeos.push(belt84);

  // 2nd Observation Deck at 115.7m
  const deck2Main = new THREE.BoxGeometry(10.6, 2.2, 10.6).toNonIndexed();
  deck2Main.translate(0, deck2Y, 0);
  eiffelAccentGeos.push(deck2Main);

  const mergedEiffelTruss = mergeGeometries(eiffelGeos);
  const mergedEiffelAccent = mergeGeometries(eiffelAccentGeos);
  eiffel.add(new THREE.Mesh(mergedEiffelTruss, eiffelMat));
  eiffel.add(new THREE.Mesh(mergedEiffelAccent, eiffelDeckMat));
  eiffel.add(new THREE.LineSegments(new THREE.EdgesGeometry(mergedEiffelAccent, 25), eiffelEdgeMat));

  const eiffelBaseRing = new THREE.Mesh(
    new THREE.RingGeometry(16.2, 17.6, 48).rotateX(-Math.PI / 2),
    eiffelDeckMat,
  );
  eiffelBaseRing.position.set(44, 0.12, 2);
  worldTowersGroup.add(eiffel, eiffelBaseRing);

  // ----------------------------------------------------------------------------
  // (c) Thick 3D Elevation Benchmark Bars (67.31m vs 58.36m vs 57.63m)
  // ----------------------------------------------------------------------------
  const barMats = {
    gold: new THREE.MeshBasicMaterial({ color: 0xffcf70, fog: false }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x7be3ff, fog: false }),
  };

  const worldRulerBars = new BoxBatch();
  // 67.31m Pagoda Top Bar spanning across all three towers
  worldRulerBars.beam('gold', new THREE.Vector3(-48, 67.31, 0), new THREE.Vector3(54, 67.31, 0), 0.34, 0.34);
  // 58.36m Leaning Tower of Pisa Top Bar
  worldRulerBars.beam('gold', new THREE.Vector3(-48, 58.36, 2), new THREE.Vector3(0, 58.36, 0), 0.3, 0.3);
  // 57.63m Eiffel Tower 1st Deck Bar
  worldRulerBars.beam('cyan', new THREE.Vector3(0, 57.63, 0), new THREE.Vector3(54, 57.63, 2), 0.3, 0.3);
  worldTowersGroup.add(worldRulerBars.build(barMats));

  // Pagoda's own Vertical Elevation Ruler & Base Diameter Ring (shown in both st-1 and st-2)
  const pagodaRulerBars = new BoxBatch();
  pagodaRulerBars.beam('gold', new THREE.Vector3(-22, 0, 0), new THREE.Vector3(-22, 67.31, 0), 0.26, 0.26);
  pagodaRulerBars.beam('gold', new THREE.Vector3(-24.5, 67.31, 0), new THREE.Vector3(0, 67.31, 0), 0.24, 0.24);
  pagodaRulerBars.beam('gold', new THREE.Vector3(-24.5, 53.8, 0), new THREE.Vector3(0, 53.8, 0), 0.2, 0.2);
  pagodaRulerBars.beam('gold', new THREE.Vector3(-24.5, 3.76, 0), new THREE.Vector3(-16, 3.76, 0), 0.2, 0.2);
  scaleGroup.add(pagodaRulerBars.build(barMats));

  // Base 30.27m Peristyle Diameter Ring
  const baseDiamRing = new THREE.Mesh(
    new THREE.RingGeometry(15.05, 15.65, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffcf70, side: THREE.DoubleSide, transparent: true, opacity: 0.75, fog: false }),
  );
  baseDiamRing.position.y = 3.82;
  scaleGroup.add(baseDiamRing);

  // ============================================================================
  // 2. Structural Features Overlay: Double-Ring Columns + 4 Dark-Layer Truss Rings
  // ============================================================================
  const structGroup = new THREE.Group();
  structGroup.visible = false;
  towerOverlays.add(structGroup);

  const trussGroup = new THREE.Group();
  const trussPts = [];
  const innerRingPts = [];
  info.levels.forEach((L, idx) => {
    const aIn = apothemFromSide(L.innerSide);
    const rIn = aIn / C8;
    const y0 = idx === 0 ? 0 : L.floorY;
    const y1 = L.colTop;
    for (let k = 0; k < 8; k++) {
      const c0 = cornerDir(k).multiplyScalar(rIn);
      const c1 = cornerDir((k + 1) % 8).multiplyScalar(rIn);
      innerRingPts.push(
        new THREE.Vector3(c0.x, y0 + 0.1, c0.z), new THREE.Vector3(c1.x, y0 + 0.1, c1.z),
        new THREE.Vector3(c0.x, y1 - 0.1, c0.z), new THREE.Vector3(c1.x, y1 - 0.1, c1.z),
        new THREE.Vector3(c0.x, y0, c0.z), new THREE.Vector3(c0.x, y1, c0.z),
      );
    }
    if (idx === 0) return;
    const dy0 = L.darkBase;
    const dy1 = L.balconyBase;
    const ao = L.apothem - 0.35;
    for (let k = 0; k < 8; k++) {
      const f = FACES[k];
      const half = ao * T8;
      const pA = f.n.clone().multiplyScalar(ao).addScaledVector(f.t, -half);
      const pB = f.n.clone().multiplyScalar(ao).addScaledVector(f.t, half);
      trussPts.push(
        new THREE.Vector3(pA.x, dy0, pA.z), new THREE.Vector3(pB.x, dy1, pB.z),
        new THREE.Vector3(pB.x, dy0, pB.z), new THREE.Vector3(pA.x, dy1, pA.z),
        new THREE.Vector3(pA.x, dy0, pA.z), new THREE.Vector3(pB.x, dy0, pB.z),
        new THREE.Vector3(pA.x, dy1, pA.z), new THREE.Vector3(pB.x, dy1, pB.z),
      );
    }
  });
  const trussLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(trussPts),
    new THREE.LineBasicMaterial({ color: 0xffb84d, transparent: true, opacity: 0.92, depthTest: false }),
  );
  trussLines.renderOrder = 8;
  const innerLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(innerRingPts),
    new THREE.LineBasicMaterial({ color: 0x5ce1e6, transparent: true, opacity: 0.82, depthTest: false }),
  );
  innerLines.renderOrder = 8;
  trussGroup.add(trussLines, innerLines);
  structGroup.add(trussGroup);

  // ============================================================================
  // 3. Tilt Diagnostic Overlay: SW→NE Compass + Column #23 & NW Settlement
  // ============================================================================
  const tiltGroup = new THREE.Group();
  tiltGroup.visible = false;
  towerOverlays.add(tiltGroup);

  const L2 = info.levels[1];
  const compassY = L2.floorY + 0.08;
  const compassR = L2.apothem + 3.2;
  const compassRing = new THREE.Mesh(
    new THREE.RingGeometry(compassR - 0.22, compassR, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xe8c374, side: THREE.DoubleSide, transparent: true, opacity: 0.72, depthTest: false }),
  );
  compassRing.position.y = compassY;
  compassRing.renderOrder = 9;
  tiltGroup.add(compassRing);

  const swDir = new THREE.Vector3(-Math.SQRT1_2, 0, Math.SQRT1_2);
  const neDir = new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2);
  const arrowCurvePts = [
    swDir.clone().multiplyScalar(compassR + 2.5).setY(compassY),
    neDir.clone().multiplyScalar(compassR + 4.5).setY(compassY),
  ];
  const tiltAxisArrow = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arrowCurvePts),
    new THREE.LineBasicMaterial({ color: 0xff5242, transparent: true, opacity: 0.9, depthTest: false }),
  );
  tiltAxisArrow.renderOrder = 9;
  const coneHead = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.8, 12),
    new THREE.MeshBasicMaterial({ color: 0xff5242, transparent: true, opacity: 0.9, depthTest: false }),
  );
  coneHead.position.copy(neDir.clone().multiplyScalar(compassR + 4.8).setY(compassY));
  coneHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), neDir);
  coneHead.renderOrder = 9;
  tiltGroup.add(tiltAxisArrow, coneHead);

  // Column #23 (2nd floor SW face) vertical reference vs deformed crimson column
  const swFace = FACES[7];
  const col23Base = swFace.n.clone().multiplyScalar(L2.apothem).addScaledVector(swFace.t, -L2.side * 0.19);
  const col23Y0 = L2.floorY;
  const col23Y1 = L2.colTop;
  const col23Ref = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, col23Y1 - col23Y0, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.55, depthTest: false }),
  );
  col23Ref.position.set(col23Base.x, (col23Y0 + col23Y1) / 2, col23Base.z);
  col23Ref.renderOrder = 11;
  const col23Deformed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 1, 16),
    new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.82, depthTest: false }),
  );
  col23Deformed.renderOrder = 12;
  tiltGroup.add(col23Ref, col23Deformed);

  // NW corner column settlement (-20cm) ring
  const settleCorner = cornerDir(5).multiplyScalar(L2.apothem / C8);
  const settleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.08, 10, 32).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffaa2b, transparent: true, opacity: 0.88, depthTest: false }),
  );
  settleRing.renderOrder = 12;
  tiltGroup.add(settleRing);

  function update(time, deformS, deformM) {
    if (scaleGroup.visible) {
      const pulse = 0.36 + 0.12 * Math.sin(time * 2.2);
      pisaBodyMat.emissiveIntensity = pulse;
      eiffelMat.emissiveIntensity = 0.48 + 0.16 * Math.sin(time * 2.2 + 1.0);
    }
    if (structGroup.visible) {
      trussLines.material.opacity = 0.65 + 0.28 * Math.sin(time * 3.0);
    }
    if (tiltGroup.visible) {
      const dBot = setDeform.field(col23Base.x, col23Y0, col23Base.z, deformS, deformM).clone();
      const dTop = setDeform.field(col23Base.x, col23Y1, col23Base.z, deformS, deformM).clone();
      const pBot = new THREE.Vector3(col23Base.x + dBot.x, col23Y0 + dBot.y, col23Base.z + dBot.z);
      const pTop = new THREE.Vector3(col23Base.x + dTop.x, col23Y1 + dTop.y, col23Base.z + dTop.z);
      const dir = pTop.clone().sub(pBot);
      const len = dir.length();
      col23Deformed.position.copy(pBot).add(pTop).multiplyScalar(0.5);
      col23Deformed.scale.set(1, len, 1);
      col23Deformed.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());

      const dSettle = setDeform.field(settleCorner.x, col23Y1, settleCorner.z, deformS, deformM);
      settleRing.position.set(settleCorner.x + dSettle.x, col23Y1 + dSettle.y, settleCorner.z + dSettle.z);
      const s = 1 + 0.12 * Math.sin(time * 3.5);
      settleRing.scale.set(s, s, 1);
    }
  }

  function setMode({ scale = false, towers = false, struct = false, tilt = false } = {}) {
    scaleGroup.visible = scale || towers;
    worldTowersGroup.visible = towers;
    structGroup.visible = struct;
    tiltGroup.visible = tilt;
  }

  return {
    root,
    scaleGroup,
    structGroup,
    tiltGroup,
    col23Pos: new THREE.Vector3(col23Base.x, info.levels[0].colTop + 1.5 + 3.76, col23Base.z),
    settlePos: new THREE.Vector3(settleCorner.x, col23Y1 + 3.76, settleCorner.z),
    setMode,
    update,
  };
}
