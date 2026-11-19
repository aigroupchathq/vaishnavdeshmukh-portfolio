import * as THREE from './three.module.min.js';

function smoothstep(min, max, val) {
  const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function linstep(min, max, val) {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function expDamp(speed, dt) {
  return 1 - Math.exp(-speed * dt);
}

/* Pure JS non-indexed geometry merger so tree forest renders in 2 draw calls */
function mergeGeos(geoms) {
  const nonIdx = geoms.map(g => (g.index ? g.toNonIndexed() : g.clone()));
  let totalVerts = 0;
  for (const g of nonIdx) {
    totalVerts += g.getAttribute('position').count;
  }
  const posArr = new Float32Array(totalVerts * 3);
  let hasNorm = true;
  for (const g of nonIdx) {
    if (!g.getAttribute('normal')) { hasNorm = false; break; }
  }
  const normArr = hasNorm ? new Float32Array(totalVerts * 3) : null;

  let offset = 0;
  for (const g of nonIdx) {
    const pos = g.getAttribute('position');
    posArr.set(pos.array, offset * 3);
    if (normArr) {
      const nrm = g.getAttribute('normal');
      normArr.set(nrm.array, offset * 3);
    }
    offset += pos.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  if (normArr) merged.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
  return merged;
}

/* Endless Closed-Loop Undulating Valley Circuit (~523m C^2 periodic spline) */
const SPLINE_PTS = [
  [0.0, 1.8, -87.0], [20.53, 2.97, -89.94], [39.76, 3.22, -82.57], [52.65, 2.73, -66.02],
  [56.61, 1.89, -45.14], [53.42, 1.06, -25.73], [48.38, 0.44, -11.04], [47.0, 0.0, 0.0],
  [51.42, -0.44, 11.74], [58.89, -1.06, 28.36], [63.43, -1.89, 50.58], [59.47, -2.73, 74.58],
  [45.23, -3.22, 93.93], [23.57, -2.97, 103.25], [0.0, -1.8, 101.0], [-20.51, 0.15, 89.87],
  [-35.93, 2.41, 74.61], [-47.12, 4.29, 59.08], [-55.97, 5.13, 44.63], [-63.3, 4.57, 30.49],
  [-68.19, 2.68, 15.56], [-69.0, 0.0, 0.0], [-65.15, -2.68, -14.87], [-57.83, -4.57, -27.85],
  [-49.14, -5.13, -39.19], [-40.29, -4.29, -50.52], [-30.46, -2.41, -63.24], [-17.48, -0.15, -76.57]
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

const roadCurve = new THREE.CatmullRomCurve3(SPLINE_PTS, true, 'centripetal', 0.5);
roadCurve.arcLengthDivisions = 2400;
const ROAD_LENGTH = roadCurve.getLength();
const UP = new THREE.Vector3(0, 1, 0);

function wrapUnit(t) {
  const u = t % 1;
  return u < 0 ? u + 1 : u;
}

function loopDist(a, b) {
  const d = wrapUnit(a - b);
  return d > 0.5 ? 1 - d : d;
}

function sampleRoad(t, out = {}) {
  const u = wrapUnit(t);
  out.pos = roadCurve.getPointAt(u, out.pos || new THREE.Vector3());
  out.tan = roadCurve.getTangentAt(u, out.tan || new THREE.Vector3());
  out.flat = (out.flat || new THREE.Vector3()).set(out.tan.x, 0, out.tan.z).normalize();
  out.right = (out.right || new THREE.Vector3()).crossVectors(out.flat, UP).normalize();
  return out;
}

/* Build-time 2D spatial hash compiled into an O(1) bilinear Corridor LUT */
const CORRIDOR_CELL = 8;
const corridorBins = new Map();
const ROAD_HALF_WIDTH = 3.1;
const LUT_MIN = -160;
const LUT_MAX = 160;
const LUT_SPAN = LUT_MAX - LUT_MIN;
const LUT_N = 224;
const LUT_STEP = LUT_SPAN / (LUT_N - 1);
const lutDist = new Float32Array(LUT_N * LUT_N);
const lutRoadY = new Float32Array(LUT_N * LUT_N);
let lutBuilt = false;

function addCorridorSample(x, y, z, half) {
  const kx = Math.floor(x / CORRIDOR_CELL);
  const kz = Math.floor(z / CORRIDOR_CELL);
  const key = (kx + 512) * 2048 + (kz + 512);
  let bucket = corridorBins.get(key);
  if (!bucket) {
    bucket = [];
    corridorBins.set(key, bucket);
  }
  bucket.push({ x, y, z, half });
  lutBuilt = false;
}

{
  const s = {};
  for (let i = 0; i < 1600; i++) {
    sampleRoad(i / 1600, s);
    addCorridorSample(s.pos.x, s.pos.y, s.pos.z, ROAD_HALF_WIDTH);
  }
}

function addCorridorSpan(a, b, half, yOverride) {
  const steps = Math.max(1, Math.ceil(a.distanceTo(b) / 0.8));
  for (let i = 0; i <= steps; i++) {
    const p = a.clone().lerp(b, i / steps);
    addCorridorSample(p.x, yOverride ?? p.y, p.z, half);
  }
}

function exactCorridorPoint(x, z, range = 30) {
  let minD = range;
  let y = 0;
  const rCells = Math.ceil(range / CORRIDOR_CELL);
  const cx = Math.floor(x / CORRIDOR_CELL);
  const cz = Math.floor(z / CORRIDOR_CELL);
  for (let ix = cx - rCells; ix <= cx + rCells; ix++) {
    for (let iz = cz - rCells; iz <= cz + rCells; iz++) {
      const bucket = corridorBins.get((ix + 512) * 2048 + (iz + 512));
      if (!bucket) continue;
      for (let k = 0; k < bucket.length; k++) {
        const c = bucket[k];
        const d = Math.hypot(c.x - x, c.z - z) - c.half;
        if (d < minD) {
          minD = d;
          y = c.y;
        }
      }
    }
  }
  return { d: minD, y };
}

function bakeCorridorLUT() {
  for (let iz = 0; iz < LUT_N; iz++) {
    const z = LUT_MIN + iz * LUT_STEP;
    const rowOff = iz * LUT_N;
    for (let ix = 0; ix < LUT_N; ix++) {
      const x = LUT_MIN + ix * LUT_STEP;
      const res = exactCorridorPoint(x, z, 30);
      lutDist[rowOff + ix] = res.d;
      lutRoadY[rowOff + ix] = res.y;
    }
  }
  lutBuilt = true;
}

const lutRes = { d: 30, y: 0 };
function queryCorridor(x, z) {
  if (!lutBuilt) bakeCorridorLUT();
  const gx = THREE.MathUtils.clamp((x - LUT_MIN) / LUT_STEP, 0, LUT_N - 1.001);
  const gz = THREE.MathUtils.clamp((z - LUT_MIN) / LUT_STEP, 0, LUT_N - 1.001);
  const x0 = gx | 0;
  const z0 = gz | 0;
  const fx = gx - x0;
  const fz = gz - z0;
  const i00 = z0 * LUT_N + x0;
  const i10 = i00 + 1;
  const i01 = i00 + LUT_N;
  const i11 = i01 + 1;
  const w00 = (1 - fx) * (1 - fz);
  const w10 = fx * (1 - fz);
  const w01 = (1 - fx) * fz;
  const w11 = fx * fz;
  lutRes.d = lutDist[i00] * w00 + lutDist[i10] * w10 + lutDist[i01] * w01 + lutDist[i11] * w11;
  lutRes.y = lutRoadY[i00] * w00 + lutRoadY[i10] * w10 + lutRoadY[i01] * w01 + lutRoadY[i11] * w11;
  return lutRes;
}

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function terrainHeight(x, z) {
  const corr = queryCorridor(x, z);
  const ridge = (valueNoise(x * 0.045, z * 0.045) - 0.5) * 9
              + (valueNoise(x * 0.12 + 7, z * 0.12) - 0.5) * 3;
  const radialOut = Math.max(0, Math.hypot(x * 0.9, z * 0.85) - 96) * 0.18;
  const raw = corr.y + ridge + Math.max(0, corr.d - 8) * 0.12 + radialOut;
  const blend = smoothstep(1.2, 15, corr.d);
  return THREE.MathUtils.lerp(corr.y - 0.3, raw, blend);
}

function createPrng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CHALK = new THREE.Color('#FFFFFF');
const SILVER = new THREE.Color('#A1A1AA');
const BG_COLOR = new THREE.Color('#040405');

const worldUniforms = {
  uCarPos: { value: new THREE.Vector3() },
  uCarDir: { value: new THREE.Vector3(0, 0, 1) },
  uBeam: { value: 0 },
  uFogNear: { value: 50 },
  uFogFar: { value: 120 },
  uTime: { value: 0 },
  uProgress: { value: 0 }
};

const SHADER_COMMON = `
  uniform vec3 uCarPos;
  uniform vec3 uCarDir;
  uniform float uBeam;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vW;
  varying float vDepth;
  float beamFactor(vec3 w) {
    vec2 d = w.xz - uCarPos.xz;
    float dist = length(d);
    float ang = dot(d / max(dist, 1e-3), normalize(uCarDir.xz));
    return uBeam * smoothstep(0.80, 0.97, ang) * smoothstep(28.0, 3.0, dist) * smoothstep(0.8, 2.4, dist)
         + uBeam * 0.36 * smoothstep(5.5, 0.0, dist);
  }
  float lineAA(float v, float w) {
    float fw = fwidth(v);
    if (fw < 1e-4) return 0.0;
    float f = abs(fract(v - 0.5) - 0.5) / fw;
    return 1.0 - clamp(f / w, 0.0, 1.0);
  }
  vec3 fogMix(vec3 c) {
    return mix(c, vec3(0.0157), smoothstep(uFogNear, uFogFar, vDepth));
  }
`;

const WORLD_VERT = `
  varying vec3 vW;
  varying float vDepth;
  #ifdef USE_U
  attribute float u;
  varying float vU;
  #endif
  #ifdef USE_LAT
  attribute float lat;
  varying float vLat;
  #endif
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    #ifdef USE_U
    vU = u;
    #endif
    #ifdef USE_LAT
    vLat = lat;
    #endif
    vec4 mv = viewMatrix * w;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

function makeAsphaltMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: worldUniforms,
    defines: { USE_LAT: 1 },
    vertexShader: WORLD_VERT,
    fragmentShader: SHADER_COMMON + `
      varying float vLat;
      void main() {
        float detailFade = 1.0 - smoothstep(14.0, 48.0, vDepth);
        float tireSheen = exp(-abs(abs(vLat) - 0.34) * 7.0) * 0.024;
        float subtleGrain = (sin(vW.x * 9.0 + vW.z * 7.0) * sin(vW.x * 5.0 - vW.z * 11.0)) * 0.004 * detailFade;
        vec3 base = vec3(0.044) + vec3(tireSheen + subtleGrain);
        float railMain = 1.0 - smoothstep(0.0, max(fwidth(vLat) * 1.4, 0.012), abs(abs(vLat) - 0.925));
        float railOuter = 1.0 - smoothstep(0.0, max(fwidth(vLat) * 1.3, 0.010), abs(abs(vLat) - 0.985));
        float shoulderGlow = max(railMain * 0.86, railOuter * 0.34) * (1.0 - smoothstep(26.0, 74.0, vDepth));
        float b = beamFactor(vW);
        vec3 lit = mix(base + vec3(0.125) * b, vec3(0.95), clamp(shoulderGlow * (0.72 + 0.28 * clamp(b, 0.0, 1.0)), 0.0, 0.95));
        gl_FragColor = vec4(fogMix(lit), 1.0);
      }
    `
  });
}

function makePadMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: worldUniforms,
    vertexShader: WORLD_VERT,
    fragmentShader: SHADER_COMMON + `
      void main() {
        float detailFade = 1.0 - smoothstep(14.0, 48.0, vDepth);
        float subtleGrain = (sin(vW.x * 8.0 + vW.z * 6.0) * sin(vW.x * 5.0 - vW.z * 9.0)) * 0.004 * detailFade;
        vec3 base = vec3(0.044) + vec3(subtleGrain);
        vec3 lit = base + vec3(0.115) * beamFactor(vW);
        gl_FragColor = vec4(fogMix(lit), 1.0);
      }
    `
  });
}

function makeCenterDashMaterial() {
  const dashLoopLen = Math.max(6, Math.round(ROAD_LENGTH / 6.0) * 6.0);
  return new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms, uLen: { value: dashLoopLen } },
    transparent: true,
    depthWrite: false,
    defines: { USE_U: 1 },
    vertexShader: WORLD_VERT,
    fragmentShader: SHADER_COMMON + `
      uniform float uLen;
      varying float vU;
      void main() {
        float s = vU * uLen;
        float dash = step(fract(s / 6.0), 0.52);
        if (dash < 0.5) discard;
        float b = beamFactor(vW);
        vec3 col = mix(vec3(0.74), vec3(0.98), clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(fogMix(col), 0.42 + 0.54 * clamp(b, 0.0, 1.0));
      }
    `
  });
}

function makeTerrainMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: worldUniforms,
    vertexShader: WORLD_VERT,
    fragmentShader: SHADER_COMMON + `
      void main() {
        float gx = lineAA(vW.x * 0.25, 1.25);
        float gz = lineAA(vW.z * 0.25, 1.25);
        float cy = lineAA(vW.y * 0.5, 1.15);
        float distFade = 1.0 - smoothstep(28.0, 106.0, vDepth);
        float grid = max(max(gx, gz) * 0.19, cy * 0.13) * distFade;
        vec3 base = vec3(0.025) + vec3(0.92) * grid;
        vec3 lit = base + vec3(0.105) * beamFactor(vW);
        gl_FragColor = vec4(fogMix(lit), 1.0);
      }
    `
  });
}

function createInkGroup(geo, colorHex = '#151518', { angle = 24, mat = null, edgeHex = '#FFFFFF', edgeOpacity = 0.65 } = {}) {
  const g = new THREE.Group();
  const fill = mat || new THREE.MeshLambertMaterial({ color: colorHex, flatShading: true });
  g.add(new THREE.Mesh(geo, fill));
  g.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, angle),
    new THREE.LineBasicMaterial({ color: edgeHex, transparent: true, opacity: edgeOpacity })
  ));
  return g;
}

function createSignSprite(text, { font = '700 64px Comfortaa, Poppins, sans-serif', color = '#FFFFFF', width = 4.2, flatGround = false, anisotropy = 1, registry = null } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const lines = text.split('\n');
  const pxMatch = font.match(/(\d+)px/);
  const fontSize = pxMatch ? parseInt(pxMatch[1], 10) : 64;
  const padX = 36;
  const lineH = fontSize * 1.24;
  const sup = 2;

  const paint = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = font;
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width), 60);
    const logW = Math.ceil(maxW + padX * 2);
    const logH = Math.ceil(lines.length * lineH + 24);
    canvas.width = logW * sup;
    canvas.height = logH * sup;
    ctx.setTransform(sup, 0, 0, sup, 0, 0);
    ctx.clearRect(0, 0, logW, logH);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, idx) => {
      ctx.fillText(line, logW / 2, (idx + 0.5) * lineH + 12);
    });
  };

  paint();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, anisotropy);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * (canvas.height / canvas.width)),
    mat
  );
  if (flatGround) mesh.rotation.x = -Math.PI / 2;

  if (registry) {
    registry.push(() => {
      const oldW = canvas.width;
      const oldH = canvas.height;
      paint();
      tex.needsUpdate = true;
      if (canvas.width !== oldW || canvas.height !== oldH) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(width, width * (canvas.height / canvas.width));
      }
    });
  }
  return mesh;
}

function makeInstancedEdgeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFogNear: worldUniforms.uFogNear,
      uFogFar: worldUniforms.uFogFar
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec4 iRow0;
      attribute vec4 iRow1;
      attribute vec4 iRow2;
      varying float vDepth;
      void main() {
        vec4 p = vec4(position, 1.0);
        vec3 wp = vec3(dot(iRow0, p), dot(iRow1, p), dot(iRow2, p));
        vec4 mv = modelViewMatrix * vec4(wp, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uFogNear;
      uniform float uFogFar;
      varying float vDepth;
      void main() {
        vec3 col = mix(vec3(0.72, 0.72, 0.76), vec3(0.0157), smoothstep(uFogNear, uFogFar, vDepth));
        gl_FragColor = vec4(col, 0.54);
      }
    `
  });
}

function buildRoadAndScenery(scene, stops, maxAniso = 1) {
  const s = {};
  const roadVerts = [];
  const roadLats = [];
  const roadIdx = [];
  const dashVerts = [];
  const dashUs = [];
  const edgeL = [];
  const edgeR = [];
  const fontCallbacks = [];

  const SEGS = 1000;
  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    sampleRoad(t, s);
    const y = s.pos.y + 0.02;
    const pL = s.pos.clone().addScaledVector(s.right, -ROAD_HALF_WIDTH);
    const pR = s.pos.clone().addScaledVector(s.right, ROAD_HALF_WIDTH);
    roadVerts.push(pL.x, y, pL.z, pR.x, y, pR.z);
    roadLats.push(-1, 1);

    const dL = s.pos.clone().addScaledVector(s.right, -0.09);
    const dR = s.pos.clone().addScaledVector(s.right, 0.09);
    dashVerts.push(dL.x, y + 0.02, dL.z, dR.x, y + 0.02, dR.z);
    dashUs.push(t, t);

    if (i < SEGS) {
      const idx = i * 2;
      roadIdx.push(idx, idx + 2, idx + 1, idx + 1, idx + 2, idx + 3);
    }

    if (i === SEGS) {
      edgeL.push(edgeL[0].clone());
      edgeR.push(edgeR[0].clone());
    } else {
      const shoulderOff = 0.04;
      edgeL.push(pL.clone().addScaledVector(s.right, shoulderOff).setY(y + 0.032));
      edgeR.push(pR.clone().addScaledVector(s.right, -shoulderOff).setY(y + 0.032));
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('lat', new THREE.Float32BufferAttribute(roadLats, 1));
  roadGeo.setIndex(roadIdx);
  scene.add(new THREE.Mesh(roadGeo, makeAsphaltMaterial()));

  const dashGeo = new THREE.BufferGeometry();
  dashGeo.setAttribute('position', new THREE.Float32BufferAttribute(dashVerts, 3));
  dashGeo.setAttribute('u', new THREE.Float32BufferAttribute(dashUs, 1));
  dashGeo.setIndex(roadIdx);
  const dashMesh = new THREE.Mesh(dashGeo, makeCenterDashMaterial());
  dashMesh.renderOrder = 2;
  scene.add(dashMesh);

  const lineMat = new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0.85 });
  for (const pts of [edgeL, edgeR]) {
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }

  const mobile = innerWidth < 760;
  const mainStops = stops.filter(st => !st.isTail);

  /* Portfolio Landmarks Around Closed 360deg Loop */
  const propsGroup = new THREE.Group();
  scene.add(propsGroup);
  const anchors = {};
  let dialPivot = null;
  let dialA0 = 0;
  let dialSweep = 0;

  const sideOffset = (t, sideSign, latDist, aheadDist = 0) => {
    const r = sampleRoad(t, {});
    const pos = r.pos.clone().addScaledVector(r.right, sideSign * latDist).addScaledVector(r.flat, aheadDist);
    const yaw = Math.atan2(r.flat.x, r.flat.z);
    return { p: pos, yaw, right: r.right.clone().multiplyScalar(sideSign), flat: r.flat.clone(), y: r.pos.y };
  };

  const makePad = (pt, w, len) => {
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(w, len), makePadMaterial());
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(pt.p).setY(pt.y + 0.045);
    pad.rotation.z = pt.yaw;
    propsGroup.add(pad);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, len), 1),
      new THREE.LineBasicMaterial({ color: SILVER, transparent: true, opacity: 0.55 })
    );
    outline.rotation.copy(pad.rotation);
    outline.position.copy(pad.position).setY(pt.y + 0.055);
    propsGroup.add(outline);
    const fwd = new THREE.Vector3(Math.sin(pt.yaw), 0, Math.cos(pt.yaw));
    const lat = new THREE.Vector3(Math.cos(pt.yaw), 0, -Math.sin(pt.yaw));
    const half = Math.max(w, len) * 0.45;
    for (const off of [-w * 0.32, 0, w * 0.32]) {
      const mid = pt.p.clone().addScaledVector(lat, off);
      addCorridorSpan(mid.clone().addScaledVector(fwd, -len * 0.45), mid.clone().addScaledVector(fwd, len * 0.45), half * 0.65 + 1.2, pt.y);
    }
  };

  /* Stop 0: Open Drive-Through Start/Finish Architectural Portal (t = 0.0 == 1.0) */
  {
    sampleRoad(0, s);
    const g = new THREE.Group();
    const anchor = s.pos.clone();
    g.position.copy(anchor);
    g.rotation.y = Math.atan2(s.flat.x, s.flat.z) + Math.PI;

    const wallGeo = new THREE.BoxGeometry(0.26, 3.2, 7.2);
    for (const sx of [-4.2, 4.2]) {
      const m = createInkGroup(wallGeo, '#101012');
      m.position.set(sx, 1.6, 0);
      g.add(m);
    }

    const archPts = [new THREE.Vector3(-4.3, 3.2, 0), new THREE.Vector3(0, 4.9, 0), new THREE.Vector3(4.3, 3.2, 0)];
    const archMat = new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0.72 });
    for (const zOff of [-3.4, 3.4]) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(archPts), archMat);
      line.position.z = zOff;
      g.add(line);
    }

    const titleSign = createSignSprite('VAISHNAV DESHMUKH', {
      font: '700 66px Comfortaa, Poppins, sans-serif',
      width: 5.4,
      color: '#FFFFFF',
      anisotropy: maxAniso,
      registry: fontCallbacks
    });
    titleSign.position.set(0, 4.9, -3.45);
    g.add(titleSign);

    const floorSign = createSignSprite('LONDON · DESIGN & SYSTEMS', {
      font: '600 46px Comfortaa, Poppins, sans-serif',
      width: 4.5,
      color: 'rgba(255,255,255,0.62)',
      flatGround: true,
      anisotropy: maxAniso,
      registry: fontCallbacks
    });
    floorSign.position.set(0, 0.055, -4.2);
    g.add(floorSign);

    propsGroup.add(g);
    anchors['garage'] = anchor.clone();
    addCorridorSpan(
      anchor.clone().addScaledVector(s.flat, -5),
      anchor.clone().addScaledVector(s.flat, 5),
      4.8,
      s.pos.y
    );
  }

  /* Subtle Highway Markers along initial corner (t = 0.055..0.125) */
  {
    const labels = [['01', 'NOTICE'], ['02', 'SIMPLIFY'], ['03', 'VERIFY']];
    labels.forEach(([num, txt], idx) => {
      const pt = sideOffset(0.055 + idx * 0.032, 1, ROAD_HALF_WIDTH + 1.7);
      const post = createInkGroup(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), '#161618');
      post.position.copy(pt.p).setY(pt.y + 0.9);
      propsGroup.add(post);

      const sign = createSignSprite(`${num} // ${txt}`, {
        font: '500 44px "IBM Plex Mono", monospace',
        width: 3.3,
        color: idx === 2 ? '#FFFFFF' : '#A1A1AA',
        anisotropy: maxAniso,
        registry: fontCallbacks
      });
      sign.position.copy(pt.p).add(new THREE.Vector3(pt.right.x * 0.6, 2.2, pt.right.z * 0.6));
      sign.rotation.y = pt.yaw + Math.PI;
      propsGroup.add(sign);
    });
  }

  /* Monochrome Highway Gantries for Stops 1..2 (outer side opposite card) */
  const domainSpecs = [
    { id: 'systems', label: 'SYSTEMS & CIVIC', accent: true },
    { id: 'perception', label: 'ATTENTION & CRAFT', accent: false }
  ];

  domainSpecs.forEach(spec => {
    const st = mainStops.find(x => x.id === spec.id);
    if (!st) return;
    const dir = -st.screen;
    const pt = sideOffset(st.t, dir, ROAD_HALF_WIDTH + 5.8);
    anchors[spec.id] = pt.p.clone();
    makePad(pt, 7.5, 9.5);

    const frame = new THREE.Group();
    frame.position.copy(pt.p).setY(pt.y);
    frame.rotation.y = pt.yaw + Math.PI;

    const colGeo = new THREE.BoxGeometry(0.32, 3.4, 0.32);
    for (const px of [-2.2, 2.2]) {
      const col = createInkGroup(colGeo, '#141416');
      col.position.set(px, 1.7, 0);
      frame.add(col);
    }
    const headerBar = createInkGroup(new THREE.BoxGeometry(4.8, 0.28, 0.36), spec.accent ? '#E4E4E7' : '#242428');
    headerBar.position.set(0, 3.45, 0);
    frame.add(headerBar);

    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: spec.accent ? CHALK : SILVER, wireframe: true })
    );
    beacon.position.set(0, 2.1, 0);
    frame.add(beacon);

    const pl = new THREE.PointLight(spec.accent ? '#ffffff' : '#d4d4d8', 5.5, 14, 1.6);
    pl.position.set(0, 2.8, 0.5);
    frame.add(pl);

    propsGroup.add(frame);

    const lbl = createSignSprite(spec.label, {
      font: '700 60px Comfortaa, Poppins, sans-serif',
      width: 4.7,
      color: '#FFFFFF',
      anisotropy: maxAniso,
      registry: fontCallbacks
    });
    lbl.position.copy(pt.p).setY(pt.y + 4.3);
    lbl.rotation.y = pt.yaw + Math.PI;
    propsGroup.add(lbl);
  });

  /* Stop 3: Beam & Throttle Sweep Pad (stop-rev, t = 0.60) */
  if (mainStops.find(st => st.id === 'rev')) {
    const st = mainStops.find(x => x.id === 'rev');
    const pt = sideOffset(st.t, -st.screen, ROAD_HALF_WIDTH + 6.4);
    anchors['rev'] = pt.p.clone();
    makePad(pt, 9.2, 9.2);

    const dialGroup = new THREE.Group();
    dialGroup.position.copy(pt.p).setY(pt.y + 0.075);
    dialGroup.rotation.y = pt.yaw + Math.PI;

    const r = 3.4;
    const ringPts = [];
    const peakPts = [];
    const a0 = Math.PI * 1.25;
    const sweep = Math.PI * 1.5;
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const a = a0 - u * sweep;
      const v = new THREE.Vector3(Math.cos(a) * r, 0, -Math.sin(a) * r);
      ringPts.push(v);
      if (u >= 0.78) peakPts.push(new THREE.Vector3(Math.cos(a) * (r + 0.28), 0, -Math.sin(a) * (r + 0.28)));
    }
    dialGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: SILVER })));
    dialGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(peakPts), new THREE.LineBasicMaterial({ color: CHALK })));

    const needleGeo = new THREE.PlaneGeometry(0.16, r - 0.3);
    needleGeo.translate(0, (r - 0.3) / 2, 0);
    const needle = new THREE.Mesh(needleGeo, new THREE.MeshBasicMaterial({ color: CHALK }));
    needle.rotation.x = -Math.PI / 2;

    const pivot = new THREE.Group();
    pivot.add(needle);
    pivot.position.y = 0.03;
    dialGroup.add(pivot);

    const hub = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshBasicMaterial({ color: CHALK }));
    hub.rotation.x = -Math.PI / 2;
    hub.position.y = 0.04;
    dialGroup.add(hub);

    const testText = createSignSprite('BEAM // PACE', {
      font: '600 84px "IBM Plex Mono", monospace',
      width: 2.5,
      flatGround: true,
      color: 'rgba(255,255,255,0.75)',
      anisotropy: maxAniso,
      registry: fontCallbacks
    });
    testText.position.set(0, 0.01, -2.0);
    dialGroup.add(testText);

    propsGroup.add(dialGroup);
    dialPivot = pivot;
    dialA0 = a0;
    dialSweep = sweep;
  }

  /* Stop 4: Open Inquiries & Archive Archway (stop-gate, t = 0.80) */
  {
    const st = mainStops.find(x => x.id === 'gate');
    const gateT = st ? st.t : 0.80;
    sampleRoad(gateT, s);
    const arch = new THREE.Group();
    arch.position.copy(s.pos);
    arch.rotation.y = Math.atan2(s.flat.x, s.flat.z) + Math.PI;

    const pillarGeo = new THREE.BoxGeometry(0.9, 3.6, 0.9);
    for (const px of [-4.2, 4.2]) {
      const p = createInkGroup(pillarGeo, '#141416');
      p.position.set(px, 1.8, 0);
      arch.add(p);
    }
    const crossBar = createInkGroup(new THREE.BoxGeometry(9.4, 0.45, 0.55), '#E4E4E7');
    crossBar.position.set(0, 3.8, 0);
    arch.add(crossBar);

    propsGroup.add(arch);
    anchors['gate'] = arch.position.clone();

    const gateLbl = createSignSprite('ARCHIVE 16 · CONTACT', {
      font: '700 64px Comfortaa, Poppins, sans-serif',
      width: 5.3,
      color: '#FFFFFF',
      anisotropy: maxAniso,
      registry: fontCallbacks
    });
    gateLbl.position.copy(arch.position).add(new THREE.Vector3(0, 5.2, 0));
    gateLbl.rotation.y = arch.rotation.y;
    propsGroup.add(gateLbl);

    addCorridorSpan(
      s.pos.clone().addScaledVector(s.flat, -6),
      s.pos.clone().addScaledVector(s.flat, 6),
      5.0,
      s.pos.y
    );
  }

  /* Bake O(1) Corridor LUT AFTER all road spans & milestone pads are registered */
  bakeCorridorLUT();

  /* Terraced valley mesh across full 360deg loop basin */
  const segX = mobile ? 128 : 144;
  const segZ = mobile ? 128 : 144;
  const tGeo = new THREE.PlaneGeometry(300, 300, segX, segZ);
  tGeo.rotateX(-Math.PI / 2);
  const tPos = tGeo.attributes.position;
  const tRng = createPrng(3);
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i) + (tRng() - 0.5) * 0.9;
    const z = tPos.getZ(i) + (tRng() - 0.5) * 0.9;
    tPos.setXYZ(i, x, terrainHeight(x, z), z);
  }
  tGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(tGeo, makeTerrainMaterial()));

  /* GPU Instanced Forest outside cleared road corridors */
  const rng = createPrng(11);
  const buildUnitTree = parts => {
    const fills = [];
    const edges = [];
    for (const part of parts) {
      fills.push(part);
      edges.push(new THREE.EdgesGeometry(part, 20));
    }
    return {
      fill: mergeGeos(fills),
      edge: mergeGeos(edges)
    };
  };

  const treeArchetypes = [
    buildUnitTree((() => {
      const c1 = new THREE.ConeGeometry(1.4, 3.2, 5); c1.translate(0, 2.6, 0);
      const c2 = new THREE.ConeGeometry(1.0, 2.4, 5); c2.translate(0, 4.1, 0);
      const trunk = new THREE.CylinderGeometry(0.18, 0.22, 1.2, 4); trunk.translate(0, 0.6, 0);
      return [c1, c2, trunk];
    })()),
    buildUnitTree((() => {
      const top = new THREE.DodecahedronGeometry(1.45, 0); top.translate(0, 2.8, 0);
      const trunk = new THREE.CylinderGeometry(0.16, 0.2, 1.8, 4); trunk.translate(0, 0.9, 0);
      return [top, trunk];
    })()),
    buildUnitTree((() => {
      const spire = new THREE.ConeGeometry(1.0, 4.4, 4); spire.translate(0, 2.9, 0);
      const trunk = new THREE.CylinderGeometry(0.12, 0.16, 1.0, 4); trunk.translate(0, 0.5, 0);
      return [spire, trunk];
    })())
  ];

  const avoidPoints = mainStops.map(st => {
    const p = sampleRoad(st.t, {}).pos;
    return { x: p.x, z: p.z, r: 16.5 };
  });

  const targetTrees = mobile ? 320 : 360;
  const buckets = [[], [], []];
  let placed = 0;
  let tries = 0;
  const mat4 = new THREE.Matrix4();
  const posV = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const scaleV = new THREE.Vector3();

  while (placed < targetTrees && tries++ < targetTrees * 14) {
    const x = (rng() - 0.5) * 265;
    const z = (rng() - 0.5) * 265;
    const corr = queryCorridor(x, z);
    if (corr.d < 4.6 || (corr.d < 9 && rng() < 0.75)) continue;
    if (avoidPoints.some(ap => Math.hypot(ap.x - x, ap.z - z) < ap.r)) continue;

    const ty = terrainHeight(x, z);
    const kind = Math.floor(rng() * treeArchetypes.length);
    const sc = 0.72 + rng() * 0.85;
    q.setFromAxisAngle(UP, rng() * Math.PI * 2);
    mat4.compose(posV.set(x, ty - 0.1, z), q, scaleV.set(sc, sc * (0.85 + rng() * 0.4), sc));
    buckets[kind].push(mat4.clone());
    placed++;
  }

  const fillMat = new THREE.MeshLambertMaterial({ color: '#141519', flatShading: true });
  const edgeMat = makeInstancedEdgeMaterial();

  treeArchetypes.forEach((arch, k) => {
    const mats = buckets[k];
    const n = mats.length;
    if (n === 0) return;

    const fillInst = new THREE.InstancedMesh(arch.fill, fillMat, n);
    fillInst.frustumCulled = false;

    const r0 = new Float32Array(n * 4);
    const r1 = new Float32Array(n * 4);
    const r2 = new Float32Array(n * 4);

    for (let i = 0; i < n; i++) {
      const m = mats[i];
      fillInst.setMatrixAt(i, m);
      const e = m.elements;
      const o = i * 4;
      r0[o] = e[0]; r0[o + 1] = e[4]; r0[o + 2] = e[8];  r0[o + 3] = e[12];
      r1[o] = e[1]; r1[o + 1] = e[5]; r1[o + 2] = e[9];  r1[o + 3] = e[13];
      r2[o] = e[2]; r2[o + 1] = e[6]; r2[o + 2] = e[10]; r2[o + 3] = e[14];
    }
    fillInst.instanceMatrix.needsUpdate = true;
    scene.add(fillInst);

    const edgeInstGeo = new THREE.InstancedBufferGeometry();
    edgeInstGeo.setAttribute('position', arch.edge.getAttribute('position'));
    edgeInstGeo.setAttribute('iRow0', new THREE.InstancedBufferAttribute(r0, 4));
    edgeInstGeo.setAttribute('iRow1', new THREE.InstancedBufferAttribute(r1, 4));
    edgeInstGeo.setAttribute('iRow2', new THREE.InstancedBufferAttribute(r2, 4));
    edgeInstGeo.instanceCount = n;

    const edgeInst = new THREE.LineSegments(edgeInstGeo, edgeMat);
    edgeInst.frustumCulled = false;
    scene.add(edgeInst);
  });

  return {
    anchors,
    getDial: () => ({ pivot: dialPivot, a0: dialA0, sweep: dialSweep }),
    rebakeFonts: () => { for (const fn of fontCallbacks) fn(); }
  };
}

