import * as THREE from 'three';

// 渐变天穹：秋季晴空（照片中天顶深蓝、地平线泛白），同时用作环境光照（PMREM）
export function createSkyDome() {
  const uniforms = {
    zenith: { value: new THREE.Color('#1f57c0') },
    horizon: { value: new THREE.Color('#a9c4e4') },
    ground: { value: new THREE.Color('#8d8a82') },
    sunDir: { value: new THREE.Vector3(0, 1, 0) },
    sunColor: { value: new THREE.Color('#fff4e0') },
    intensity: { value: 1.0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith, horizon, ground, sunDir, sunColor;
      uniform float intensity;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55));
        col = mix(col, ground, smoothstep(0.0, -0.08, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += sunColor * (pow(s, 1200.0) * 30.0 + pow(s, 12.0) * 0.35 + pow(s, 3.0) * 0.08);
        gl_FragColor = vec4(col * intensity, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  mesh.scale.setScalar(4000);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
