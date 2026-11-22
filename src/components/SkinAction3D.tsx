"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type SynergyModeId = 0 | 1 | 2 | 3;

interface Props {
  activeMode: SynergyModeId;
}

const MODE_CONFIG = [
  {
    color: 0xd61f42,
    glowColor: 0xff4769,
    css: "#C83E52",
    wavelength: "LED Rouge 630 nm",
    depthLabel: "Derme • Collagène (1,5 mm)",
    effectSummary: "Stimule les fibroblastes & retend le collagène",
    beamDepth: 1.48,
    beamRadius: 0.98,
    activeLayerIndex: 1,
  },
  {
    color: 0x0f8a5a,
    glowColor: 0x2fd68e,
    css: "#1E8E63",
    wavelength: "LED Verte 520 nm + Sonique",
    depthLabel: "Microcirculation & Drainage (1,1 mm)",
    effectSummary: "Ondes soniques 7 000 tr/min & flux lymphatique",
    beamDepth: 1.12,
    beamRadius: 1.06,
    activeLayerIndex: 1,
  },
  {
    color: 0x1d68d4,
    glowColor: 0x4b9eff,
    css: "#2563A6",
    wavelength: "LED Bleue 465 nm",
    depthLabel: "Épiderme & Pores (0,2 mm)",
    effectSummary: "Apaise les rougeurs & resserre le grain de peau",
    beamDepth: 0.62,
    beamRadius: 0.9,
    activeLayerIndex: 0,
  },
  {
    color: 0xd96614,
    glowColor: 0xffa033,
    css: "#B85D19",
    wavelength: "EMS + Thermie 45 °C",
    depthLabel: "Fibres Musculaires (3,5 mm)",
    effectSummary: "Micro-courants tonifiants & effet lift profond",
    beamDepth: 1.92,
    beamRadius: 1.12,
    activeLayerIndex: 2,
  },
] as const;

const DEPTH_LAYERS = [
  {
    name: "Épiderme",
    depth: "0,2 mm",
    swatch: "#E4B292",
    border: "#C48A68",
    detail: "Pores & relief",
  },
  {
    name: "Derme & Collagène",
    depth: "1,5 mm",
    swatch: "#D88F7B",
    border: "#B56A56",
    detail: "Fibroblastes & flux",
  },
  {
    name: "Muscles Faciaux",
    depth: "3,5 mm",
    swatch: "#A85247",
    border: "#823830",
    detail: "Tonus EMS",
  },
] as const;

/**
 * Generates high-contrast procedural organic skin micro-relief textures
 * (albedo + bump) so skin grain, Langer's lines and micro-pores read clearly under studio light.
 */
