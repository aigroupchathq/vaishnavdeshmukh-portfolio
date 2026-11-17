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

/* Winding Night Highway Spline (450m descent across valley) */
const elevAtZ = z => 22 - z * 0.048;
const SPLINE_PTS = [
  [0, -6], [0, 6], [7, 24], [-6, 44], [-14, 66], [-4, 88],
  [12, 106], [17, 128], [6, 150], [-12, 168], [-17, 190], [-6, 212],
  [11, 230], [16, 252], [4, 274], [-13, 292], [-15, 314], [-2, 334],
  [13, 352], [14, 374], [2, 394], [-6, 414], [0, 432]
].map(([x, z]) => new THREE.Vector3(x, elevAtZ(z), z));

const roadCurve = new THREE.CatmullRomCurve3(SPLINE_PTS, false, 'centripetal', 0.5);
roadCurve.arcLengthDivisions = 2000;
const ROAD_LENGTH = roadCurve.getLength();
const UP = new THREE.Vector3(0, 1, 0);

function sampleRoad(t, out = {}) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  out.pos = roadCurve.getPointAt(clamped, out.pos || new THREE.Vector3());
  out.tan = roadCurve.getTangentAt(clamped, out.tan || new THREE.Vector3());
  out.flat = (out.flat || new THREE.Vector3()).set(out.tan.x, 0, out.tan.z).normalize();
  out.right = (out.right || new THREE.Vector3()).crossVectors(out.flat, UP).normalize();
  return out;
}

/* Corridor distance cache for sculpting valley cleanly away from tarmac & stops */
const CORRIDOR_CELL = 6;
const corridorBins = new Map();
const ROAD_HALF_WIDTH = 3.1;

function addCorridorSample(x, y, z, half) {
  const bin = Math.floor(z / CORRIDOR_CELL);
  if (!corridorBins.has(bin)) corridorBins.set(bin, []);
  corridorBins.get(bin).push({ x, y, z, half });
}

{
  const s = {};
  for (let i = 0; i <= 1400; i++) {
    sampleRoad(i / 1400, s);
    addCorridorSample(s.pos.x, s.pos.y, s.pos.z, ROAD_HALF_WIDTH);
  }
}

function addCorridorSpan(a, b, half, yOverride) {
  const steps = Math.ceil(a.distanceTo(b) / 0.8);
  for (let i = 0; i <= steps; i++) {
    const p = a.clone().lerp(b, i / steps);
    addCorridorSample(p.x, yOverride ?? p.y, p.z, half);
  }
}

function queryCorridor(x, z, range = 40) {
  let minD = Infinity;
  let y = 0;
  const sBin = Math.floor((z - range) / CORRIDOR_CELL);
  const eBin = Math.floor((z + range) / CORRIDOR_CELL);
  for (let b = sBin; b <= eBin; b++) {
    const items = corridorBins.get(b);
    if (!items) continue;
    for (const c of items) {
      const d = Math.hypot(c.x - x, c.z - z) - c.half;
      if (d < minD) {
        minD = d;
        y = c.y;
      }
    }
  }
  return { d: minD, y };
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
  const raw = elevAtZ(z) + ridge + Math.max(0, Math.abs(x) - 30) * 0.18;
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
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    #ifdef USE_U
    vU = u;
    #endif
    vec4 mv = viewMatrix * w;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

function makeAsphaltMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: worldUniforms,
    vertexShader: WORLD_VERT,
    fragmentShader: SHADER_COMMON + `
      void main() {
        float h = fract(sin(dot(floor(vW.xz * 7.5), vec2(12.9898, 78.233))) * 43758.5453);
        vec3 base = vec3(0.044) * (0.86 + 0.28 * h);
        vec3 lit = base + vec3(0.115) * beamFactor(vW);
        gl_FragColor = vec4(fogMix(lit), 1.0);
      }
    `
  });
}

function makeCenterDashMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { ...worldUniforms, uLen: { value: ROAD_LENGTH } },
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
        vec3 col = mix(vec3(0.68), vec3(0.98), clamp(b, 0.0, 1.0));
        gl_FragColor = vec4(fogMix(col), 0.35 + 0.58 * clamp(b, 0.0, 1.0));
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
        float gx = lineAA(vW.x * 0.25, 1.15);
        float gz = lineAA(vW.z * 0.25, 1.15);
        float cy = lineAA(vW.y * 0.5, 1.05);
        float distFade = 1.0 - smoothstep(26.0, 95.0, vDepth);
        float grid = max(max(gx, gz) * 0.14, cy * 0.08) * distFade;
        vec3 base = vec3(0.022) + vec3(0.90) * grid;
        vec3 lit = base + vec3(0.085) * beamFactor(vW);
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