/* Monochrome Obsidian & Silver Architectural Coupé */
function extrudeSide(pts, width, bevel = 0.06, bevelSegs = 2) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: bevelSegs, steps: 1 });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

function createSportsCar(maxAniso = 1) {
  const root = new THREE.Group();
  const bodySusp = new THREE.Group();
  root.add(bodySusp);

  const bodyGeo = extrudeSide([
    [-2.16, 0.32], [2.14, 0.32], [2.26, 0.50], [2.14, 0.72],
    [0.64, 0.87], [-1.52, 0.92], [-2.12, 0.87], [-2.22, 0.58]
  ], 1.72, 0.07, 3);
  bodySusp.add(createInkGroup(bodyGeo, '#18181b', {
    angle: 20,
    mat: new THREE.MeshStandardMaterial({ color: '#14151b', roughness: 0.28, metalness: 0.62, flatShading: true }),
    edgeHex: '#FFFFFF',
    edgeOpacity: 0.92
  }));

  /* Lower Front Splitter & Side Aero Skirt Sill */
  const splitter = createInkGroup(new THREE.BoxGeometry(1.76, 0.05, 0.42), '#0b0b0e', {
    angle: 22,
    edgeHex: '#E4E4E7',
    edgeOpacity: 0.78
  });
  splitter.position.set(0, 0.27, 2.08);
  bodySusp.add(splitter);

  const sillGeo = new THREE.BoxGeometry(0.14, 0.07, 2.35);
  for (const s of [-1, 1]) {
    const sill = createInkGroup(sillGeo, '#0e0e12', { angle: 24, edgeHex: '#D4D4D8', edgeOpacity: 0.72 });
    sill.position.set(s * 0.86, 0.27, 0.02);
    bodySusp.add(sill);
  }

  /* Sculpted Fastback Cabin Greenhouse + Roof Ridge */
  const cabinGeo = extrudeSide([[0.64, 0.86], [-0.04, 1.33], [-0.98, 1.36], [-1.64, 0.91]], 1.44, 0.05, 2);
  bodySusp.add(createInkGroup(cabinGeo, '#050507', {
    angle: 20,
    mat: new THREE.MeshStandardMaterial({ color: '#06070a', roughness: 0.14, metalness: 0.85, flatShading: true }),
    edgeHex: '#E4E4E7',
    edgeOpacity: 0.85
  }));

  /* Hood Intake Slit & Rear Fastback Engine Louvres */
  const louverGeo = new THREE.BoxGeometry(0.84, 0.025, 0.09);
  const louverMat = new THREE.MeshBasicMaterial({ color: '#52525b' });
  for (const lz of [-1.22, -1.42, -1.62]) {
    const lv = new THREE.Mesh(louverGeo, louverMat);
    lv.position.set(0, 0.96, lz);
    lv.rotation.x = 0.22;
    bodySusp.add(lv);
  }

  /* Crisp White Shoulder Beltline & Diffuser Strakes */
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.03, 3.96), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
  trim.position.set(0, 0.62, 0.02);
  bodySusp.add(trim);

  const finGeo = new THREE.BoxGeometry(0.04, 0.16, 0.34);
  for (const fx of [-0.36, 0, 0.36]) {
    const fin = new THREE.Mesh(finGeo, new THREE.MeshBasicMaterial({ color: '#D4D4D8' }));
    fin.position.set(fx, 0.31, -2.14);
    bodySusp.add(fin);
  }

  /* Xenon Headlights + Optic Silver Tail Lightbar + Dual Exhausts */
  const headMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#e4e4e7' });
  const exhaustMat = new THREE.MeshBasicMaterial({ color: '#a1a1aa' });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.06), headMat);
    hl.position.set(s * 0.58, 0.55, 2.27);
    bodySusp.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.06), tailMat);
    tl.position.set(s * 0.56, 0.69, -2.27);
    bodySusp.add(tl);

    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 10), exhaustMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(s * 0.64, 0.33, -2.24);
    bodySusp.add(ex);
  }

  /* Rear Wing + Swan-Neck Struts & Endplates */
  const wing = createInkGroup(new THREE.BoxGeometry(1.66, 0.05, 0.34), '#141416', { angle: 20, edgeHex: '#FFFFFF', edgeOpacity: 0.85 });
  wing.position.set(0, 1.07, -1.96);
  bodySusp.add(wing);

  const strutGeo = new THREE.BoxGeometry(0.05, 0.20, 0.14);
  const endGeo = new THREE.BoxGeometry(0.03, 0.16, 0.40);
  for (const sx of [-0.46, 0.46]) {
    const st = createInkGroup(strutGeo, '#141416', { angle: 24, edgeHex: '#A1A1AA', edgeOpacity: 0.8 });
    st.position.set(sx, 0.97, -1.94);
    bodySusp.add(st);
  }
  for (const ex of [-0.84, 0.84]) {
    const ep = createInkGroup(endGeo, '#141416', { angle: 24, edgeHex: '#FFFFFF', edgeOpacity: 0.85 });
    ep.position.set(ex, 1.06, -1.96);
    bodySusp.add(ep);
  }

  /* 4 Rotating 24-Seg Alloy Wheels with Crosshair Spokes */
  const wheelGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.29, 24);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.31, 18);
  rimGeo.rotateZ(Math.PI / 2);
  const spokeGeoA = new THREE.BoxGeometry(0.32, 0.04, 0.38);
  const spokeGeoB = new THREE.BoxGeometry(0.32, 0.38, 0.04);
  const wheelMat = new THREE.MeshLambertMaterial({ color: '#08080a', flatShading: true });
  const rimMat = new THREE.MeshBasicMaterial({ color: '#d4d4d8', wireframe: true });
  const spokeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const wheels = [];
  for (const [wx, wz] of [[-0.86, 1.36], [0.86, 1.36], [-0.86, -1.32], [0.86, -1.32]]) {
    const w = createInkGroup(wheelGeo, '#08080a', { angle: 16, mat: wheelMat, edgeHex: '#D4D4D8', edgeOpacity: 0.82 });
    w.add(new THREE.Mesh(rimGeo, rimMat));
    w.add(new THREE.Mesh(spokeGeoA, spokeMat));
    w.add(new THREE.Mesh(spokeGeoB, spokeMat));
    w.position.set(wx, 0.37, wz);
    root.add(w);
    wheels.push({ node: w, r: 0.37 });
  }

  /* Cool White Xenon SpotLights & Beam Cone */
  const lights = [];
  for (const s of [-1, 1]) {
    const spot = new THREE.SpotLight('#ffffff', 0, 36, 0.44, 0.6, 1.15);
    spot.position.set(s * 0.6, 0.65, 2.2);
    spot.target.position.set(s * 0.9, 0, 14);
    root.add(spot, spot.target);
    lights.push(spot);
  }

  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 64;
  beamCanvas.height = 128;
  const bCtx = beamCanvas.getContext('2d');
  const grad = bCtx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.56)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  bCtx.fillStyle = grad;
  bCtx.beginPath();
  bCtx.moveTo(26, 0); bCtx.lineTo(38, 0); bCtx.lineTo(64, 128); bCtx.lineTo(0, 128);
  bCtx.fill();
  const beamTex = new THREE.CanvasTexture(beamCanvas);
  beamTex.colorSpace = THREE.SRGBColorSpace;
  beamTex.anisotropy = Math.min(8, maxAniso);
  const beamCone = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 16),
    new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
  );
  beamCone.rotation.x = -Math.PI / 2;
  beamCone.position.set(0, 0.06, 10.2);
  beamCone.renderOrder = 3;
  root.add(beamCone);

  /* Monochrome Optic Brake Reflection Halo Behind Diffuser */
  const brakeCanvas = document.createElement('canvas');
  brakeCanvas.width = 64;
  brakeCanvas.height = 64;
  const brCtx = brakeCanvas.getContext('2d');
  const brGrad = brCtx.createRadialGradient(32, 16, 2, 32, 24, 30);
  brGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
  brGrad.addColorStop(0.45, 'rgba(228, 228, 231, 0.24)');
  brGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  brCtx.fillStyle = brGrad;
  brCtx.fillRect(0, 0, 64, 64);
  const brakeTex = new THREE.CanvasTexture(brakeCanvas);
  brakeTex.colorSpace = THREE.SRGBColorSpace;
  const brakeHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.3),
    new THREE.MeshBasicMaterial({ map: brakeTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.08 })
  );
  brakeHalo.rotation.x = -Math.PI / 2;
  brakeHalo.position.set(0, 0.055, -3.15);
  brakeHalo.renderOrder = 3;
  root.add(brakeHalo);

  /* Contact Shadow Underchassis */
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 4.9),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.68, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.03;
  shadowPlane.renderOrder = 1;
  root.add(shadowPlane);

  const tailRest = new THREE.Color('#8e8e98');
  const tailHot = new THREE.Color('#ffffff');

  return {
    group: root,
    update(dt, { distance, lean, beam, rpm, brake = 0, time }) {
      for (const w of wheels) w.node.rotation.x = distance / w.r;

      bodySusp.rotation.z = lean * 0.06;
      bodySusp.rotation.x = brake * 0.018;
      bodySusp.position.y = Math.sin(time * (14 + rpm * 16)) * 0.008 * (0.3 + rpm);
      lights.forEach(l => l.intensity = 10 * beam);
      beamCone.material.opacity = 0.38 * beam;
      const tailFlare = Math.min(1, Math.max(brake, rpm > 0.2 ? 0.85 : 0));
      tailMat.color.copy(tailRest).lerp(tailHot, tailFlare);
      brakeHalo.material.opacity = 0.06 + tailFlare * 0.34;
    }
  };
}