function makeSkinTextures() {
  const size = 512;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  // Rich warm satin skin tone (calibrated so ACES tone mapping doesn't blow out to white)
  const baseGrad = cCtx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, "#E7BEA3");
  baseGrad.addColorStop(0.5, "#DFB093");
  baseGrad.addColorStop(1, "#D7A284");
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = "#9C9C9C";
  bCtx.fillRect(0, 0, size, size);

  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Soft natural skin luminance variation
  for (let i = 0; i < 80; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 52;
    const g = cCtx.createRadialGradient(x, y, 2, x, y, r);
    const warm = rand() > 0.48 ? "rgba(196,122,92,0.14)" : "rgba(255,228,208,0.14)";
    g.addColorStop(0, warm);
    g.addColorStop(1, "rgba(255,228,208,0)");
    cCtx.fillStyle = g;
    cCtx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Sculpted skin micro-relief lattice (diamond micro-grooves)
  cCtx.strokeStyle = "rgba(150, 86, 62, 0.22)";
  cCtx.lineWidth = 1.2;
  bCtx.strokeStyle = "rgba(35, 35, 35, 0.62)";
  bCtx.lineWidth = 1.6;

  const step = 26;
  for (let offset = -size; offset < size * 2; offset += step) {
    cCtx.beginPath();
    bCtx.beginPath();
    for (let y = 0; y <= size; y += 14) {
      const jitter = Math.sin(y * 0.08 + offset * 0.05) * 3.2;
      const x = offset + y * 0.62 + jitter;
      if (y === 0) {
        cCtx.moveTo(x, y);
        bCtx.moveTo(x, y);
      } else {
        cCtx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
    }
    cCtx.stroke();
    bCtx.stroke();

    cCtx.beginPath();
    bCtx.beginPath();
    for (let y = 0; y <= size; y += 14) {
      const jitter = Math.cos(y * 0.07 + offset * 0.04) * 3.2;
      const x = offset - y * 0.62 + jitter;
      if (y === 0) {
        cCtx.moveTo(x, y);
        bCtx.moveTo(x, y);
      } else {
        cCtx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
    }
    cCtx.stroke();
    bCtx.stroke();
  }

  // Realistic recessed micro-pores
  for (let i = 0; i < 280; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1.4 + rand() * 2.2;

    const cg = cCtx.createRadialGradient(x, y, 0, x, y, r * 1.5);
    cg.addColorStop(0, "rgba(136, 74, 52, 0.34)");
    cg.addColorStop(1, "rgba(136, 74, 52, 0)");
    cCtx.fillStyle = cg;
    cCtx.beginPath();
    cCtx.arc(x, y, r * 1.5, 0, Math.PI * 2);
    cCtx.fill();

    const bg = bCtx.createRadialGradient(x, y, 0, x, y, r * 1.8);
    bg.addColorStop(0, "rgba(12, 12, 12, 0.85)");
    bg.addColorStop(0.55, "rgba(195, 195, 195, 0.45)");
    bg.addColorStop(1, "rgba(156, 156, 156, 0)");
    bCtx.fillStyle = bg;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 1.8, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2.2, 1.3);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2.2, 1.3);

  return { map, bumpMap };
}

/**
 * Generates striated anatomical muscle texture for deep facial myofibrils.
 */
function makeMuscleTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#A44E43";
  ctx.fillRect(0, 0, 256, 128);

  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "rgba(255,212,196,0.24)" : "rgba(88,28,24,0.28)";
    ctx.fillRect(0, y, 256, 2);
  }
  for (let x = 0; x < 256; x += 18) {
    ctx.fillStyle = "rgba(255,228,214,0.09)";
    ctx.fillRect(x, 0, 4, 128);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

/**
 * Rich volumetric vertical light cone gradient texture.
 */
function makeBeamTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0.96)");
  g.addColorStop(0.25, "rgba(255,255,255,0.72)");
  g.addColorStop(0.68, "rgba(255,255,255,0.30)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Soft 2D feathered light penetration texture (soft left, right, and bottom edges — zero hard rectangle).
 */
function makeSoftPenetrationTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  // Soft elliptical radial glow concentrated at top-center and fading smoothly on all sides
  const g = ctx.createRadialGradient(128, 32, 10, 128, 120, 126);
  g.addColorStop(0, "rgba(255,255,255,0.92)");
  g.addColorStop(0.32, "rgba(255,255,255,0.52)");
  g.addColorStop(0.68, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Soft radial glow sprite texture for surface light pool, subsurface glow, and contact shadow.
 */
function makeRadialGlowTexture(innerAlpha = 1, midStop = 0.45, rgb = "255,255,255") {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, `rgba(${rgb},${innerAlpha})`);
  g.addColorStop(midStop, `rgba(${rgb},${innerAlpha * 0.48})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Scalloped biological Dermal Papillae wave separating Epidermis & Dermis.
 */
function papillaWave(x: number) {
  return 0.08 + Math.sin(x * 7.2) * 0.048 + Math.cos(x * 13.5) * 0.015;
}

export function SkinAction3D({ activeMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<SynergyModeId>(activeMode);

  useEffect(() => {
    modeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    const container = containerRef.current;
    const mount = mountRef.current;
    if (!container || !mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    Object.assign(renderer.domElement.style, {
      display: "block",
      width: "100%",
      height: "100%",
    });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.48;

    // Framed with generous studio breathing room so all 4 cutaway corners + wand fit cleanly
    const camera = new THREE.PerspectiveCamera(28, 1.38, 0.1, 60);
    camera.position.set(0.55, 2.55, 7.25);
    camera.lookAt(0.18, -0.08, 0);

    // Sculptural raking studio lighting so skin pores, wrinkles & keratinocytes have real 3D relief
    scene.add(new THREE.AmbientLight(0xfff3e8, 0.42));
    const keyLight = new THREE.DirectionalLight(0xfff6ec, 1.55);
    keyLight.position.set(-5.8, 3.8, 3.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffd7be, 1.05);
    rimLight.position.set(5.4, 2.8, -3.6);
    scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight(0xf6dfd2, 0.55);
    frontFill.position.set(1.2, 1.0, 5.5);
    scene.add(frontFill);

    const root = new THREE.Group();
    root.rotation.y = -0.22;
    root.rotation.x = 0.05;
    scene.add(root);

    // Procedural Textures
    const { map: skinMap, bumpMap: skinBump } = makeSkinTextures();
    const muscleTex = makeMuscleTexture();
    const beamTex = makeBeamTexture();
    const softPenTex = makeSoftPenetrationTexture();
    const glowTex = makeRadialGlowTexture(0.95, 0.45, "255,255,255");
    const shadowTex = makeRadialGlowTexture(0.36, 0.46, "84,48,34");
    const particleTex = makeRadialGlowTexture(1, 0.36, "255,255,255");

    // Soft floating studio contact shadow beneath the 3D skin slab
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 3.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.35;
    root.add(shadowPlane);

    const W = 4.3;
    const D = 2.4;
    const halfW = W / 2;
    const halfD = D / 2;

    // =========================================================================
    // LAYER 1: ÉPIDERME (Sculpted textured skin surface + fine lines + papillae + keratinocytes)
    // =========================================================================
    const epiGeo = new THREE.PlaneGeometry(W, D, 76, 42);
    epiGeo.rotateX(-Math.PI / 2);
    const epiBaseY = new Float32Array(epiGeo.attributes.position.count);
    const epiWrinkleDepth = new Float32Array(epiGeo.attributes.position.count);

    for (let i = 0; i < epiGeo.attributes.position.count; i++) {
      const vx = epiGeo.attributes.position.getX(i);
      const vz = epiGeo.attributes.position.getZ(i);
      const edgeSoft =
        Math.cos((vx / halfW) * (Math.PI * 0.42)) *
        Math.cos((vz / halfD) * (Math.PI * 0.42));
      const dome = 0.06 * edgeSoft;

      // 3 distinct organic fine-line grooves that visibly plump & smooth under the gliding wand
      const g1 = Math.exp(-Math.pow((vx + 0.92 + Math.sin(vz * 1.4) * 0.13) * 4.8, 2));
      const g2 = Math.exp(-Math.pow((vx - 0.06 + Math.sin(vz * 1.6 + 0.5) * 0.14) * 5.0, 2));
      const g3 = Math.exp(-Math.pow((vx - 0.98 + Math.cos(vz * 1.3) * 0.12) * 4.8, 2));
      const microLine = (g1 + g2 + g3) * 0.062;

      epiBaseY[i] = dome;
      epiWrinkleDepth[i] = microLine;
      epiGeo.attributes.position.setY(i, dome - microLine);
    }
    epiGeo.computeVertexNormals();

    const epiMat = new THREE.MeshPhysicalMaterial({
      map: skinMap,
      bumpMap: skinBump,
      bumpScale: 0.045,
      color: 0xecc3a8,
      roughness: 0.44,
      metalness: 0.01,
      clearcoat: 0.28,
      clearcoatRoughness: 0.36,
      sheen: 0.52,
      sheenColor: new THREE.Color(0xffe7d6),
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    const epiMesh = new THREE.Mesh(epiGeo, epiMat);
    epiMesh.position.y = 0.4;
    root.add(epiMesh);

    // Custom extruded Epidermis cross-section with scalloped Dermal Papillae bottom interface
    const epiShape = new THREE.Shape();
    epiShape.moveTo(-halfW, 0.39);
    epiShape.lineTo(halfW, 0.39);
    epiShape.lineTo(halfW, papillaWave(halfW));
    const papillaSteps = 68;
    for (let s = papillaSteps; s >= 0; s--) {
      const x = -halfW + (s / papillaSteps) * W;
      epiShape.lineTo(x, papillaWave(x));
    }
    epiShape.closePath();

    const epiBodyGeo = new THREE.ExtrudeGeometry(epiShape, {
      depth: D,
      bevelEnabled: false,
      curveSegments: 1,
    });
    epiBodyGeo.translate(0, 0, -halfD);
    const epiBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xe3b190,
      roughness: 0.4,
      clearcoat: 0.25,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    });
    const epiBody = new THREE.Mesh(epiBodyGeo, epiBodyMat);
    root.add(epiBody);

    // Vivid anatomical Basement Membrane ribbon tracing the scalloped Dermal Papillae
    const bmPoints: THREE.Vector3[] = [];
    for (let s = 0; s <= papillaSteps; s++) {
      const x = -halfW + (s / papillaSteps) * W;
      bmPoints.push(new THREE.Vector3(x, papillaWave(x), halfD + 0.012));
    }
    const bmCurve = new THREE.CatmullRomCurve3(bmPoints);
    const bmRibbon = new THREE.Mesh(
      new THREE.TubeGeometry(bmCurve, 96, 0.02, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0xc97b61,
        emissive: new THREE.Color(0xb8644c),
        emissiveIntensity: 0.22,
        roughness: 0.28,
      })
    );
    root.add(bmRibbon);

    // Sculpted 3D Keratinocyte Cellular Strata clearly visible in the front epidermis cross-section
    const kCount = 120;
    const kGeo = new THREE.IcosahedronGeometry(0.052, 1);
    const kMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8b596,
      emissive: new THREE.Color(0x1d68d4),
      emissiveIntensity: 0.06,
      roughness: 0.34,
      clearcoat: 0.45,
    });
    const keratinocytes = new THREE.InstancedMesh(kGeo, kMat, kCount);
    const kData: { x: number; y: number; z: number; sx: number; sy: number; phase: number }[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < kCount; i++) {
      const row = i % 3;
      const col = Math.floor(i / 3);
      const frac = (col + (row % 2) * 0.5) / Math.ceil(kCount / 3);
      const x = -halfW + 0.14 + frac * (W - 0.28);
      const baseP = papillaWave(x);
      const y = baseP + 0.048 + row * 0.085;
      const z = halfD - 0.04 - (row === 1 ? 0.025 : 0);
      const sx = 1.24 - row * 0.08;
      const sy = 0.64 + (2 - row) * 0.12;
      kData.push({ x, y, z, sx, sy, phase: i * 0.43 });
      dummy.position.set(x, y, z);
      dummy.scale.set(sx, sy, 0.72);
      dummy.updateMatrix();
      keratinocytes.setMatrixAt(i, dummy.matrix);
    }
    keratinocytes.instanceMatrix.needsUpdate = true;
    root.add(keratinocytes);

    // 28 3D Surface Pores that visibly tighten under Blue 465 nm
    const poreCount = 28;
    const poreGeo = new THREE.RingGeometry(0.022, 0.046, 16);
    poreGeo.rotateX(-Math.PI / 2);
    const poreMat = new THREE.MeshBasicMaterial({
      color: 0x9c5a42,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    const pores = new THREE.InstancedMesh(poreGeo, poreMat, poreCount);
    const poreCoords: { x: number; z: number; baseScale: number }[] = [];
    let pSeed = 19;
    const pRand = () => {
      pSeed = (pSeed * 16807) % 2147483647;
      return (pSeed - 1) / 2147483646;
    };
    for (let i = 0; i < poreCount; i++) {
      const px = (pRand() - 0.5) * (W - 0.65);
      const pz = (pRand() - 0.5) * (D - 0.55);
      const bs = 0.78 + pRand() * 0.55;
      poreCoords.push({ x: px, z: pz, baseScale: bs });
      dummy.position.set(px, 0.462, pz);
      dummy.scale.setScalar(bs);
      dummy.updateMatrix();
      pores.setMatrixAt(i, dummy.matrix);
    }
    pores.instanceMatrix.needsUpdate = true;
    root.add(pores);

    // Vivid Projected LED Pool hugging the skin surface right underneath the treatment head
    const surfacePoolMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.72,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const surfacePool = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 2.25), surfacePoolMat);
    surfacePool.rotation.x = -Math.PI / 2;
    surfacePool.position.y = 0.472;
    surfacePool.renderOrder = 6;
    root.add(surfacePool);

    // =========================================================================
    // LAYER 2: DERME, COLLAGÈNE / ÉLASTINE, FIBROBLASTES & MICROCIRCULATION
    // =========================================================================
    const dermisShape = new THREE.Shape();
    dermisShape.moveTo(-halfW, -0.66);
    dermisShape.lineTo(halfW, -0.66);
    dermisShape.lineTo(halfW, papillaWave(halfW));
    for (let s = papillaSteps; s >= 0; s--) {
      const x = -halfW + (s / papillaSteps) * W;
      dermisShape.lineTo(x, papillaWave(x));
    }
    dermisShape.closePath();

    const dermisBodyGeo = new THREE.ExtrudeGeometry(dermisShape, {
      depth: D,
      bevelEnabled: false,
      curveSegments: 1,
    });
    dermisBodyGeo.translate(0, 0, -halfD);
    const dermisBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xd88e7c,
      roughness: 0.36,
      clearcoat: 0.3,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const dermisBody = new THREE.Mesh(dermisBodyGeo, dermisBodyMat);
    root.add(dermisBody);

    // Front Cross-Section Subsurface Light Penetration Glow (soft 2D feathered halo, zero hard edges)
    const cutawayGlowMat = new THREE.MeshBasicMaterial({
      map: softPenTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.62,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cutawayGlowGeo = new THREE.PlaneGeometry(2.35, 1.78);
    cutawayGlowGeo.translate(0, -0.89, 0);
    const cutawayGlow = new THREE.Mesh(cutawayGlowGeo, cutawayGlowMat);
    cutawayGlow.position.set(0, 0.42, halfD + 0.025);
    cutawayGlow.renderOrder = 9;
    root.add(cutawayGlow);

    // Rich Rose-Gold & Coral 3D Collagen Lattice inside the Dermis
    const collagenMat = new THREE.MeshPhysicalMaterial({
      color: 0xd47d69,
      emissive: new THREE.Color(0xd61f42),
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.18,
      clearcoat: 0.5,
    });
    const elastinMat = new THREE.MeshStandardMaterial({
      color: 0xe3a882,
      emissive: new THREE.Color(0xd61f42),
      emissiveIntensity: 0.25,
      roughness: 0.32,
      metalness: 0.24,
    });

    const collagenGroup = new THREE.Group();
    collagenGroup.position.y = -0.28;
    root.add(collagenGroup);

    const fibroblastPositions: THREE.Vector3[] = [];
    for (let row = 0; row < 6; row++) {
      const z = -0.9 + row * 0.36;
      const pts: THREE.Vector3[] = [];
      for (let step = 0; step <= 16; step++) {
        const x = -halfW + 0.14 + (step / 16) * (W - 0.28);
        const y = Math.sin(step * 0.82 + row * 1.35) * 0.19;
        const zz = z + Math.cos(step * 0.7 + row) * 0.085;
        pts.push(new THREE.Vector3(x, y, zz));
        if (step > 1 && step < 15 && step % 3 === 0) {
          fibroblastPositions.push(new THREE.Vector3(x, y - 0.28, zz));
        }
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const radius = row % 2 === 0 ? 0.03 : 0.023;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 10, false), collagenMat);
      collagenGroup.add(tube);
    }

    for (let col = 0; col < 9; col++) {
      const x = -1.8 + col * 0.45;
      const pts = [
        new THREE.Vector3(x - 0.26, -0.24, -0.98),
        new THREE.Vector3(x, 0.18, -0.15),
        new THREE.Vector3(x + 0.15, -0.08, 0.45),
        new THREE.Vector3(x + 0.28, 0.12, 1.0),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.016, 8, false), elastinMat);
      collagenGroup.add(tube);
    }

    // Luminous Fibroblast Cells perched on collagen junctions
    const fibroGeo = new THREE.SphereGeometry(0.048, 12, 12);
    const fibroMat = new THREE.MeshStandardMaterial({
      color: 0xffcec2,
      emissive: new THREE.Color(0xe6294b),
      emissiveIntensity: 0.75,
      roughness: 0.22,
    });
    const fibroblasts = new THREE.InstancedMesh(fibroGeo, fibroMat, fibroblastPositions.length);
    fibroblastPositions.forEach((p, idx) => {
      dummy.position.copy(p);
      dummy.scale.set(1.3, 0.75, 0.92);
      dummy.updateMatrix();
      fibroblasts.setMatrixAt(idx, dummy.matrix);
    });
    fibroblasts.instanceMatrix.needsUpdate = true;
    root.add(fibroblasts);

    // Lymphatic / Microcirculation Capillary Vessels (Green 520nm + Sonic)
    const vesselCurves: THREE.CatmullRomCurve3[] = [];
    const vesselMat = new THREE.MeshPhysicalMaterial({
      color: 0x9cd2bc,
      emissive: new THREE.Color(0x0f8a5a),
      emissiveIntensity: 0.16,
      roughness: 0.26,
      transparent: true,
      opacity: 0.52,
    });
    for (let v = 0; v < 3; v++) {
      const vz = -0.58 + v * 0.65;
      const vy = -0.44 + (v % 2) * 0.15;
      const vPts: THREE.Vector3[] = [];
      for (let s = 0; s <= 10; s++) {
        const vx = -halfW + 0.12 + (s / 10) * (W - 0.24);
        vPts.push(
          new THREE.Vector3(
            vx,
            vy + Math.sin(s * 0.9 + v * 1.7) * 0.08,
            vz + Math.cos(s * 0.8 + v) * 0.1
          )
        );
      }
      const vc = new THREE.CatmullRomCurve3(vPts);
      vesselCurves.push(vc);
      const vesselTube = new THREE.Mesh(new THREE.TubeGeometry(vc, 48, 0.028, 8, false), vesselMat);
      root.add(vesselTube);
    }

    const flowCount = 52;
    const flowGeo = new THREE.SphereGeometry(0.038, 10, 10);
    const flowMat = new THREE.MeshStandardMaterial({
      color: 0xbaffdf,
      emissive: new THREE.Color(0x14a86e),
      emissiveIntensity: 1.0,
      roughness: 0.15,
    });
    const flowDroplets = new THREE.InstancedMesh(flowGeo, flowMat, flowCount);
    root.add(flowDroplets);

    // =========================================================================
    // LAYER 3: FIBRES MUSCULAIRES FACIALES STRIÉES & IMPULSIONS VOLUMÉTRIQUES EMS
    // =========================================================================
    const muscleGroup = new THREE.Group();
    muscleGroup.position.y = -0.94;
    root.add(muscleGroup);

    const muscleMat = new THREE.MeshPhysicalMaterial({
      map: muscleTex,
      color: 0xb0584c,
      emissive: new THREE.Color(0xd96614),
      emissiveIntensity: 0.05,
      roughness: 0.42,
      clearcoat: 0.32,
      sheen: 0.5,
      sheenColor: new THREE.Color(0xffc8b2),
    });

    const muscleBundles: THREE.Mesh[] = [];
    const bundleRows = 2;
    const bundleCols = 9;
    for (let r = 0; r < bundleRows; r++) {
      for (let c = 0; c < bundleCols; c++) {
        const bz = -halfD + 0.18 + (c / (bundleCols - 1)) * (D - 0.36);
        const by = r === 0 ? 0.11 : -0.11;
        const pts = [
          new THREE.Vector3(-halfW + 0.05, by, bz),
          new THREE.Vector3(-halfW * 0.35, by + 0.035, bz + Math.sin(c) * 0.025),
          new THREE.Vector3(halfW * 0.35, by - 0.025, bz - Math.sin(c) * 0.025),
          new THREE.Vector3(halfW - 0.05, by, bz),
        ];
        const mCurve = new THREE.CatmullRomCurve3(pts);
        const mMesh = new THREE.Mesh(new THREE.TubeGeometry(mCurve, 36, 0.135, 12, false), muscleMat);
        mMesh.scale.y = 0.85;
        muscleGroup.add(mMesh);
        muscleBundles.push(mMesh);
      }
    }

    // Warm rose-champagne anatomical base plinth beneath muscle layer
    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.04, 0.075, D + 0.04),
      new THREE.MeshPhysicalMaterial({
        color: 0xc9a38c,
        roughness: 0.36,
        metalness: 0.18,
      })
    );
    basePlinth.position.y = -1.21;
    root.add(basePlinth);

    // Volumetric 3D EMS Micro-Current Energy Beads (instanced glowing amber-gold pulses descending into muscles!)
    const emsPulseCount = 42;
    const emsPulseGeo = new THREE.SphereGeometry(0.036, 10, 10);
    const emsPulseMat = new THREE.MeshStandardMaterial({
      color: 0xffe49e,
      emissive: new THREE.Color(0xff8c1a),
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0,
      roughness: 0.15,
    });
    const emsPulses = new THREE.InstancedMesh(emsPulseGeo, emsPulseMat, emsPulseCount);
    emsPulses.renderOrder = 10;
    root.add(emsPulses);

    // =========================================================================
    // GLIDING LUMIASCULPT™ M8807 TREATMENT HEAD + VIVID DUAL VOLUMETRIC BEAM
    // =========================================================================
    const wandHead = new THREE.Group();
    wandHead.position.set(0, 0.92, 0);
    root.add(wandHead);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf7f1ea,
      metalness: 0.96,
      roughness: 0.09,
    });
    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbf7f2,
      roughness: 0.16,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: MODE_CONFIG[0].color,
      emissive: new THREE.Color(MODE_CONFIG[0].color),
      emissiveIntensity: 2.8,
      toneMapped: false,
    });

    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.18, 0),
      new THREE.Vector3(-0.08, 0.56, -0.04),
      new THREE.Vector3(-0.34, 0.96, -0.1),
      new THREE.Vector3(-0.62, 1.24, -0.14),
    ]);
    const handleBody = new THREE.Mesh(
      new THREE.TubeGeometry(handleCurve, 28, 0.21, 24, false),
      ceramicMat
    );
    wandHead.add(handleBody);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.22, 48), chromeMat);
    collar.position.y = 0.18;
    wandHead.add(collar);

    const headBase = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.44, 0.16, 64), chromeMat);
    headBase.scale.set(1.12, 1, 0.92);
    headBase.position.y = 0;
    wandHead.add(headBase);

    const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.042, 20, 64), ledMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.scale.set(1.1, 0.92, 1);
    ledRing.position.y = -0.072;
    wandHead.add(ledRing);

    const electrodeMat = new THREE.MeshStandardMaterial({
      color: 0xf4eee6,
      metalness: 0.72,
      roughness: 0.18,
      emissive: new THREE.Color(0xff841a),
      emissiveIntensity: 0,
    });
    const electrode = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.036, 64),
      electrodeMat
    );
    electrode.scale.set(1.1, 1, 0.92);
    electrode.position.y = -0.082;
    wandHead.add(electrode);

    // Vivid Dual-Layer Penetrating Light Cone rendered above translucent skin strata
    const outerBeamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.56,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerBeamGeo = new THREE.CylinderGeometry(0.42, 1.08, 1.5, 48, 1, true);
    outerBeamGeo.translate(0, -0.75, 0);
    const outerBeam = new THREE.Mesh(outerBeamGeo, outerBeamMat);
    outerBeam.position.y = -0.08;
    outerBeam.renderOrder = 7;
    wandHead.add(outerBeam);

    const innerBeamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      color: MODE_CONFIG[0].glowColor,
      transparent: true,
      opacity: 0.64,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const innerBeamGeo = new THREE.CylinderGeometry(0.24, 0.56, 1.5, 36, 1, true);
    innerBeamGeo.translate(0, -0.75, 0);
    const innerBeam = new THREE.Mesh(innerBeamGeo, innerBeamMat);
    innerBeam.position.y = -0.08;
    innerBeam.renderOrder = 8;
    wandHead.add(innerBeam);

    const headLight = new THREE.PointLight(MODE_CONFIG[0].color, 5.8, 5.5, 1.6);
    headLight.position.set(0, -0.25, 0.15);
    wandHead.add(headLight);

    // Expanding surface sonic / EMS rings on the epidermis
    const ringGeo = new THREE.RingGeometry(0.32, 0.38, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const pulseRings = Array.from({ length: 3 }, () => {
      const m = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: MODE_CONFIG[0].color,
          transparent: true,
          opacity: 0,
          blending: THREE.NormalBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      m.position.y = 0.478;
      m.renderOrder = 8;
      root.add(m);
      return m;
    });

    // Biophotonic Micro-Particles
    const pCount = 88;
    const pPos = new Float32Array(pCount * 3);
    const pSeeds = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * (W - 0.5);
      pPos[i * 3 + 1] = -0.95 + Math.random() * 1.3;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * (D - 0.45);
      pSeeds[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    particles.renderOrder = 9;
    root.add(particles);

    // =========================================================================
    // INTERACTIVE DRAG-TO-ORBIT
    // =========================================================================
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let userYaw = 0;
    let userPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      mount.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw = Math.max(-0.55, Math.min(0.65, targetYaw + dx * 0.006));
      targetPitch = Math.max(-0.24, Math.min(0.32, targetPitch + dy * 0.005));
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      mount.releasePointerCapture(e.pointerId);
    };

    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("pointercancel", onPointerUp);

    // ---------- Resize ----------
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // ---------- Pause when off-screen ----------
    let rendered = true;
    const onCV = (e: Event) => {
      rendered = !(e as Event & { skipped: boolean }).skipped;
    };
    container.addEventListener("contentvisibilityautostatechange", onCV);
    let pageVisible = !document.hidden;
    const onVis = () => {
      pageVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    // =========================================================================
    // ANIMATION LOOP
    // =========================================================================
    const clock = new THREE.Clock();
    const curColor = new THREE.Color(MODE_CONFIG[0].color);
    const curGlow = new THREE.Color(MODE_CONFIG[0].glowColor);
    const tgtColor = new THREE.Color();
    const tgtGlow = new THREE.Color();
    const tempPt = new THREE.Vector3();
    let elapsed = 0;
    let currentDepth = 1.0;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!rendered || !pageVisible) return;
      elapsed += dt;
      const t = elapsed;

      const mode = modeRef.current;
      const cfg = MODE_CONFIG[mode];

      tgtColor.setHex(cfg.color);
      tgtGlow.setHex(cfg.glowColor);
      const lerpAlpha = 1 - Math.pow(0.02, dt);
      curColor.lerp(tgtColor, lerpAlpha);
      curGlow.lerp(tgtGlow, lerpAlpha);

      const pulse = 0.86 + 0.14 * Math.sin(t * 4.8);

      // Update LED, Beam & Cross-Section Glow Colors
      ledMat.color.copy(curColor);
      ledMat.emissive.copy(curColor);
      outerBeamMat.color.copy(curColor);
      innerBeamMat.color.copy(curGlow);
      surfacePoolMat.color.copy(curColor);
      cutawayGlowMat.color.copy(curColor);
      headLight.color.copy(curColor);
      pMat.color.copy(curColor);

      // Graceful figure-8 glide of the M8807 treatment head across the epidermis
      const glideX = Math.sin(t * 0.72) * 1.25;
      const glideZ = Math.sin(t * 1.44) * 0.24;
      const sonicJitter = mode === 1 ? Math.sin(t * 72) * 0.011 : 0;

      wandHead.position.x = glideX + sonicJitter;
      wandHead.position.z = glideZ;
      wandHead.position.y = 0.7 + Math.sin(t * 1.44) * 0.022;
      wandHead.rotation.z = -Math.cos(t * 0.72) * 0.1;
      wandHead.rotation.x = Math.cos(t * 1.44) * 0.04;

      // Move surface light pool + cutaway subsurface penetration column smoothly with the head
      surfacePool.position.x = glideX;
      surfacePool.position.z = glideZ;
      surfacePoolMat.opacity = (mode === 2 ? 0.74 : 0.64) * pulse;
      surfacePool.scale.setScalar(0.96 + 0.08 * pulse);

      const targetScaleY = cfg.beamDepth / 1.5;
      currentDepth += (targetScaleY - currentDepth) * Math.min(1, dt * 4.5);
      const radScale = cfg.beamRadius / 0.96;

      outerBeam.scale.set(radScale, currentDepth, radScale);
      innerBeam.scale.set(radScale * 0.92, currentDepth * 0.94, radScale * 0.92);
      outerBeamMat.opacity = (mode === 2 ? 0.44 : 0.56) * pulse;
      innerBeamMat.opacity = (mode === 2 ? 0.52 : 0.66) * pulse;

      // Subsurface penetration column glowing right across the front cutaway cross-section
      cutawayGlow.position.x = glideX;
      cutawayGlow.scale.set(radScale * 1.02, currentDepth * 0.94, 1);
      cutawayGlowMat.opacity = (mode === 2 ? 0.42 : 0.54) * pulse;

      // 1. REAL-TIME EPIDERMIS SMOOTHING & LIFT WAVE
      const posAttr = epiGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const dist = Math.hypot(vx - glideX, vz - glideZ);
        const influence = Math.exp(-dist * dist * 1.25);

        const smoothFactor = Math.min(1, influence * (mode === 0 || mode === 3 ? 1.15 : 0.85));
        const remainingWrinkle = epiWrinkleDepth[i] * (1 - smoothFactor);

        const lift =
          mode === 3
            ? 0.088 * influence * (0.75 + 0.25 * Math.sin(t * 4.4))
            : mode === 0
              ? 0.075 * influence
              : 0.035 * influence;

        const sonicRipple =
          mode === 1 ? Math.sin(dist * 11 - t * 11) * 0.022 * Math.exp(-dist * 0.72) : 0;

        posAttr.setY(i, epiBaseY[i] - remainingWrinkle + lift + sonicRipple);
      }
      posAttr.needsUpdate = true;
      epiGeo.computeVertexNormals();

      // Surface Pores visibly constrict under Blue 465nm
      for (let i = 0; i < poreCount; i++) {
        const pc = poreCoords[i];
        const dist = Math.hypot(pc.x - glideX, pc.z - glideZ);
        const tighten =
          mode === 2 ? Math.exp(-dist * dist * 1.2) * 0.56 : 0.15 * Math.exp(-dist * dist);
        const s = pc.baseScale * (1 - tighten);
        dummy.position.set(pc.x, 0.462 + Math.exp(-dist * dist * 1.25) * 0.045, pc.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(0.3, s));
        dummy.updateMatrix();
        pores.setMatrixAt(i, dummy.matrix);
      }
      pores.instanceMatrix.needsUpdate = true;

      // Front Cross-Section Keratinocyte Cellular Layer
      const kEmissiveTarget = mode === 2 ? 0.85 * pulse : 0.08;
      kMat.emissive.copy(curColor);
      kMat.emissiveIntensity += (kEmissiveTarget - kMat.emissiveIntensity) * Math.min(1, dt * 4);
      for (let i = 0; i < kCount; i++) {
        const kd = kData[i];
        const distX = Math.abs(kd.x - glideX);
        const boost = Math.exp(-distX * distX * 1.4);
        const breathe = 1 + 0.06 * Math.sin(t * 3 + kd.phase) + boost * (mode === 2 ? 0.16 : 0.06);
        dummy.position.set(kd.x, kd.y + boost * 0.026, kd.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(kd.sx * breathe, kd.sy * breathe, 0.74);
        dummy.updateMatrix();
        keratinocytes.setMatrixAt(i, dummy.matrix);
      }
      keratinocytes.instanceMatrix.needsUpdate = true;

      // 2. DERMIS: COLLAGEN SYNTHESIS + FIBROBLASTS (Red 630nm)
      const colTarget = mode === 0 ? 1.25 * pulse : 0.12;
      collagenMat.emissive.copy(curColor);
      collagenMat.emissiveIntensity +=
        (colTarget - collagenMat.emissiveIntensity) * Math.min(1, dt * 4);
      elastinMat.emissive.copy(curGlow);
      elastinMat.emissiveIntensity +=
        ((mode === 0 ? 0.85 * pulse : 0.08) - elastinMat.emissiveIntensity) * Math.min(1, dt * 4);
      collagenGroup.scale.y = mode === 0 ? 0.94 + 0.07 * Math.sin(t * 2.6) : 1;

      fibroMat.emissive.copy(curGlow);
      const fibroTarget = mode === 0 ? 1.75 * pulse : 0.22;
      fibroMat.emissiveIntensity += (fibroTarget - fibroMat.emissiveIntensity) * Math.min(1, dt * 4);
      for (let i = 0; i < fibroblastPositions.length; i++) {
        const fp = fibroblastPositions[i];
        const dist = Math.hypot(fp.x - glideX, fp.z - glideZ);
        const glowScale = 1 + (mode === 0 ? 0.5 : 0.12) * Math.exp(-dist * dist * 1.1) * pulse;
        dummy.position.set(fp.x, fp.y + (mode === 0 ? Math.sin(t * 2.6 + i) * 0.02 : 0), fp.z);
        dummy.rotation.set(0, i * 0.5, 0);
        dummy.scale.set(1.28 * glowScale, 0.78 * glowScale, 0.92 * glowScale);
        dummy.updateMatrix();
        fibroblasts.setMatrixAt(i, dummy.matrix);
      }
      fibroblasts.instanceMatrix.needsUpdate = true;

      // 3. LYMPHATIC / MICROCIRCULATION DRAINAGE FLOW (Green 520nm + Sonic)
      const vesselEmissive = mode === 1 ? 0.88 * pulse : 0.05;
      vesselMat.emissiveIntensity +=
        (vesselEmissive - vesselMat.emissiveIntensity) * Math.min(1, dt * 4);
      flowMat.emissive.copy(mode === 1 ? curGlow : curColor);
      flowMat.emissiveIntensity +=
        ((mode === 1 ? 1.65 : 0.25) - flowMat.emissiveIntensity) * Math.min(1, dt * 4);
      const flowSpeed = mode === 1 ? 0.28 : 0.08;
      for (let i = 0; i < flowCount; i++) {
        const curveIdx = i % vesselCurves.length;
        const u = (t * flowSpeed + i / flowCount) % 1;
        vesselCurves[curveIdx].getPointAt(u, tempPt);
        dummy.position.copy(tempPt);
        dummy.rotation.set(0, 0, 0);
        const s = mode === 1 ? 1.25 + 0.28 * Math.sin(t * 8 + i) : 0.58;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        flowDroplets.setMatrixAt(i, dummy.matrix);
      }
      flowDroplets.instanceMatrix.needsUpdate = true;

      // 4. DEEP STRIATED MUSCLES & VOLUMETRIC EMS 45°C MICRO-CURRENT PULSES
      const emsWave = Math.sin(t * 4.4);
      const muscTarget = mode === 3 ? 0.75 * (0.55 + 0.45 * emsWave) : 0.03;
      muscleMat.emissiveIntensity +=
        (muscTarget - muscleMat.emissiveIntensity) * Math.min(1, dt * 4);
      electrodeMat.emissiveIntensity +=
        ((mode === 3 ? 1.55 : 0) - electrodeMat.emissiveIntensity) * Math.min(1, dt * 4);

      muscleBundles.forEach((bundle, idx) => {
        const wave = mode === 3 ? Math.sin(t * 4.4 - idx * 0.35) : 0;
        bundle.scale.y = mode === 3 ? 0.85 + 0.16 * wave : 0.85;
        bundle.position.y = mode === 3 ? 0.045 * wave : 0;
      });

      // Volumetric golden EMS energy beads streaming down 6 helical arcs into the deep muscles
      const emsTargetOp = mode === 3 ? 0.92 : 0;
      emsPulseMat.opacity += (emsTargetOp - emsPulseMat.opacity) * Math.min(1, dt * 7);
      if (emsPulseMat.opacity > 0.02) {
        const channels = 6;
        const perChannel = emsPulseCount / channels;
        for (let i = 0; i < emsPulseCount; i++) {
          const ch = i % channels;
          const idxInCh = Math.floor(i / channels);
          const f = (t * 1.15 + idxInCh / perChannel) % 1;
          const topY = wandHead.position.y - 0.12;
          const botY = -0.94;
          const rad = 0.22 + 0.62 * f;
          const theta = (ch / channels) * Math.PI * 2 + t * 1.2 + f * 1.1;
          const zig = Math.sin(f * Math.PI * 5 + t * 18 + ch) * 0.06;
          dummy.position.set(
            glideX + Math.cos(theta) * rad + zig,
            topY + (botY - topY) * f,
            glideZ + Math.sin(theta) * rad * 0.75 + zig * 0.5
          );
          const s = (0.7 + 0.65 * Math.sin(f * Math.PI)) * (0.85 + 0.25 * Math.sin(t * 16 + i));
          dummy.scale.set(s * 0.9, s * 1.65, s * 0.9);
          dummy.rotation.set(0, theta, 0);
          dummy.updateMatrix();
          emsPulses.setMatrixAt(i, dummy.matrix);
        }
        emsPulses.instanceMatrix.needsUpdate = true;
      }

      // Expanding surface pulse rings on the epidermis
      pulseRings.forEach((ring, i) => {
        const p = (t * (mode === 1 ? 0.95 : 0.68) + i / pulseRings.length) % 1;
        ring.position.x = glideX;
        ring.position.z = glideZ;
        ring.scale.setScalar(0.55 + p * 2.45);
        const rm = ring.material as THREE.MeshBasicMaterial;
        rm.color.copy(curColor);
        const ringAlpha = mode === 1 ? 0.68 : mode === 3 ? 0.55 : 0.34;
        rm.opacity = (1 - p) * ringAlpha;
      });

      // Biophotonic ambient micro-particles
      const pAttr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        let px = pAttr.getX(i);
        let py = pAttr.getY(i);
        const off = pSeeds[i];
        if (mode === 1) {
          px += dt * 0.65;
          if (px > halfW - 0.2) px = -halfW + 0.2;
          py = -0.22 + Math.sin(t * 2.5 + off) * 0.24;
        } else if (mode === 2) {
          py = 0.24 + Math.sin(t * 2.0 + off) * 0.16;
        } else if (mode === 3) {
          py = -0.58 + Math.sin(t * 4.4 + off) * 0.36;
        } else {
          py = -0.26 + Math.sin(t * 1.8 + off) * 0.3;
        }
        pAttr.setX(i, px);
        pAttr.setY(i, py);
      }
      pAttr.needsUpdate = true;

      // Smooth showcase sway + user drag-to-orbit damping
      userYaw += (targetYaw - userYaw) * Math.min(1, dt * 7);
      userPitch += (targetPitch - userPitch) * Math.min(1, dt * 7);
      root.rotation.y = -0.22 + Math.sin(t * 0.32) * 0.055 + userYaw;
      root.rotation.x = 0.05 + userPitch;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("contentvisibilityautostatechange", onCV);
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as (THREE.Material & { map?: THREE.Texture | null }) | undefined;
        if (mat && !Array.isArray(mat)) {
          mat.map?.dispose();
          mat.dispose();
        }
      });
      skinMap.dispose();
      skinBump.dispose();
      muscleTex.dispose();
      beamTex.dispose();
      softPenTex.dispose();
      glowTex.dispose();
      shadowTex.dispose();
      particleTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const cfg = MODE_CONFIG[activeMode];

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-[#DFCBB9] bg-gradient-to-br from-[#F9F1E8] via-[#F2E3D5] to-[#E6D1BE] shadow-md [content-visibility:auto] [contain-intrinsic-size:auto_none_auto_475px]"
    >
      {/* Subtle warm radial studio spotlight behind the 3D cutaway */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 46% 45%, rgba(255,252,248,0.68) 0%, rgba(242,227,213,0.18) 54%, rgba(190,150,120,0.24) 100%)",
        }}
      />

      {/* Top status bar (mode + drag hint + depth pill, zero overlap) */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1E1916] shadow-2xs backdrop-blur-md">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: cfg.css }}
            />
            {cfg.wavelength}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-medium text-[#6B5B50] backdrop-blur-sm">
            <span>↻</span> Pivoter 3D
          </span>
        </div>
        <span className="rounded-full bg-[#1E1916]/85 px-3 py-1 text-[11px] font-medium text-[#FAF5EF] shadow-2xs backdrop-blur-md">
          {cfg.depthLabel}
        </span>
      </div>

      {/* Right-side live anatomical depth rail (desktop) */}
      <div className="pointer-events-none hidden sm:flex absolute right-3.5 top-1/2 -translate-y-1/2 z-10 flex-col gap-2">
        {DEPTH_LAYERS.map((layer, idx) => {
          const isTargeted = cfg.activeLayerIndex === idx;
          return (
            <div
              key={layer.name}
              className={`rounded-xl border px-2.5 py-1.5 backdrop-blur-md transition-all duration-300 ${
                isTargeted
                  ? "border-[#1E1916]/25 bg-white/95 shadow-sm scale-[1.03]"
                  : "border-[#E3D2C3]/80 bg-white/65 opacity-75"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: isTargeted ? cfg.css : layer.swatch,
                    boxShadow: isTargeted ? `0 0 8px ${cfg.css}` : undefined,
                  }}
                />
                <span className="text-[10px] font-bold text-[#1E1916]">{layer.depth}</span>
              </div>
              <p className="text-[10px] font-medium text-[#6B5C52] leading-tight mt-0.5">
                {layer.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3D Interactive Canvas */}
      <div
        ref={mountRef}
        className="relative h-[375px] sm:h-[470px] w-full cursor-grab active:cursor-grabbing touch-none"
        title="Glissez pour faire pivoter la coupe 3D"
      />

      {/* Bottom Biological Legend + Active Mode Action Summary */}
      <div className="pointer-events-none absolute bottom-3 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-2xl border border-[#E3D1C0] bg-white/92 px-4 py-2 text-[11px] font-medium text-[#5C524B] shadow-2xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          {DEPTH_LAYERS.map((layer, idx) => {
            const active = cfg.activeLayerIndex === idx;
            return (
              <span
                key={layer.name}
                className={`flex items-center gap-1.5 transition-colors ${
                  active ? "font-bold text-[#1E1916]" : "text-[#7A6B60]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border"
                  style={{
                    backgroundColor: layer.swatch,
                    borderColor: active ? cfg.css : layer.border,
                    boxShadow: active ? `0 0 0 2px ${cfg.css}33` : undefined,
                  }}
                />
                {idx + 1}. {layer.name}
              </span>
            );
          })}
        </div>
        <span className="text-[10px] font-semibold" style={{ color: cfg.css }}>
          {cfg.effectSummary}
        </span>
      </div>
    </div>
  );
}