function createSignSprite(text, { font = '700 68px Archivo, sans-serif', color = '#FFFFFF', width = 4.2, flatGround = false } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const lines = text.split('\n');
  const pxMatch = font.match(/(\d+)px/);
  const fontSize = pxMatch ? parseInt(pxMatch[1], 10) : 64;
  ctx.font = font;
  const maxW = Math.max(...lines.map(l => ctx.measureText(l).width), 60);
  const padX = 36;
  const lineH = fontSize * 1.24;
  canvas.width = Math.ceil(maxW + padX * 2);
  canvas.height = Math.ceil(lines.length * lineH + 24);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, idx) => {
    const y = (idx + 0.5) * lineH + 12;
    ctx.fillText(line, canvas.width / 2, y);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const aspect = canvas.height / canvas.width;
  const plane = new THREE.PlaneGeometry(width, width * aspect);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(plane, mat);
  if (flatGround) {
    mesh.rotation.x = -Math.PI / 2;
  }
  return mesh;
}

function buildRoadAndScenery(scene, stops) {
  const s = {};
  const roadVerts = [];
  const roadIdx = [];
  const dashVerts = [];
  const dashUs = [];
  const edgeL = [];
  const edgeR = [];
  const prng = createPrng(7);

  const SEGS = 900;
  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    sampleRoad(t, s);
    const y = s.pos.y + 0.02;
    const pL = s.pos.clone().addScaledVector(s.right, -ROAD_HALF_WIDTH);
    const pR = s.pos.clone().addScaledVector(s.right, ROAD_HALF_WIDTH);
    roadVerts.push(pL.x, y, pL.z, pR.x, y, pR.z);

    const dL = s.pos.clone().addScaledVector(s.right, -0.09);
    const dR = s.pos.clone().addScaledVector(s.right, 0.09);
    dashVerts.push(dL.x, y + 0.02, dL.z, dR.x, y + 0.02, dR.z);
    dashUs.push(t, t);

    if (i < SEGS) {
      const idx = i * 2;
      roadIdx.push(idx, idx + 2, idx + 1, idx + 1, idx + 2, idx + 3);
    }

    const shoulderOff = 0.18;
    const jitter = () => (prng() - 0.5) * 0.08;
    edgeL.push(pL.clone().addScaledVector(s.right, shoulderOff + jitter()).setY(y + 0.03));
    edgeR.push(pR.clone().addScaledVector(s.right, -shoulderOff + jitter()).setY(y + 0.03));
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setIndex(roadIdx);
  const roadMesh = new THREE.Mesh(roadGeo, makeAsphaltMaterial());
  scene.add(roadMesh);

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

  /* Build Portfolio Milestone Sculptures & Flatten Road Pads FIRST */
  const propsGroup = new THREE.Group();
  scene.add(propsGroup);
  const anchors = {};
  let dialPivot = null;
  let dialA0 = 0;
  let dialSweep = 0;

  const sideOffset = (t, sideSign, latDist, aheadDist = 0) => {
    const r = sampleRoad(t, {});
    const dir = (Math.sign(r.right.x) || 1) * sideSign;
    const pos = r.pos.clone().addScaledVector(r.right, dir * latDist).addScaledVector(r.flat, aheadDist);
    const yaw = Math.atan2(r.flat.x, r.flat.z);
    return { p: pos, yaw, right: r.right.clone().multiplyScalar(dir), flat: r.flat.clone(), y: r.pos.y };
  };

  const makePad = (pt, w, len) => {
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(w, len), makeAsphaltMaterial());
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

  /* Stop 0: Hero Architectural Portal (t = 0.0) */
  {
    sampleRoad(0, s);
    const g = new THREE.Group();
    const anchor = s.pos.clone().addScaledVector(s.flat, -0.6);
    g.position.copy(anchor);
    g.rotation.y = Math.atan2(s.flat.x, s.flat.z);

    const wallGeo = new THREE.BoxGeometry(0.24, 3.2, 8);
    for (const sx of [-3.5, 3.5]) {
      const m = createInkGroup(wallGeo, '#101012');
      m.position.set(sx, 1.6, -1);
      g.add(m);
    }
    const backWall = createInkGroup(new THREE.BoxGeometry(7.2, 3.2, 0.24), '#101012');
    backWall.position.set(0, 1.6, -5);
    g.add(backWall);

    const archPts = [new THREE.Vector3(-3.6, 3.2, 3), new THREE.Vector3(0, 4.7, 3), new THREE.Vector3(3.6, 3.2, 3)];
    const archMat = new THREE.LineBasicMaterial({ color: CHALK, transparent: true, opacity: 0.72 });
    for (const zOff of [0, -8]) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(archPts), archMat);
      line.position.z = zOff;
      g.add(line);
    }
    const titleSign = createSignSprite('VAISHNAV DESHMUKH', { font: '800 72px Archivo, sans-serif', width: 5.4, color: '#FFFFFF' });
    titleSign.position.set(0, 4.3, 0.4);
    g.add(titleSign);

    const floorSign = createSignSprite('LONDON · DESIGN & SYSTEMS', { font: '500 50px "IBM Plex Mono", monospace', width: 4.2, color: 'rgba(255,255,255,0.58)', flatGround: true });
    floorSign.position.set(0, 0.04, -3.5);
    g.add(floorSign);

    propsGroup.add(g);
    anchors['garage'] = anchor.clone();
    addCorridorSpan(anchor.clone().addScaledVector(s.flat, -5), anchor.clone(), 3.8, s.pos.y);
  }

  /* Stop 1: Method Waymarkers (t = 0.13) */
  if (stops.find(st => st.id === 'ethos')) {
    const st = stops.find(x => x.id === 'ethos');
    const dir = -st.screen;
    const labels = [['01', 'NOTICE FIRST'], ['02', 'CLEAR HIERARCHY'], ['03', 'OFFLINE-FIRST'], ['04', 'SHOW EVIDENCE']];
    labels.forEach(([num, txt], idx) => {
      const pt = sideOffset(st.t - 0.08 + idx * 0.025, dir, ROAD_HALF_WIDTH + 1.5);
      const post = createInkGroup(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), '#161618');
      post.position.copy(pt.p).setY(pt.y + 0.9);
      propsGroup.add(post);

      const sign = createSignSprite(`${num} // ${txt}`, { font: '600 48px "IBM Plex Mono", monospace', width: 3.6, color: idx === 3 ? '#FFFFFF' : '#D4D4D8' });
      sign.position.copy(pt.p).add(new THREE.Vector3(pt.right.x * 0.6, 2.2, pt.right.z * 0.6));
      sign.rotation.y = pt.yaw + (dir > 0 ? Math.PI : 0);
      propsGroup.add(sign);
    });
    const ptMain = sideOffset(st.t, dir, ROAD_HALF_WIDTH + 5);
    anchors['ethos'] = ptMain.p.clone();
  }

  /* Dynamic Domain Landmark Props for Stops 2..6 */
  const domainSpecs = [
    { id: 'health', label: 'CLINICAL & WARD', accent: true },
    { id: 'cognitive', label: 'ATTENTION LABS', accent: false },
    { id: 'civic', label: 'CIVIC & ROADS', accent: true },
    { id: 'automotive', label: 'CARS & PROVENANCE', accent: true },
    { id: 'studio', label: 'AUDIO & WRITING', accent: false }
  ];

  domainSpecs.forEach((spec, idx) => {
    const st = stops.find(x => x.id === spec.id);
    if (!st) return;
    const dir = -st.screen;
    const pt = sideOffset(st.t, dir, ROAD_HALF_WIDTH + 5.8);
    anchors[spec.id] = pt.p.clone();
    makePad(pt, 7.5, 9.5);

    const frame = new THREE.Group();
    frame.position.copy(pt.p).setY(pt.y);
    frame.rotation.y = pt.yaw;

    const colGeo = new THREE.BoxGeometry(0.32, 3.4, 0.32);
    for (const px of [-2.2, 2.2]) {
      const col = createInkGroup(colGeo, '#141416');
      col.position.set(px, 1.7, 0);
      frame.add(col);
    }
    const headerBar = createInkGroup(new THREE.BoxGeometry(4.8, 0.28, 0.36), spec.accent ? '#E4E4E7' : '#242428');
    headerBar.position.set(0, 3.45, 0);
    frame.add(headerBar);

    /* Monochrome prism marker */
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

    const lbl = createSignSprite(spec.label, { font: '700 66px Archivo, sans-serif', width: 4.5, color: '#FFFFFF' });
    lbl.position.copy(pt.p).setY(pt.y + 4.3);
    lbl.rotation.y = pt.yaw + (dir > 0 ? Math.PI : 0);
    propsGroup.add(lbl);
  });

  /* Stop 7: Beam & Throttle Sweep Pad (stop-rev / systems test) */
  if (stops.find(st => st.id === 'rev')) {
    const st = stops.find(x => x.id === 'rev');
    const pt = sideOffset(st.t, -st.screen, ROAD_HALF_WIDTH + 6.4);
    anchors['rev'] = pt.p.clone();
    makePad(pt, 9.2, 9.2);

    const dialGroup = new THREE.Group();
    dialGroup.position.copy(pt.p).setY(pt.y + 0.075);
    dialGroup.rotation.y = pt.yaw;

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

    const testText = createSignSprite('BEAM // PACE', { font: '700 84px "IBM Plex Mono", monospace', width: 2.5, flatGround: true, color: 'rgba(255,255,255,0.75)' });
    testText.position.set(0, 0.01, 2.0);
    dialGroup.add(testText);

    propsGroup.add(dialGroup);
    dialPivot = pivot;
    dialA0 = a0;
    dialSweep = sweep;
  }

  /* Stop 8: Final Archive & Inquiries Archway (stop-gate, t = 1.0) */
  if (stops.find(st => st.id === 'gate')) {
    sampleRoad(1, s);
    const arch = new THREE.Group();
    arch.position.copy(s.pos).addScaledVector(s.flat, 7.5);
    arch.rotation.y = Math.atan2(s.flat.x, s.flat.z);

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

    const gateLbl = createSignSprite('ALL 16 WORKS · CONTACT', { font: '800 76px Archivo, sans-serif', width: 5.4, color: '#FFFFFF' });
    gateLbl.position.copy(arch.position).add(new THREE.Vector3(0, 5.2, 0));
    gateLbl.rotation.y = arch.rotation.y + Math.PI;
    propsGroup.add(gateLbl);

    addCorridorSpan(s.pos.clone(), s.pos.clone().addScaledVector(s.flat, 16), 5.0, s.pos.y);
  }

  /* Terraced valley mesh AFTER all pads and bays have carved their corridors */
  const segX = mobile ? 70 : 105;
  const segZ = mobile ? 180 : 280;
  const tGeo = new THREE.PlaneGeometry(190, 520, segX, segZ);
  tGeo.rotateX(-Math.PI / 2);
  tGeo.translate(0, 0, 520 / 2 - 40);
  const tPos = tGeo.attributes.position;
  const tRng = createPrng(3);
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i) + (tRng() - 0.5) * 0.9;
    const z = tPos.getZ(i) + (tRng() - 0.5) * 0.9;
    tPos.setXYZ(i, x, terrainHeight(x, z), z);
  }
  tGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(tGeo, makeTerrainMaterial()));

  /* Build Forest OUTSIDE cleared corridors */
  const rng = createPrng(11);
  const treeFills = [];
  const treeEdges = [];
  const treeDefs = [
    () => {
      const c1 = new THREE.ConeGeometry(1.4, 3.2, 5); c1.translate(0, 2.6, 0);
      const c2 = new THREE.ConeGeometry(1.0, 2.4, 5); c2.translate(0, 4.1, 0);
      const trunk = new THREE.CylinderGeometry(0.18, 0.22, 1.2, 4); trunk.translate(0, 0.6, 0);
      return [c1, c2, trunk];
    },
    () => {
      const top = new THREE.DodecahedronGeometry(1.45, 0); top.translate(0, 2.8, 0);
      const trunk = new THREE.CylinderGeometry(0.16, 0.2, 1.8, 4); trunk.translate(0, 0.9, 0);
      return [top, trunk];
    },
    () => {
      const spire = new THREE.ConeGeometry(1.0, 4.4, 4); spire.translate(0, 2.9, 0);
      const trunk = new THREE.CylinderGeometry(0.12, 0.16, 1.0, 4); trunk.translate(0, 0.5, 0);
      return [spire, trunk];
    }
  ];

  const avoidPoints = stops.map(st => {
    const p = sampleRoad(st.t, {}).pos;
    return { x: p.x, z: p.z, r: 17 };
  });

  const targetTrees = mobile ? 210 : 380;
  let placed = 0;
  let tries = 0;
  const mat4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const upAx = new THREE.Vector3(0, 1, 0);
  const scaleV = new THREE.Vector3();

  while (placed < targetTrees && tries++ < targetTrees * 12) {
    const x = (rng() - 0.5) * 170;
    const z = -30 + rng() * 480;
    const corr = queryCorridor(x, z, 30);
    if (corr.d < 4.5 || (corr.d < 9 && rng() < 0.75)) continue;
    if (avoidPoints.some(ap => Math.hypot(ap.x - x, ap.z - z) < ap.r)) continue;

    const ty = terrainHeight(x, z);
    const parts = treeDefs[Math.floor(rng() * treeDefs.length)]();
    const sc = 0.7 + rng() * 0.85;
    q.setFromAxisAngle(upAx, rng() * Math.PI * 2);
    mat4.compose(new THREE.Vector3(x, ty - 0.1, z), q, scaleV.set(sc, sc * (0.85 + rng() * 0.4), sc));

    for (const part of parts) {
      const clone = part.index ? part.toNonIndexed() : part.clone();
      clone.deleteAttribute('uv');
      clone.applyMatrix4(mat4);
      treeFills.push(clone);

      const edg = new THREE.EdgesGeometry(part, 20);
      edg.applyMatrix4(mat4);
      treeEdges.push(edg);
    }
    placed++;
  }

  if (treeFills.length > 0) {
    const mergedFill = mergeGeos(treeFills);
    mergedFill.computeVertexNormals();
    scene.add(new THREE.Mesh(mergedFill, new THREE.MeshLambertMaterial({ color: '#141519', flatShading: true })));

    const mergedLines = mergeGeos(treeEdges);
    scene.add(new THREE.LineSegments(mergedLines, new THREE.LineBasicMaterial({ color: SILVER, transparent: true, opacity: 0.42 })));
  }

  return { anchors, getDial: () => ({ pivot: dialPivot, a0: dialA0, sweep: dialSweep }) };
}