export function startPortfolioDrive() {
  const canvas = document.getElementById('world');
  if (!canvas) return;

  const html = document.documentElement;
  const mobile = innerWidth < 760;
  const ignition = document.getElementById('ignition');
  const veil = document.getElementById('veil');
  const scrollHint = document.getElementById('scroll-hint');
  const skipBtn = document.querySelector('.skip-drive');
  const takeBtn = document.querySelector('.take-drive');
  const routeLinks = [...document.querySelectorAll('.route a')];

  const stops = [...document.querySelectorAll('.stop')].map((el, idx) => ({
    i: idx,
    el,
    id: el.id.replace('stop-', ''),
    isTail: el.classList.contains('loop-tail'),
    t: parseFloat(el.dataset.t || '0'),
    screen: el.dataset.side === 'right' ? 1 : -1,
    cam: el.dataset.cam || null,
    card: el.querySelector('.card'),
    on: false,
    vis: -1,
    lastOp: '',
    lastTf: ''
  }));
  const mainStops = stops.filter(st => !st.isTail);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const rawDpr = window.devicePixelRatio || 1;
  const maxDpr = Math.min(rawDpr, mobile ? 2.25 : 2.0);
  const minDpr = Math.min(maxDpr, 1.35);
  let curDpr = maxDpr;
  renderer.setPixelRatio(curDpr);
  renderer.setClearColor(BG_COLOR);
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG_COLOR, 50, 120);
  scene.add(new THREE.HemisphereLight('#f4f4f6', '#0a0a0c', 1.35));
  const dirLight = new THREE.DirectionalLight('#ffffff', 1.15);
  dirLight.position.set(-30, 50, -20);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight('#d4d4d8', 0.72);
  rimLight.position.set(28, 22, 34);
  scene.add(rimLight);

  const baseFov = mobile ? 44 : 38;
  const camera = new THREE.PerspectiveCamera(baseFov, innerWidth / innerHeight, 0.5, 420);
  const camConfigs = {
    base: mobile ? { h: 12.0, d: 14.2, ahead: -2.4, lat: 2.3 } : { h: 28, d: 18, ahead: 3, lat: 0 },
    garage: mobile ? { h: 13.6, d: 16.4, ahead: -0.7, lat: 2.2 } : { h: 21, d: 15, ahead: 1, lat: 0 },
    near: mobile ? { h: 12.2, d: 14.4, ahead: -4.1, lat: 2.1 } : { h: 25, d: 16, ahead: 2, lat: 0 },
    close: mobile ? { h: 14.5, d: 16.5, ahead: -1.8, lat: 2.0 } : { h: 25, d: 16, ahead: 1, lat: 0 },
    gate: mobile ? { h: 11.8, d: 14.0, ahead: -2.6, lat: 2.3 } : { h: 27, d: 19, ahead: 2, lat: 0 },
    overview: mobile ? { h: 52, d: 28, ahead: 0, lat: 0 } : { h: 46, d: 26, ahead: 9, lat: 0 }
  };

  const props = buildRoadAndScenery(scene, stops, maxAniso);
  const focusSample = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), flat: new THREE.Vector3(), right: new THREE.Vector3() };
  mainStops.forEach(st => {
    const r = sampleRoad(st.t, focusSample).pos.clone();
    const anchor = props.anchors[st.id];
    st.focus = anchor ? r.lerp(anchor, 0.5) : r;
  });

  const car = createSportsCar(maxAniso);
  scene.add(car.group);

  let mode = html.classList.contains('still-mode') ? 'overview' : 'drive';
  const initModeBtn = document.getElementById('modeToggleBtn');
  if (initModeBtn) initModeBtn.textContent = mode === 'overview' ? '3D drive' : 'Overview';
  if (mode === 'overview' && ignition) ignition.remove();
  if (mode === 'overview' && takeBtn) takeBtn.hidden = false;
  let scrollBands = [];
  let winH = innerHeight;
  let wrapSpan = 0;

  let rafId = null;
  let asleep = false;
  let idleFrames = 0;
  let wasAsleep = false;
  let avgFrameMs = 16.6;
  let activeFrames = 0;
  let dprCooldown = 0;
  let prevTime = performance.now();

  function syncRendererSize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  function wake() {
    if (mode !== 'drive') return;
    if (asleep) {
      asleep = false;
      wasAsleep = true;
      prevTime = performance.now();
    }
    idleFrames = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function resize() {
    syncRendererSize();
    winH = innerHeight;
    if (mode === 'overview') return;

    const isMob = innerWidth < 760;
    stops.forEach(st => {
      if (!st.card) return;
      const cardH = st.card.offsetHeight;
      if (isMob) {
        const dockClear = 76;
        const minTop = winH <= 740 ? Math.max(Math.round(winH * 0.42), 232) : Math.max(Math.round(winH * 0.44), 286);
        const stickTop = Math.max(64, Math.min(Math.round(winH - dockClear - cardH), winH - dockClear - 120));
        const finalTop = cardH + minTop <= winH - dockClear ? Math.max(minTop, winH - dockClear - cardH) : stickTop;
        const extra = Math.max(0, Math.round(cardH - (winH - 64 - dockClear)));
        st.card.style.top = `${Math.round(finalTop)}px`;
        st.el.style.minHeight = extra > 0 ? `calc(195vh + ${extra}px)` : '';
      } else {
        st.el.style.minHeight = '';
        const idealTop = Math.min(130, Math.max(82, Math.round(winH * 0.12)));
        const fitTop = cardH + idealTop > winH - 20 ? Math.max(72, winH - cardH - 20) : idealTop;
        st.card.style.top = `${Math.round(fitTop)}px`;
      }
    });

    const garageEl = document.getElementById('stop-garage');
    const tailEl = document.getElementById('stop-loop-tail');
    wrapSpan = garageEl && tailEl ? Math.max(0, tailEl.offsetTop - garageEl.offsetTop) : 0;

    const maxScrollAfter = Math.max(1, document.documentElement.scrollHeight - winH);
    scrollBands = stops.map((st, idx) => {
      const top = st.el.offsetTop;
      const hEl = st.el.offsetHeight;
      const center = top + hEl * 0.5 - winH * 0.52;
      if (idx === 0) {
        return {
          a: -1,
          b: Math.max(winH * 0.14, center - winH * 0.15),
          t: st.t,
          mid: 0
        };
      }
      if (st.isTail && wrapSpan > 0) {
        return {
          a: Math.max(top - winH * 0.35, wrapSpan - winH * 0.18),
          b: Infinity,
          t: 1,
          mid: wrapSpan
        };
      }
      return {
        a: center - winH * 0.30,
        b: center + winH * 0.30,
        t: st.t,
        mid: THREE.MathUtils.clamp(center, 0, maxScrollAfter)
      };
    });
    wake();
  }
  addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      props.rebakeFonts();
      resize();
      wake();
    });
  }
  resize();

  /* Auto-drive to focused stop for keyboard accessibility */
  stops.forEach((st, idx) => {
    st.el.addEventListener('focusin', () => {
      if (mode === 'drive' && !st.on && !st.isTail) driveToStop(idx);
    });
  });

  function progressAtScroll(y) {
    if (wrapSpan > 0 && y < 0) {
      const wy = ((y % wrapSpan) + wrapSpan) % wrapSpan;
      return progressAtScroll(wy) - 1;
    }
    for (let i = 0; i < scrollBands.length; i++) {
      const band = scrollBands[i];
      if (y <= band.b) {
        if (y >= band.a || i === 0) return band.t;
        const prev = scrollBands[i - 1];
        return THREE.MathUtils.lerp(prev.t, band.t, smoothstep(prev.b, band.a, y));
      }
    }
    return 1;
  }

  function cardVisibility(y, idx) {
    if (!scrollBands[idx]) return 0;
    const band = scrollBands[idx];
    const lo = band.a - winH * 0.10;
    const hi = band.b + winH * 0.10;
    const dist = y < lo ? lo - y : y > hi ? y - hi : 0;
    return 1 - linstep(0, winH * 0.42, dist);
  }

  /* Route Navigation Clicks & Continuous Loop Wrap */
  let driveAnimId = null;
  let isWrapping = false;
  let lapCount = 0;
  let smoothY = window.scrollY;
  let smoothT = progressAtScroll(smoothY);
  let lastY = smoothY;

  const cancelDriveAnim = () => {
    if (driveAnimId) {
      cancelAnimationFrame(driveAnimId);
      driveAnimId = null;
    }
  };

  function wrapForwardIfNeeded() {
    if (mode !== 'drive' || isWrapping || wrapSpan <= 0) return false;
    const y = window.scrollY;
    if (y < wrapSpan) return false;
    const laps = Math.floor(y / wrapSpan);
    const nextY = y - laps * wrapSpan;
    isWrapping = true;
    window.scrollTo({ top: nextY, behavior: 'instant' });
    isWrapping = false;
    smoothY -= laps * wrapSpan;
    lastY -= laps * wrapSpan;
    smoothT -= laps;
    lapCount += laps;
    cancelDriveAnim();
    return true;
  }

  function wrapBackwardFromTop() {
    if (mode !== 'drive' || wrapSpan <= 0) return;
    isWrapping = true;
    window.scrollTo({ top: wrapSpan - 2, behavior: 'instant' });
    isWrapping = false;
    smoothY += wrapSpan;
    lastY += wrapSpan;
    smoothT += 1;
    lapCount -= 1;
  }

  addEventListener('scroll', () => {
    if (isWrapping) return;
    wrapForwardIfNeeded();
    wake();
  }, { passive: true });

  addEventListener('wheel', e => {
    cancelDriveAnim();
    if (mode === 'drive' && wrapSpan > 0 && window.scrollY <= 1 && e.deltaY < 0
        && Math.abs(e.deltaY) >= Math.abs(e.deltaX)
        && !document.querySelector('.modal-backdrop.open')) {
      wrapBackwardFromTop();
    }
    wake();
  }, { passive: true });

  addEventListener('touchstart', () => { cancelDriveAnim(); wake(); }, { passive: true });
  addEventListener('touchmove', wake, { passive: true });

  function driveToStop(idx) {
    if (mode !== 'drive') {
      stops[idx].el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    resize();
    if (!scrollBands[idx]) return;
    const targetY = scrollBands[idx].mid + (idx === 0 || stops[idx].isTail ? 0 : winH * 0.02);
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 4) {
      wrapForwardIfNeeded();
      wake();
      return;
    }
    cancelDriveAnim();
    wake();
    const duration = Math.min(1150, Math.max(520, Math.abs(delta) * 0.14));
    const t0 = performance.now();
    const step = now => {
      const u = Math.min(1, (now - t0) / duration);
      const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      window.scrollTo({ top: startY + delta * ease, behavior: 'instant' });
      wake();
      if (u < 1) {
        driveAnimId = requestAnimationFrame(step);
      } else {
        driveAnimId = null;
        wrapForwardIfNeeded();
        wake();
      }
    };
    driveAnimId = requestAnimationFrame(step);
  }

  routeLinks.forEach((lnk, idx) => lnk.addEventListener('click', e => {
    e.preventDefault();
    const curUnit = wrapUnit(smoothT);
    if (idx === 0 && curUnit > 0.70 && stops[stops.length - 1]?.isTail) {
      driveToStop(stops.length - 1);
    } else {
      driveToStop(idx);
    }
  }));

  /* Keyboard J/K Endless Loop Navigation */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || mode !== 'drive') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
    if (document.querySelector('.modal-backdrop.open')) return;
    const key = e.key.toLowerCase();
    if (key !== 'j' && key !== 'k') return;
    e.preventDefault();
    let curIdx = 0;
    stops.forEach((st, idx) => { if (st.on) curIdx = idx; });
    curIdx = curIdx % mainStops.length;
    if (key === 'j') {
      const nextIdx = curIdx === mainStops.length - 1 && stops[stops.length - 1]?.isTail
        ? stops.length - 1
        : (curIdx + 1) % mainStops.length;
      driveToStop(nextIdx);
    } else {
      if (curIdx === 0 && wrapSpan > 0) {
        wrapBackwardFromTop();
        driveToStop(mainStops.length - 1);
      } else {
        driveToStop(Math.max(0, curIdx - 1));
      }
    }
  });

  /* Rev Button Link */
  let revDown = false;
  let revLevel = 0;
  const revBtn = document.getElementById('instrument-rev');
  const beamReadout = document.getElementById('beamReadout');
  const beamBar = document.getElementById('beamBar');
  if (revBtn) {
    const startRev = () => { revDown = true; revBtn.classList.add('down'); wake(); };
    const stopRev = () => { revDown = false; revBtn.classList.remove('down'); wake(); };
    revBtn.addEventListener('pointerdown', startRev);
    addEventListener('pointerup', stopRev);
    revBtn.addEventListener('pointercancel', stopRev);
    revBtn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') startRev(); });
    revBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stopRev(); });
    revBtn.addEventListener('blur', stopRev);
  }

  function currentOverviewStop() {
    const line = innerWidth < 980 ? Math.min(innerHeight * 0.62, 430) : innerHeight * 0.35;
    let found = 0;
    mainStops.forEach((st, idx) => {
      if (st.el.getBoundingClientRect().top <= line) found = idx;
    });
    return found;
  }

  /* Mode Switchers: Drive <-> Overview & Mobile Dock Sync */
  let lastActiveMainIdx = 0;
  const DOCK_LABELS = ['00 · INTRO', '01 · SYSTEMS', '02 · CRAFT', '03 · OPTICS', '04 · GATE'];
  const dockDriveBtn = document.getElementById('dockModeDrive');
  const dockMapBtn = document.getElementById('dockModeMap');
  const dockSectorLbl = document.getElementById('dockSectorLbl');

  function syncDockModeUI(m) {
    const isOv = m === 'overview';
    if (dockDriveBtn) {
      dockDriveBtn.classList.toggle('is-on', !isOv);
      dockDriveBtn.setAttribute('aria-pressed', String(!isOv));
    }
    if (dockMapBtn) {
      dockMapBtn.classList.toggle('is-on', isOv);
      dockMapBtn.setAttribute('aria-pressed', String(isOv));
    }
  }
  syncDockModeUI(mode);

  function enterOverviewMode() {
    if (mode === 'overview') return;
    const startIdx = lastActiveMainIdx;
    mode = 'overview';
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    syncDockModeUI('overview');
    if (veil) veil.classList.add('on');
    setTimeout(() => {
      html.classList.remove('drive');
      html.classList.add('still-mode', 'after-drive');
      if (takeBtn) takeBtn.hidden = false;
      const modeBtn = document.getElementById('modeToggleBtn');
      if (modeBtn) modeBtn.textContent = '3D drive';
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (window.focusOverviewSector) window.focusOverviewSector(startIdx, startIdx > 0, true);
      requestAnimationFrame(() => {
        if (veil) veil.classList.remove('on');
      });
    }, 180);
  }

  function enterDriveMode(idxOverride = null) {
    if (mode === 'drive') return;
    const targetIdx = typeof idxOverride === 'number' && idxOverride >= 0
      ? idxOverride % mainStops.length
      : currentOverviewStop();
    if (veil) veil.classList.add('on');
    setTimeout(() => {
      mode = 'drive';
      syncDockModeUI('drive');
      html.classList.remove('still-mode', 'after-drive');
      html.classList.add('drive');
      if (takeBtn) takeBtn.hidden = true;
      const modeBtn = document.getElementById('modeToggleBtn');
      if (modeBtn) modeBtn.textContent = 'Overview';
      resize();
      const targetY = scrollBands[targetIdx] ? scrollBands[targetIdx].mid : 0;
      window.scrollTo({ top: targetY, behavior: 'instant' });
      smoothY = targetY;
      smoothT = progressAtScroll(smoothY);
      lastY = smoothY;
      firstFrame = true;
      prevTime = performance.now();
      tick(prevTime);
      requestAnimationFrame(() => {
        if (veil) veil.classList.remove('on');
        wake();
      });
    }, 180);
  }
  window.enterDriveAtSector = idx => enterDriveMode(idx);
  window.setPortfolioMode = nextMode => {
    if (nextMode === 'overview') enterOverviewMode();
    else if (nextMode === 'drive') enterDriveMode();
  };
  window.stepPortfolioSector = delta => {
    if (mode === 'overview') {
      if (window.focusOverviewSector) {
        const cur = typeof window.getActiveOverviewSector === 'function' ? window.getActiveOverviewSector() : currentOverviewStop();
        window.focusOverviewSector(cur + delta, true);
      }
      return;
    }
    let curIdx = 0;
    stops.forEach((st, idx) => { if (st.on) curIdx = idx; });
    curIdx = curIdx % mainStops.length;
    if (delta > 0) {
      const nextIdx = curIdx === mainStops.length - 1 && stops[stops.length - 1]?.isTail
        ? stops.length - 1
        : (curIdx + 1) % mainStops.length;
      driveToStop(nextIdx);
    } else if (curIdx === 0 && wrapSpan > 0) {
      wrapBackwardFromTop();
      driveToStop(mainStops.length - 1);
    } else {
      driveToStop(Math.max(0, curIdx - 1));
    }
  };

  if (skipBtn) skipBtn.addEventListener('click', e => { e.preventDefault(); enterOverviewMode(); });
  if (takeBtn) takeBtn.addEventListener('click', () => enterDriveMode());

  /* Expose global switcher, jump helper & perf inspector */
  window.togglePortfolioViewMode = () => {
    if (mode === 'drive') enterOverviewMode();
    else enterDriveMode();
  };
  window.driveToPortfolioStop = idx => driveToStop(idx);

  /* Zero-Allocation Tick State & Pre-Allocated Scratch Math */
  let started = smoothY > 5;
  let beamStrength = 0.25;
  let lean = 0;
  let smoothVel = 0;
  let brakeLevel = 0;
  let firstFrame = true;

  const carSample = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), flat: new THREE.Vector3(), right: new THREE.Vector3() };
  const aheadSample = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), flat: new THREE.Vector3(), right: new THREE.Vector3() };
  const lookVec = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const idealCam = new THREE.Vector3();
  const camForward = new THREE.Vector3(1, 0, 0);
  const camRightVec = new THREE.Vector3(0, 0, 1);
  const camCfg = { h: 28, d: 18, ahead: 3, lat: 0 };
  const odoDigits = [...document.querySelectorAll('#odo i')];

  /* DOM Dirty-Check Cache */
  let lastPct = -1;
  let lastBarTf = '';
  let lastOdo = '';
  let lastHintGone = null;
  let lastDockIdx = -1;
  let lastSkipRight = null;
  let lastSkipEnd = null;
  let lastSkipRun = '';
  const prevRouteHere = routeLinks.map(() => null);
  const prevRouteDone = routeLinks.map(() => null);

  window.__drivePerf = () => ({
    mode,
    asleep,
    curDpr,
    maxDpr,
    avgFrameMs: +avgFrameMs.toFixed(2),
    smoothT: +wrapUnit(smoothT).toFixed(4),
    lapCount,
    wrapSpan
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
      asleep = true;
    } else if (!document.hidden && mode === 'drive') {
      wake();
    }
  });

  function updateAdaptiveDpr(rawDtMs) {
    if (wasAsleep) {
      wasAsleep = false;
      return;
    }
    if (rawDtMs < 1 || rawDtMs > 120) return;
    avgFrameMs = avgFrameMs * 0.88 + rawDtMs * 0.12;
    activeFrames++;
    if (dprCooldown > 0) {
      dprCooldown--;
      return;
    }
    if (avgFrameMs > 28 && curDpr > minDpr && activeFrames >= 24) {
      curDpr = Math.max(minDpr, +(curDpr - 0.35).toFixed(2));
      renderer.setPixelRatio(curDpr);
      syncRendererSize();
      activeFrames = 0;
      dprCooldown = 36;
    } else if (avgFrameMs <= 19.5 && curDpr < maxDpr && activeFrames >= 36) {
      curDpr = Math.min(maxDpr, +(curDpr + 0.35).toFixed(2));
      renderer.setPixelRatio(curDpr);
      syncRendererSize();
      activeFrames = 0;
      dprCooldown = 48;
    }
  }

  function tick(now) {
    rafId = null;
    if (mode !== 'drive') return;

    const rawDtMs = now - prevTime;
    const dt = Math.min(0.05, Math.max(0.0005, rawDtMs / 1000));
    prevTime = now;
    updateAdaptiveDpr(rawDtMs);

    wrapForwardIfNeeded();
    const targetY = window.scrollY;
    smoothY = THREE.MathUtils.lerp(smoothY, targetY, expDamp(8.5, dt));
    const targetT = progressAtScroll(smoothY);
    smoothT = THREE.MathUtils.lerp(smoothT, targetT, expDamp(6.5, dt));

    const vel = Math.abs(smoothY - lastY) / Math.max(dt, 0.001);
    const prevVel = smoothVel;
    smoothVel = THREE.MathUtils.lerp(smoothVel, vel, expDamp(8, dt));
    const decel = Math.max(0, prevVel - smoothVel);
    const targetBrake = decel > 28 && prevVel > 120 ? Math.min(1, decel / 420) : 0;
    brakeLevel = THREE.MathUtils.lerp(brakeLevel, targetBrake, expDamp(targetBrake > brakeLevel ? 14 : 4.2, dt));
    if (brakeLevel < 0.004 && targetBrake === 0) brakeLevel = 0;
    lastY = smoothY;
    if (!started && (smoothY > 12 || lapCount > 0)) started = true;

    /* Car Sample on Closed Spline */
    const unitT = wrapUnit(smoothT);
    const totalProgress = Math.max(0, lapCount + smoothT);
    sampleRoad(unitT, carSample);
    car.group.position.copy(carSample.pos);
    car.group.rotation.y = Math.atan2(carSample.flat.x, carSample.flat.z);

    /* Cornering Body Roll */
    sampleRoad(unitT + 0.015, aheadSample);
    const yawNow = Math.atan2(carSample.flat.x, carSample.flat.z);
    const yawAhead = Math.atan2(aheadSample.flat.x, aheadSample.flat.z);
    let dYaw = yawAhead - yawNow;
    while (dYaw > Math.PI) dYaw -= Math.PI * 2;
    while (dYaw < -Math.PI) dYaw += Math.PI * 2;
    const targetLean = THREE.MathUtils.clamp(dYaw * 6 * (0.2 + Math.min(1, vel / 800)), -1, 1);
    lean = THREE.MathUtils.lerp(lean, targetLean, expDamp(5, dt));

    revLevel += ((revDown ? 1 : 0) - revLevel) * Math.min(1, dt * (revDown ? 9 : 4.5));
    const desiredBeam = (started ? 1.0 : 0.28) + revLevel * 0.55;
    beamStrength = THREE.MathUtils.lerp(beamStrength, desiredBeam, expDamp(4, dt));

    car.update(dt, {
      distance: totalProgress * ROAD_LENGTH,
      lean,
      beam: beamStrength,
      rpm: revLevel,
      brake: brakeLevel,
      time: now / 1000
    });

    const dDial = props.getDial();
    if (dDial.pivot) {
      dDial.pivot.rotation.y = dDial.a0 - revLevel * 0.906 * dDial.sweep - Math.PI / 2;
    }

    const pct = Math.min(100, Math.round(revLevel * 100));
    if (beamReadout && pct !== lastPct) {
      lastPct = pct;
      beamReadout.textContent = `${String(pct).padStart(3, '0')}%`;
    }
    if (beamBar) {
      const nextTf = `scaleX(${Math.max(0.02, revLevel).toFixed(3)})`;
      if (nextTf !== lastBarTf) {
        lastBarTf = nextTf;
        beamBar.style.transform = nextTf;
      }
    }

    worldUniforms.uCarPos.value.copy(carSample.pos);
    worldUniforms.uCarDir.value.copy(carSample.flat);
    worldUniforms.uBeam.value = beamStrength;
    worldUniforms.uTime.value = now / 1000;
    worldUniforms.uProgress.value = unitT;

    /* Dirty-Checked Sticky Waypoint Updates */
    let activeIdx = 0;
    let bestVis = -1;
    for (let idx = 0; idx < stops.length; idx++) {
      const st = stops[idx];
      const vis = cardVisibility(smoothY, idx);
      st.vis = vis;
      if (st.card) {
        const nextOp = vis.toFixed(3);
        const nextTf = `translate3d(0, ${((1 - vis) * 26).toFixed(1)}px, 0)`;
        if (nextOp !== st.lastOp) {
          st.lastOp = nextOp;
          st.card.style.opacity = nextOp;
        }
        if (nextTf !== st.lastTf) {
          st.lastTf = nextTf;
          st.card.style.transform = nextTf;
        }
        const isOn = vis > 0.38;
        if (isOn !== st.on) {
          st.on = isOn;
          st.card.classList.toggle('on', isOn);
        }
      }
      if (vis > bestVis) {
        bestVis = vis;
        activeIdx = idx;
      }
    }

    /* Update 5-Dot Route Rail Highlights & Mobile Dock Sector (Tail mirrors Stop 0) */
    const routeActive = activeIdx % mainStops.length;
    lastActiveMainIdx = routeActive;
    if (dockSectorLbl && routeActive !== lastDockIdx) {
      lastDockIdx = routeActive;
      dockSectorLbl.textContent = DOCK_LABELS[routeActive] || '00 · INTRO';
    }
    const routeProg = smoothT < 0 ? 0 : unitT;
    const tailActive = Boolean(stops[stops.length - 1]?.on);
    for (let idx = 0; idx < routeLinks.length; idx++) {
      const lnk = routeLinks[idx];
      const isHere = idx === routeActive;
      const isDone = !isHere && !tailActive && !(routeActive === 0 && routeProg > 0.7) && stops[idx].t <= routeProg + 0.002;
      if (isHere !== prevRouteHere[idx]) {
        prevRouteHere[idx] = isHere;
        lnk.classList.toggle('here', isHere);
        if (isHere) lnk.setAttribute('aria-current', 'location');
        else lnk.removeAttribute('aria-current');
      }
      if (isDone !== prevRouteDone[idx]) {
        prevRouteDone[idx] = isDone;
        lnk.classList.toggle('done', isDone);
      }
    }

    /* Update Scroll Hint & Odometer */
    if (scrollHint) {
      const hintGone = smoothY > 40 || lapCount > 0;
      if (hintGone !== lastHintGone) {
        lastHintGone = hintGone;
        scrollHint.classList.toggle('gone', hintGone);
      }
    }
    if (odoDigits.length === 6) {
      const miles = Math.round(16000 + totalProgress * 48210);
      const str = String(miles).padStart(6, '0');
      if (str !== lastOdo) {
        lastOdo = str;
        for (let idx = 0; idx < 6; idx++) {
          if (odoDigits[idx] && odoDigits[idx].textContent !== str[idx]) {
            odoDigits[idx].textContent = str[idx];
          }
        }
      }
    }

    /* Optional Skip Sign Tuck */
    if (skipBtn) {
      const activeIsLeft = stops[activeIdx] ? stops[activeIdx].screen < 0 : false;
      const isRight = !mobile && activeIsLeft;
      const isEnd = activeIdx === stops.length - 1;
      const runStr = unitT.toFixed(3);
      if (isRight !== lastSkipRight) { lastSkipRight = isRight; skipBtn.classList.toggle('on-right', isRight); }
      if (isEnd !== lastSkipEnd) { lastSkipEnd = isEnd; skipBtn.classList.toggle('at-end', isEnd); }
      if (runStr !== lastSkipRun) { lastSkipRun = runStr; skipBtn.style.setProperty('--run', runStr); }
    }

    /* Heading-Relative Trailing Chase Camera Around 360deg Loop */
    if (firstFrame) camForward.copy(carSample.flat);
    else camForward.lerp(carSample.flat, expDamp(4.8, dt)).normalize();
    camRightVec.crossVectors(camForward, UP).normalize();

    const baseCfg = camConfigs.base;
    camCfg.h = baseCfg.h;
    camCfg.d = baseCfg.d;
    camCfg.ahead = baseCfg.ahead;
    camCfg.lat = baseCfg.lat || 0;

    for (let i = 0; i < mainStops.length; i++) {
      const st = mainStops[i];
      if (!st.cam || !camConfigs[st.cam]) continue;
      const w = 1 - linstep(0, 0.08, loopDist(unitT, st.t));
      if (w <= 0) continue;
      const cfg = camConfigs[st.cam];
      camCfg.h = THREE.MathUtils.lerp(camCfg.h, cfg.h, w);
      camCfg.d = THREE.MathUtils.lerp(camCfg.d, cfg.d, w);
      camCfg.ahead = THREE.MathUtils.lerp(camCfg.ahead, cfg.ahead, w);
      camCfg.lat = THREE.MathUtils.lerp(camCfg.lat, cfg.lat || 0, w);
    }

    const hyp = Math.hypot(camCfg.h, camCfg.d);
    const visSpan = 2 * hyp * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    const mobShortAhead = mobile && winH <= 740 ? -1.1 : 0;
    lookVec.copy(carSample.pos).addScaledVector(camForward, camCfg.ahead + mobShortAhead);

    for (let i = 0; i < mainStops.length; i++) {
      const st = mainStops[i];
      const f = smoothstep(0, 0.05, 0.05 - loopDist(unitT, st.t));
      if (f > 0 && st.focus) {
        const fw = mobile ? (st.id === 'rev' ? 0.24 : 0.10) : 0.85;
        lookVec.x += (st.focus.x - carSample.pos.x) * f * fw;
        lookVec.y += (st.focus.y - carSample.pos.y) * f * (mobile ? 0.25 : 0.45);
        lookVec.z += (st.focus.z - carSample.pos.z) * f * fw;
      }
    }

    const curStop = stops[activeIdx];
    const curVis = Math.max(0, curStop.vis);
    const camBias = curStop.cam === 'close' ? 0.22 : 0.19;
    if (!mobile) {
      lookVec.addScaledVector(camRightVec, curStop.screen * visSpan * camBias * curVis);
    }

    if (firstFrame) camTarget.copy(lookVec);
    else camTarget.lerp(lookVec, expDamp(4.2, dt));

    idealCam.copy(camTarget).addScaledVector(camForward, -camCfg.d);
    if (mobile && camCfg.lat) {
      idealCam.addScaledVector(camRightVec, -curStop.screen * camCfg.lat);
    }
    idealCam.y += camCfg.h;
    if (firstFrame) camPos.copy(idealCam);
    else camPos.lerp(idealCam, expDamp(4.2, dt));

    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    const targetFov = baseFov + Math.min(1, smoothVel / 1800) * 2.3 + revLevel * 0.9;
    const nextFov = firstFrame ? targetFov : THREE.MathUtils.lerp(camera.fov, targetFov, expDamp(6, dt));
    if (Math.abs(nextFov - camera.fov) > 0.01) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    scene.fog.near = worldUniforms.uFogNear.value = hyp + 14;
    scene.fog.far = worldUniforms.uFogFar.value = hyp + 65;

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      const holdSplash = new URLSearchParams(location.search).get('splash') === '1';
      if (ignition && !holdSplash) {
        ignition.classList.add('done');
        setTimeout(() => ignition.remove(), 700);
      }
    }

    /* Sleep WebGL loop cleanly once motion, camera & optics settle */
    const settled = !driveAnimId
      && !revDown
      && revLevel < 0.002
      && brakeLevel < 0.008
      && Math.abs(camera.fov - baseFov) < 0.02
      && Math.abs(targetY - smoothY) < 0.08
      && Math.abs(targetT - smoothT) < 1e-4
      && Math.abs(beamStrength - desiredBeam) < 0.006
      && Math.abs(lean) < 0.003
      && camPos.distanceToSquared(idealCam) < 1e-4
      && camTarget.distanceToSquared(lookVec) < 1e-4;

    if (settled) {
      idleFrames++;
      if (idleFrames >= 24) {
        asleep = true;
        return;
      }
    } else {
      idleFrames = 0;
    }

    rafId = requestAnimationFrame(tick);
  }

  if (mode === 'drive') wake();
}