/* Monochrome Obsidian & Silver Architectural Coupé */
function extrudeSide(pts, width, bevel = 0.06) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1 });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

function createSportsCar() {
  const root = new THREE.Group();
  const bodySusp = new THREE.Group();
  root.add(bodySusp);

  const bodyGeo = extrudeSide([
    [-2.15, 0.34], [2.12, 0.34], [2.22, 0.56], [2.14, 0.72],
    [0.62, 0.86], [-1.55, 0.9], [-2.12, 0.86], [-2.22, 0.6]
  ], 1.72);
  bodySusp.add(createInkGroup(bodyGeo, '#18181b', {
    angle: 20,
    mat: new THREE.MeshLambertMaterial({ color: '#1b1c20', flatShading: true }),
    edgeHex: '#FFFFFF',
    edgeOpacity: 0.88
  }));

  const cabinGeo = extrudeSide([[0.62, 0.86], [-0.05, 1.32], [-1.0, 1.36], [-1.62, 0.9]], 1.44, 0.04);
  bodySusp.add(createInkGroup(cabinGeo, '#060608', {
    angle: 20,
    mat: new THREE.MeshLambertMaterial({ color: '#070709', flatShading: true }),
    edgeHex: '#D4D4D8',
    edgeOpacity: 0.75
  }));

  /* Crisp white beltline trim */
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.03, 3.92), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
  trim.position.set(0, 0.62, 0.02);
  bodySusp.add(trim);

  /* Xenon Headlights + Optic Silver Tail Lightbar */
  const headMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#d4d4d8' });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.06), headMat);
    hl.position.set(s * 0.58, 0.55, 2.27);
    bodySusp.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.06), tailMat);
    tl.position.set(s * 0.56, 0.68, -2.27);
    bodySusp.add(tl);
  }

  /* Rear Wing */
  const wing = createInkGroup(new THREE.BoxGeometry(1.62, 0.05, 0.34), '#141416');
  wing.position.set(0, 1.05, -1.96);
  bodySusp.add(wing);

  /* 4 Rotating Wheels */
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: '#08080a', flatShading: true });
  const wheels = [];
  for (const [wx, wz] of [[-0.86, 1.36], [0.86, 1.36], [-0.86, -1.32], [0.86, -1.32]]) {
    const w = createInkGroup(wheelGeo, '#08080a', { angle: 12, mat: wheelMat, edgeHex: '#A1A1AA', edgeOpacity: 0.7 });
    w.position.set(wx, 0.36, wz);
    root.add(w);
    wheels.push({ node: w, r: 0.36 });
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
  const beamCone = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 16),
    new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
  );
  beamCone.rotation.x = -Math.PI / 2;
  beamCone.position.set(0, 0.06, 10.2);
  beamCone.renderOrder = 3;
  root.add(beamCone);

  /* Contact Shadow Underchassis */
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 4.9),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.68, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.03;
  shadowPlane.renderOrder = 1;
  root.add(shadowPlane);

  return {
    group: root,
    update(dt, { distance, lean, beam, rpm, time }) {
      const wheelRot = distance / 0.36;
      for (const w of wheels) w.node.rotation.x = wheelRot;

      bodySusp.rotation.z = lean * 0.06;
      bodySusp.position.y = Math.sin(time * (14 + rpm * 16)) * 0.008 * (0.3 + rpm);
      lights.forEach(l => l.intensity = 10 * beam);
      beamCone.material.opacity = 0.38 * beam;
      tailMat.color.setHex(rpm > 0.2 ? 0xffffff : 0xa1a1aa);
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
    t: parseFloat(el.dataset.t || '0'),
    screen: el.dataset.side === 'right' ? 1 : -1,
    cam: el.dataset.cam || null,
    card: el.querySelector('.card'),
    on: false,
    vis: 0
  }));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(BG_COLOR);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG_COLOR, 50, 120);
  scene.add(new THREE.HemisphereLight('#e4e4e7', '#040405', 1.1));
  const dirLight = new THREE.DirectionalLight('#ffffff', 0.95);
  dirLight.position.set(-30, 50, -20);
  scene.add(dirLight);

  const camera = new THREE.PerspectiveCamera(mobile ? 50 : 38, innerWidth / innerHeight, 0.5, 420);
  const camConfigs = {
    base: mobile ? { h: 35, d: 20, ahead: 8 } : { h: 28, d: 18, ahead: 3 },
    garage: mobile ? { h: 25, d: 16, ahead: 5 } : { h: 21, d: 15, ahead: 1 },
    near: mobile ? { h: 32, d: 18, ahead: 7 } : { h: 25, d: 16, ahead: 2 },
    close: mobile ? { h: 30, d: 17, ahead: 6 } : { h: 25, d: 16, ahead: 1 },
    gate: mobile ? { h: 34, d: 20, ahead: 8 } : { h: 27, d: 19, ahead: 2 },
    overview: mobile ? { h: 58, d: 30, ahead: 14 } : { h: 46, d: 26, ahead: 9 }
  };

  const props = buildRoadAndScenery(scene, stops);
  stops.forEach(st => {
    const r = sampleRoad(st.t, {}).pos.clone();
    const anchor = props.anchors[st.id];
    st.focus = anchor ? r.lerp(anchor, 0.5) : r;
  });

  const car = createSportsCar();
  scene.add(car.group);

  let mode = html.classList.contains('still-mode') ? 'overview' : 'drive';
  if (mode === 'overview' && ignition) ignition.remove();
  if (mode === 'overview' && takeBtn) takeBtn.hidden = false;
  let scrollBands = [];
  let winH = innerHeight;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    winH = innerHeight;
    if (mode === 'overview') return;

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - winH);
    const isMob = innerWidth < 760;
    stops.forEach((st, idx) => {
      if (!st.card) return;
      const cardH = st.card.offsetHeight;
      if (isMob) {
        const stickTop = Math.round(winH * (idx === 0 ? 0.34 : 0.38));
        const extra = Math.max(0, Math.round(cardH - (winH - stickTop - 18)));
        st.card.style.top = `${Math.max(68, stickTop - extra)}px`;
        st.el.style.minHeight = extra > 0 ? `calc(${idx === stops.length - 1 ? 150 : 200}vh + ${extra}px)` : '';
      } else {
        st.el.style.minHeight = '';
        const idealTop = Math.min(130, Math.max(82, Math.round(winH * 0.12)));
        const fitTop = cardH + idealTop > winH - 20 ? Math.max(72, winH - cardH - 20) : idealTop;
        st.card.style.top = `${Math.round(fitTop)}px`;
      }
    });

    const maxScrollAfter = Math.max(1, document.documentElement.scrollHeight - winH);
    scrollBands = stops.map((st, idx) => {
      const top = st.el.offsetTop;
      const hEl = st.el.offsetHeight;
      const center = top + hEl * 0.5 - winH * 0.52;
      let a = center - winH * 0.30;
      let b = center + winH * 0.30;
      if (idx === 0) { a = -1; b = Math.max(winH * 0.14, center - winH * 0.15); }
      if (idx === stops.length - 1) { a = Math.min(a, maxScrollAfter - winH * 0.55); b = Infinity; }
      return { a, b, t: st.t, mid: THREE.MathUtils.clamp(idx === 0 ? 0 : center, 0, maxScrollAfter) };
    });
  }
  addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  resize();

  /* Auto-drive to focused stop for keyboard accessibility */
  stops.forEach((st, idx) => {
    st.el.addEventListener('focusin', () => {
      if (mode === 'drive' && !st.on) driveToStop(idx);
    });
  });

  function progressAtScroll(y) {
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

  /* Route Navigation Clicks with Deterministic Smooth Glide */
  let driveAnimId = null;
  const cancelDriveAnim = () => {
    if (driveAnimId) {
      cancelAnimationFrame(driveAnimId);
      driveAnimId = null;
    }
  };
  addEventListener('wheel', cancelDriveAnim, { passive: true });
  addEventListener('touchstart', cancelDriveAnim, { passive: true });

  function driveToStop(idx) {
    if (mode !== 'drive') {
      stops[idx].el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    resize();
    if (!scrollBands[idx]) return;
    const targetY = scrollBands[idx].mid + (idx === 0 ? 0 : winH * 0.02);
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 4) return;
    cancelDriveAnim();
    const duration = Math.min(1150, Math.max(520, Math.abs(delta) * 0.14));
    const t0 = performance.now();
    const step = now => {
      const u = Math.min(1, (now - t0) / duration);
      const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      window.scrollTo({ top: startY + delta * ease, behavior: 'instant' });
      if (u < 1) {
        driveAnimId = requestAnimationFrame(step);
      } else {
        driveAnimId = null;
      }
    };
    driveAnimId = requestAnimationFrame(step);
  }
  routeLinks.forEach((lnk, idx) => lnk.addEventListener('click', e => {
    e.preventDefault();
    driveToStop(idx);
  }));

  /* Keyboard J/K convenience for quick stop-by-stop driving */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || mode !== 'drive') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
    if (document.querySelector('.modal-backdrop.open')) return;
    const key = e.key.toLowerCase();
    if (key !== 'j' && key !== 'k') return;
    let curIdx = 0;
    stops.forEach((st, idx) => { if (st.on) curIdx = idx; });
    const nextIdx = Math.max(0, Math.min(stops.length - 1, curIdx + (key === 'j' ? 1 : -1)));
    if (nextIdx !== curIdx) {
      e.preventDefault();
      driveToStop(nextIdx);
    }
  });

  /* Rev Button Link */
  let revDown = false;
  let revLevel = 0;
  const revBtn = document.getElementById('instrument-rev');
  if (revBtn) {
    revBtn.addEventListener('pointerdown', () => revDown = true);
    addEventListener('pointerup', () => revDown = false);
    revBtn.addEventListener('pointercancel', () => revDown = false);
    revBtn.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') revDown = true; });
    revBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') revDown = false; });
    revBtn.addEventListener('blur', () => revDown = false);
  }

  function currentOverviewStop() {
    const line = innerHeight * 0.35;
    let found = 0;
    stops.forEach((st, idx) => {
      if (st.el.getBoundingClientRect().top <= line) found = idx;
    });
    return found;
  }

  /* Mode Switchers: Skip Drive <-> Take Drive */
  function enterOverviewMode() {
    if (mode === 'overview') return;
    mode = 'overview';
    if (veil) veil.classList.add('on');
    setTimeout(() => {
      html.classList.remove('drive');
      html.classList.add('still-mode', 'after-drive');
      if (takeBtn) takeBtn.hidden = false;
      const modeBtn = document.getElementById('modeToggleBtn');
      if (modeBtn) modeBtn.textContent = 'Take the drive';
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (veil) veil.classList.remove('on');
    }, 320);
  }

  function enterDriveMode() {
    if (mode === 'drive') return;
    const targetIdx = currentOverviewStop();
    if (veil) veil.classList.add('on');
    setTimeout(() => {
      mode = 'drive';
      html.classList.remove('still-mode', 'after-drive');
      html.classList.add('drive');
      if (takeBtn) takeBtn.hidden = true;
      const modeBtn = document.getElementById('modeToggleBtn');
      if (modeBtn) modeBtn.textContent = 'Full page';
      resize();
      const targetY = scrollBands[targetIdx] ? scrollBands[targetIdx].mid : 0;
      window.scrollTo({ top: targetY, behavior: 'instant' });
      smoothY = targetY;
      smoothT = progressAtScroll(smoothY);
      lastY = smoothY;
      firstFrame = true;
      if (veil) veil.classList.remove('on');
    }, 320);
  }

  if (skipBtn) skipBtn.addEventListener('click', e => { e.preventDefault(); enterOverviewMode(); });
  if (takeBtn) takeBtn.addEventListener('click', () => enterDriveMode());

  /* Expose global switcher & jump helper for header links */
  window.togglePortfolioViewMode = () => {
    if (mode === 'drive') enterOverviewMode();
    else enterDriveMode();
  };
  window.driveToPortfolioStop = idx => driveToStop(idx);

  /* State Loop */
  let smoothY = window.scrollY;
  let smoothT = progressAtScroll(smoothY);
  let lastY = smoothY;
  let started = smoothY > 5;
  let beamStrength = 0.25;
  let lean = 0;
  let firstFrame = true;

  const carSample = {};
  const lookVec = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const odoDigits = [...document.querySelectorAll('#odo i')];

  let prevTime = performance.now();

  function tick(now) {
    const dt = Math.min(0.05, (now - prevTime) / 1000);
    prevTime = now;

    if (mode === 'drive') {
      smoothY = THREE.MathUtils.lerp(smoothY, window.scrollY, expDamp(8.5, dt));
      const targetT = progressAtScroll(smoothY);
      smoothT = THREE.MathUtils.lerp(smoothT, targetT, expDamp(6.5, dt));

      const vel = Math.abs(smoothY - lastY) / Math.max(dt, 0.001);
      lastY = smoothY;
      if (!started && smoothY > 12) started = true;

      /* Car Sample on Spline */
      sampleRoad(smoothT, carSample);
      car.group.position.copy(carSample.pos);
      car.group.rotation.y = Math.atan2(carSample.flat.x, carSample.flat.z);

      /* Slight cornering lean */
      const aheadS = sampleRoad(Math.min(1, smoothT + 0.015), {});
      const yawNow = Math.atan2(carSample.flat.x, carSample.flat.z);
      const yawAhead = Math.atan2(aheadS.flat.x, aheadS.flat.z);
      let dYaw = yawAhead - yawNow;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      const targetLean = THREE.MathUtils.clamp(dYaw * 6 * (0.2 + Math.min(1, vel / 800)), -1, 1);
      lean = THREE.MathUtils.lerp(lean, targetLean, expDamp(5, dt));

      revLevel += ((revDown ? 1 : 0) - revLevel) * Math.min(1, dt * (revDown ? 9 : 4.5));
      const desiredBeam = (started ? 1.0 : 0.28) + revLevel * 0.55;
      beamStrength = THREE.MathUtils.lerp(beamStrength, desiredBeam, expDamp(4, dt));

      car.update(dt, {
        distance: smoothT * ROAD_LENGTH,
        lean,
        beam: beamStrength,
        rpm: revLevel,
        time: now / 1000
      });

      const dDial = props.getDial();
      if (dDial.pivot) {
        dDial.pivot.rotation.y = dDial.a0 - revLevel * 0.906 * dDial.sweep - Math.PI / 2;
      }

      worldUniforms.uCarPos.value.copy(carSample.pos);
      worldUniforms.uCarDir.value.copy(carSample.flat);
      worldUniforms.uBeam.value = beamStrength;
      worldUniforms.uTime.value = now / 1000;
      worldUniforms.uProgress.value = smoothT;

      /* Update Sticky Waypoint Cards & Determine Active Stop */
      let activeIdx = 0;
      let bestVis = -1;
      stops.forEach((st, idx) => {
        const vis = cardVisibility(smoothY, idx);
        st.vis = vis;
        if (st.card) {
          st.card.style.opacity = vis.toFixed(3);
          st.card.style.transform = `translate3d(0, ${((1 - vis) * 26).toFixed(1)}px, 0)`;
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
      });

      /* Update Route Rail Highlights */
      routeLinks.forEach((lnk, idx) => {
        lnk.classList.toggle('here', idx === activeIdx);
        lnk.classList.toggle('done', idx !== activeIdx && stops[idx].t <= smoothT + 0.002);
      });

      /* Update Odometer & Scroll Hint */
      if (scrollHint) scrollHint.classList.toggle('gone', smoothY > 40);
      if (odoDigits.length === 6) {
        const miles = Math.round(16000 + smoothT * 48210);
        const chars = String(miles).padStart(6, '0').split('');
        chars.forEach((ch, idx) => {
          if (odoDigits[idx] && odoDigits[idx].textContent !== ch) {
            odoDigits[idx].textContent = ch;
          }
        });
      }

      /* Skip Drive Sign Collision TUCK & End Fade */
      if (skipBtn) {
        const activeIsLeft = stops[activeIdx] ? stops[activeIdx].screen < 0 : false;
        skipBtn.classList.toggle('on-right', !mobile && activeIsLeft);
        skipBtn.classList.toggle('at-end', activeIdx === stops.length - 1);
        skipBtn.style.setProperty('--run', smoothT.toFixed(3));
      }

      /* Dynamic Camera Framing Keeping Car in Opposite Half of Viewport */
      const camCfg = { ...camConfigs.base };
      for (const st of stops) {
        if (!st.cam || !camConfigs[st.cam]) continue;
        const w = 1 - linstep(0, 0.08, Math.abs(smoothT - st.t));
        if (w <= 0) continue;
        for (const k of ['h', 'd', 'ahead']) {
          camCfg[k] = THREE.MathUtils.lerp(camCfg[k], camConfigs[st.cam][k], w);
        }
      }

      const hyp = Math.hypot(camCfg.h, camCfg.d);
      const visSpan = 2 * hyp * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      let tx = carSample.pos.x;
      let tz = carSample.pos.z + camCfg.ahead;

      for (const st of stops) {
        const f = smoothstep(0, 0.05, 0.05 - Math.abs(smoothT - st.t));
        if (f > 0 && st.focus) {
          tx += (st.focus.x - carSample.pos.x) * f;
          tz += (st.focus.z - carSample.pos.z) * f * 0.55;
        }
      }

      const curStop = stops[activeIdx];
      const curVis = Math.max(0, curStop.vis);
      const camBias = curStop.cam === 'close' ? 0.22 : 0.19;
      if (mobile) tz += 4.5 * curVis;
      else tx += curStop.screen * visSpan * camBias * curVis;

      lookVec.set(tx, carSample.pos.y, tz);
      if (firstFrame) camTarget.copy(lookVec);
      else camTarget.lerp(lookVec, expDamp(4.2, dt));

      const idealCam = new THREE.Vector3(camTarget.x, camTarget.y + camCfg.h, camTarget.z + camCfg.d);
      if (firstFrame) camPos.copy(idealCam);
      else camPos.lerp(idealCam, expDamp(4.2, dt));

      camera.position.copy(camPos);
      camera.lookAt(camTarget);

      scene.fog.near = worldUniforms.uFogNear.value = hyp + 14;
      scene.fog.far = worldUniforms.uFogFar.value = hyp + 65;

      renderer.render(scene, camera);

      if (firstFrame) {
        firstFrame = false;
        if (ignition) {
          ignition.classList.add('done');
          setTimeout(() => ignition.remove(), 700);
        }
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
