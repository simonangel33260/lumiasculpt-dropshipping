"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type SynergyModeId = 0 | 1 | 2 | 3;

interface Props {
  activeMode: SynergyModeId;
  onSelectMode?: (mode: SynergyModeId) => void;
}

const MODE_CONFIG = [
  {
    id: 0 as SynergyModeId,
    shortLabel: "Rouge",
    panelKey: "LED 630",
    color: 0xd61f42,
    glowColor: 0xff4d6d,
    sssColor: 0xff2e55,
    css: "#C83E52",
    wavelength: "LED Rouge 630 nm",
    depthLabel: "Derme • Collagène (1,5 mm)",
    effectSummary: "Stimule les fibroblastes & retend le collagène",
    beamDepth: 1.48,
    beamRadius: 0.98,
    activeLayerIndex: 1,
  },
  {
    id: 1 as SynergyModeId,
    shortLabel: "Verte",
    panelKey: "PURETÉ",
    color: 0x0f8a5a,
    glowColor: 0x32de96,
    sssColor: 0x1ac47d,
    css: "#1E8E63",
    wavelength: "LED Verte 520 nm + Sonique",
    depthLabel: "Microcirculation & Drainage (1,1 mm)",
    effectSummary: "Ondes soniques 7 000 tr/min & flux lymphatique",
    beamDepth: 1.12,
    beamRadius: 1.06,
    activeLayerIndex: 1,
  },
  {
    id: 2 as SynergyModeId,
    shortLabel: "Bleue",
    panelKey: "PORES",
    color: 0x1d68d4,
    glowColor: 0x52a5ff,
    sssColor: 0x2c82f5,
    css: "#2563A6",
    wavelength: "LED Bleue 465 nm",
    depthLabel: "Épiderme & Pores (0,2 mm)",
    effectSummary: "Apaise les rougeurs & resserre le grain de peau",
    beamDepth: 0.62,
    beamRadius: 0.9,
    activeLayerIndex: 0,
  },
  {
    id: 3 as SynergyModeId,
    shortLabel: "EMS 45°",
    panelKey: "LIFT EMS",
    color: 0xd96614,
    glowColor: 0xffa438,
    sssColor: 0xff7b1c,
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

// =========================================================================
// EXACT LUMIASCULPT™ M8807 GEOMETRY HELPERS (identical to ProductHero3D.tsx)
// =========================================================================
const H_BOTTOM = -1.75;
const H_TOP = 1.36;
const Z_SCALE = 0.82;
const PANEL_Y0 = -0.42;
const PANEL_Y1 = 1.3;
const PANEL_PHI = 1.15;

function smoothStep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function handleRadius(y: number) {
  if (y <= H_BOTTOM) return 0;
  if (y < -1.58) {
    const k = (y - -1.58) / (H_BOTTOM - -1.58);
    return 0.35 * Math.sqrt(Math.max(0, 1 - k * k));
  }
  if (y > 0.95) {
    const k = (y - 0.95) / (H_TOP - 0.95);
    return 0.46 * Math.sqrt(Math.max(0, 1 - k * k));
  }
  return 0.35 + 0.11 * smoothStep(-1.58, 0.95, y);
}

function buildHandleProfile(y0: number, y1: number, offset: number, steps = 120) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    pts.push(new THREE.Vector2(Math.max(0.0001, handleRadius(y) + offset), y));
  }
  return pts;
}

function drawDevicePanel(ctx: CanvasRenderingContext2D, activeKey: string, activeHex: string) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  const inset = W * 0.17;
  const r = W * 0.33;
  ctx.fillStyle = "#110F0E";
  ctx.beginPath();
  ctx.moveTo(inset, 0);
  ctx.lineTo(W - inset, 0);
  ctx.lineTo(W - inset, H - r);
  ctx.quadraticCurveTo(W - inset, H, W / 2, H);
  ctx.quadraticCurveTo(inset, H, inset, H - r);
  ctx.closePath();
  ctx.fill();

  const row = (y: number) => ((PANEL_Y1 - y) / (PANEL_Y1 - PANEL_Y0)) * H;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#EFEAE4";
  ctx.strokeStyle = "#EFEAE4";
  ctx.lineWidth = 3;
  const iconY = row(0.6);
  for (let i = 0; i < 6; i++) {
    const h = [10, 18, 26, 26, 18, 10][i];
    ctx.fillRect(W / 2 - 84 + i * 8, iconY - h / 2, 3, h);
    ctx.fillRect(W / 2 + 40 + i * 8, iconY - h / 2, 3, h);
  }
  ctx.beginPath();
  ctx.ellipse(W / 2, iconY, 26, 17, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "600 17px system-ui, sans-serif";
  ctx.fillText("RF", W / 2, iconY + 1);

  const rows: [string, string][] = [
    ["PURETÉ", "LED 630"],
    ["PORES", "ÉCLAT"],
    ["SÉRUM 45°", "LIFT EMS"],
  ];
  const colX = [W / 2 - 62, W / 2 + 62];
  rows.forEach((pair, ri) => {
    const y = row(0.43 - ri * 0.13);
    pair.forEach((label, ci) => {
      const isActive = label === activeKey;
      ctx.font = `${isActive ? 700 : 500} 23px system-ui, sans-serif`;
      if (isActive) {
        ctx.shadowColor = activeHex;
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#FFFFFF";
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#C8C2BC";
      }
      ctx.fillText(label, colX[ci], y);
    });
  });
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#C8C2BC";
  ctx.font = "500 23px system-ui, sans-serif";
  ctx.fillText("SOIN REGARD", W / 2, row(0.04));

  ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillStyle = "#9C948E";
  const lvlY = row(-0.1);
  ["1", "2", "3"].forEach((l, i) => ctx.fillText(l, W / 2 - 90 + i * 52, lvlY));
  ctx.fillStyle = "#3EE08F";
  for (let i = 0; i < 4; i++) ctx.fillRect(W / 2 + 74, lvlY + 12 - i * 8, 18, 5);
}

function makeButtonIconTexture(kind: "vib" | "power") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#EFEAE3";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(182,172,162,0.35)";
  ctx.lineWidth = 2;
  for (let r = 12; r < 58; r += 8) {
    ctx.beginPath();
    ctx.arc(64, 64, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "#3A332E";
  ctx.lineWidth = 6.5;
  ctx.lineCap = "round";
  if (kind === "power") {
    ctx.beginPath();
    ctx.arc(64, 68, 25, -Math.PI * 0.32, Math.PI * 1.32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(64, 30);
    ctx.lineTo(64, 64);
    ctx.stroke();
  } else {
    [44, 56, 68].forEach((x, i) => {
      ctx.beginPath();
      ctx.moveTo(x, 46 + i * -2);
      ctx.lineTo(x, 82 + i * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(70, 64, 16, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(70, 64, 28, -0.9, 0.9);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeElectrodeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(200, 190, 10, 256, 256, 260);
  g.addColorStop(0, "#FFFDF9");
  g.addColorStop(0.55, "#F2ECE4");
  g.addColorStop(1, "#D6CBC0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(170, 158, 146, 0.25)";
  ctx.lineWidth = 1.5;
  for (let r = 24; r < 250; r += 10) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Generates warm Parisian studio cyclorama backdrop texture for clean optical Bloom rendering.
 */
function makeStudioBackdropTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  const lin = ctx.createLinearGradient(0, 0, 512, 512);
  lin.addColorStop(0, "#F8F0E7");
  lin.addColorStop(0.55, "#F1E2D3");
  lin.addColorStop(1, "#E5CFBC");
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, 512, 512);

  const rad = ctx.createRadialGradient(235, 225, 24, 256, 256, 330);
  rad.addColorStop(0, "rgba(255,252,248,0.68)");
  rad.addColorStop(0.5, "rgba(248,236,225,0.14)");
  rad.addColorStop(1, "rgba(176,136,108,0.22)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Wet anatomical muscle albedo + tangent-space normal maps (striated myofibrils + fascia).
 */
function makeMuscleMaps() {
  const w = 512;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  const nc = document.createElement("canvas");
  nc.width = w;
  nc.height = h;
  const nCtx = nc.getContext("2d")!;

  ctx.fillStyle = "#9C463C";
  ctx.fillRect(0, 0, w, h);

  nCtx.fillStyle = "rgb(128,128,255)";
  nCtx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 3) {
    const wave = Math.sin(y * 0.28);
    const isFascia = y % 21 === 0;
    if (isFascia) {
      ctx.fillStyle = "rgba(255,222,208,0.34)";
      ctx.fillRect(0, y, w, 2);
      nCtx.fillStyle = "rgb(128,175,245)";
      nCtx.fillRect(0, y, w, 1);
      nCtx.fillStyle = "rgb(128,82,245)";
      nCtx.fillRect(0, y + 1, w, 1);
    } else {
      ctx.fillStyle =
        wave > 0
          ? `rgba(218,122,106,${0.18 + wave * 0.14})`
          : `rgba(82,24,22,${0.2 + Math.abs(wave) * 0.16})`;
      ctx.fillRect(0, y, w, 2);
      const ny = Math.round(128 + wave * 42);
      nCtx.fillStyle = `rgb(128,${ny},248)`;
      nCtx.fillRect(0, y, w, 2);
    }
  }

  for (let x = 0; x < w; x += 14) {
    ctx.fillStyle = "rgba(255,232,220,0.06)";
    ctx.fillRect(x, 0, 3, h);
    nCtx.fillStyle = "rgba(155,128,250,0.22)";
    nCtx.fillRect(x, 0, 2, h);
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2.8, 1);

  const normalMap = new THREE.CanvasTexture(nc);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2.8, 1);

  return { map, normalMap };
}

function makeBeamTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0.96)");
  g.addColorStop(0.25, "rgba(255,255,255,0.72)");
  g.addColorStop(0.68, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSoftPenetrationTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 30, 8, 128, 118, 126);
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

function papillaWave(x: number) {
  return 0.08 + Math.sin(x * 7.2) * 0.048 + Math.cos(x * 13.5) * 0.015;
}

export function SkinAction3D({ activeMode, onSelectMode }: Props) {
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

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    Object.assign(renderer.domElement.style, {
      display: "block",
      width: "100%",
      height: "100%",
    });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const studioBgTex = makeStudioBackdropTexture();
    scene.background = studioBgTex;

    const pmrem = new THREE.PMREMGenerator(renderer);
    let envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.56;

    const texLoader = new THREE.TextureLoader();
    let spaEnvSource: THREE.Texture | null = null;
    let disposed = false;
    texLoader.load("/images/spa-institut-bg.jpg", (loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      loaded.mapping = THREE.EquirectangularReflectionMapping;
      loaded.colorSpace = THREE.SRGBColorSpace;
      spaEnvSource = loaded;
      const nextEnv = pmrem.fromEquirectangular(loaded).texture;
      envTex.dispose();
      envTex = nextEnv;
      scene.environment = envTex;
      scene.environmentIntensity = 0.78;
    });

    // Real Photographic Human Bare-Skin PBR Maps
    const skinAlbedo = texLoader.load("/images/skin-macro-albedo.jpg");
    skinAlbedo.colorSpace = THREE.SRGBColorSpace;
    skinAlbedo.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const skinNormal = texLoader.load("/images/skin-macro-normal.jpg");
    skinNormal.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const skinRoughness = texLoader.load("/images/skin-macro-roughness.jpg");

    // Framed so the FULL authentic LumiaSculpt™ M8807 wand + entire 3D skin slab fit cleanly!
    const camera = new THREE.PerspectiveCamera(29, 1.38, 0.1, 60);
    camera.position.set(0.55, 2.8, 7.65);
    camera.lookAt(0.08, 0.04, 0);

    // Optical Camera Post-Processing Pipeline (selective Bloom)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth || 640, mount.clientHeight || 470),
      0.24,
      0.5,
      0.92
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // Cinematic Studio Lighting + Soft PCF Cast Shadows
    scene.add(new THREE.HemisphereLight(0xfff7f0, 0xc89a84, 0.48));

    const keyLight = new THREE.DirectionalLight(0xfff7ee, 1.85);
    keyLight.position.set(-4.8, 5.6, 3.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 18.0;
    keyLight.shadow.camera.left = -4.2;
    keyLight.shadow.camera.right = 4.2;
    keyLight.shadow.camera.top = 4.0;
    keyLight.shadow.camera.bottom = -3.0;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.022;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffdfc8, 1.15);
    rimLight.position.set(5.4, 3.0, -3.8);
    scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight(0xf6dfd2, 0.5);
    frontFill.position.set(1.2, 1.2, 5.8);
    scene.add(frontFill);

    const root = new THREE.Group();
    root.rotation.y = -0.2;
    root.rotation.x = 0.04;
    scene.add(root);

    // Procedural Textures
    const { map: muscleMap, normalMap: muscleNormal } = makeMuscleMaps();
    const beamTex = makeBeamTexture();
    const softPenTex = makeSoftPenetrationTexture();
    const glowTex = makeRadialGlowTexture(0.95, 0.45, "255,255,255");
    const shadowTex = makeRadialGlowTexture(0.4, 0.44, "72,42,30");
    const particleTex = makeRadialGlowTexture(1, 0.36, "255,255,255");
    const electrodeTex = makeElectrodeTexture();
    const vibIconTex = makeButtonIconTexture("vib");
    const pwrIconTex = makeButtonIconTexture("power");

    // Soft floating contact shadow under skin block
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.3, 3.6),
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
    // LAYER 1: PHOTOREALISTIC ÉPIDERME (Real Macro Skin Photo PBR)
    // =========================================================================
    const epiGeo = new THREE.PlaneGeometry(W, D, 84, 48);
    epiGeo.rotateX(-Math.PI / 2);
    const epiBaseY = new Float32Array(epiGeo.attributes.position.count);
    const epiWrinkleDepth = new Float32Array(epiGeo.attributes.position.count);

    for (let i = 0; i < epiGeo.attributes.position.count; i++) {
      const vx = epiGeo.attributes.position.getX(i);
      const vz = epiGeo.attributes.position.getZ(i);
      const edgeSoft =
        Math.cos((vx / halfW) * (Math.PI * 0.42)) *
        Math.cos((vz / halfD) * (Math.PI * 0.42));
      const dome = 0.065 * edgeSoft;

      const g1 = Math.exp(-Math.pow((vx + 0.92 + Math.sin(vz * 1.4) * 0.13) * 4.8, 2));
      const g2 = Math.exp(-Math.pow((vx - 0.06 + Math.sin(vz * 1.6 + 0.5) * 0.14) * 5.0, 2));
      const g3 = Math.exp(-Math.pow((vx - 0.98 + Math.cos(vz * 1.3) * 0.12) * 4.8, 2));
      const microLine = (g1 + g2 + g3) * 0.056;

      epiBaseY[i] = dome;
      epiWrinkleDepth[i] = microLine;
      epiGeo.attributes.position.setY(i, dome - microLine);
    }
    epiGeo.computeVertexNormals();

    const epiMat = new THREE.MeshPhysicalMaterial({
      map: skinAlbedo,
      normalMap: skinNormal,
      normalScale: new THREE.Vector2(0.92, 0.92),
      roughnessMap: skinRoughness,
      roughness: 0.72,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.34,
      sheen: 0.72,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color(0xffe6d4),
      side: THREE.DoubleSide,
    });
    const epiMesh = new THREE.Mesh(epiGeo, epiMat);
    epiMesh.position.y = 0.4;
    epiMesh.receiveShadow = true;
    epiMesh.castShadow = true;
    root.add(epiMesh);

    const epiShape = new THREE.Shape();
    epiShape.moveTo(-halfW, 0.39);
    epiShape.lineTo(halfW, 0.39);
    epiShape.lineTo(halfW, papillaWave(halfW));
    const papillaSteps = 72;
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
      color: 0xdda889,
      roughness: 0.28,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
      transparent: true,
      opacity: 0.54,
      depthWrite: false,
    });
    root.add(new THREE.Mesh(epiBodyGeo, epiBodyMat));

    const bmPoints: THREE.Vector3[] = [];
    for (let s = 0; s <= papillaSteps; s++) {
      const x = -halfW + (s / papillaSteps) * W;
      bmPoints.push(new THREE.Vector3(x, papillaWave(x), halfD + 0.012));
    }
    const bmRibbon = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bmPoints), 96, 0.019, 10, false),
      new THREE.MeshPhysicalMaterial({
        color: 0xc27058,
        emissive: new THREE.Color(0xa6503c),
        emissiveIntensity: 0.18,
        roughness: 0.22,
        clearcoat: 0.75,
      })
    );
    bmRibbon.castShadow = true;
    root.add(bmRibbon);

    // Smooth Organic 3D Keratinocyte Cellular Strata
    const kCount = 132;
    const kGeo = new THREE.SphereGeometry(0.05, 16, 12);
    const kMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x1d68d4),
      emissiveIntensity: 0.05,
      roughness: 0.24,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xffe9da),
    });
    const keratinocytes = new THREE.InstancedMesh(kGeo, kMat, kCount);
    keratinocytes.castShadow = true;
    keratinocytes.receiveShadow = true;

    const kData: { x: number; y: number; z: number; sx: number; sy: number; phase: number }[] = [];
    const dummy = new THREE.Object3D();
    const cellColor = new THREE.Color();
    let cSeed = 7;
    const cRand = () => {
      cSeed = (cSeed * 16807) % 2147483647;
      return (cSeed - 1) / 2147483646;
    };
    for (let i = 0; i < kCount; i++) {
      const row = i % 3;
      const col = Math.floor(i / 3);
      const frac = (col + (row % 2) * 0.48) / Math.ceil(kCount / 3);
      const x = -halfW + 0.12 + frac * (W - 0.24) + (cRand() - 0.5) * 0.025;
      const baseP = papillaWave(x);
      const y = baseP + 0.044 + row * 0.084 + (cRand() - 0.5) * 0.012;
      const z = halfD - 0.038 - (row === 1 ? 0.02 : 0) + (cRand() - 0.5) * 0.015;
      const sx = (1.2 - row * 0.08) * (0.9 + cRand() * 0.22);
      const sy = (0.64 + (2 - row) * 0.11) * (0.9 + cRand() * 0.2);
      kData.push({ x, y, z, sx, sy, phase: i * 0.43 });
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, (cRand() - 0.5) * 0.25);
      dummy.scale.set(sx, sy, 0.72);
      dummy.updateMatrix();
      keratinocytes.setMatrixAt(i, dummy.matrix);

      const h = 0.052 + (cRand() - 0.5) * 0.014;
      const s = 0.46 - row * 0.06 + (cRand() - 0.5) * 0.06;
      const l = 0.72 + row * 0.05 + (cRand() - 0.5) * 0.05;
      cellColor.setHSL(h, s, l);
      keratinocytes.setColorAt(i, cellColor);
    }
    keratinocytes.instanceMatrix.needsUpdate = true;
    if (keratinocytes.instanceColor) keratinocytes.instanceColor.needsUpdate = true;
    root.add(keratinocytes);

    const surfacePoolMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.62,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const surfacePool = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.15), surfacePoolMat);
    surfacePool.rotation.x = -Math.PI / 2;
    surfacePool.position.y = 0.474;
    surfacePool.renderOrder = 6;
    root.add(surfacePool);

    // =========================================================================
    // LAYER 2: WET TRANSLUCENT DERME, COLLAGÈNE / ÉLASTINE & FIBROBLASTES
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
    root.add(
      new THREE.Mesh(
        dermisBodyGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xd48674,
          roughness: 0.14,
          ior: 1.38,
          clearcoat: 0.85,
          clearcoatRoughness: 0.12,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        })
      )
    );

    const subsurfaceLight = new THREE.PointLight(MODE_CONFIG[0].sssColor, 4.2, 4.2, 1.6);
    subsurfaceLight.position.set(0, -0.18, 0.75);
    root.add(subsurfaceLight);

    const cutawayGlowMat = new THREE.MeshBasicMaterial({
      map: softPenTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cutawayGlowGeo = new THREE.PlaneGeometry(2.35, 1.78);
    cutawayGlowGeo.translate(0, -0.89, 0);
    const cutawayGlow = new THREE.Mesh(cutawayGlowGeo, cutawayGlowMat);
    cutawayGlow.position.set(0, 0.42, halfD + 0.022);
    cutawayGlow.renderOrder = 9;
    root.add(cutawayGlow);

    const collagenMat = new THREE.MeshPhysicalMaterial({
      color: 0xd67e6a,
      emissive: new THREE.Color(0xd61f42),
      emissiveIntensity: 0.36,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    });
    const elastinMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6ad87,
      emissive: new THREE.Color(0xd61f42),
      emissiveIntensity: 0.2,
      roughness: 0.22,
      metalness: 0.14,
      clearcoat: 0.75,
    });

    const collagenGroup = new THREE.Group();
    collagenGroup.position.y = -0.28;
    root.add(collagenGroup);

    const fibroblastPositions: THREE.Vector3[] = [];
    for (let row = 0; row < 6; row++) {
      const z = -0.9 + row * 0.36;
      const pts: THREE.Vector3[] = [];
      for (let step = 0; step <= 18; step++) {
        const x = -halfW + 0.14 + (step / 18) * (W - 0.28);
        const y = Math.sin(step * 0.78 + row * 1.35) * 0.19;
        const zz = z + Math.cos(step * 0.68 + row) * 0.085;
        pts.push(new THREE.Vector3(x, y, zz));
        if (step > 1 && step < 17 && step % 3 === 0) {
          fibroblastPositions.push(new THREE.Vector3(x, y - 0.28, zz));
        }
      }
      const radius = row % 2 === 0 ? 0.031 : 0.023;
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 72, radius, 12, false),
        collagenMat
      );
      tube.castShadow = true;
      tube.receiveShadow = true;
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
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.016, 8, false),
        elastinMat
      );
      tube.castShadow = true;
      collagenGroup.add(tube);
    }

    const hydroCount = 58;
    const hydroGlobules = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.034, 14, 12),
      new THREE.MeshPhysicalMaterial({
        color: 0xfff4ec,
        roughness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transparent: true,
        opacity: 0.52,
      }),
      hydroCount
    );
    const hydroData: { x: number; y: number; z: number; s: number; p: number }[] = [];
    for (let i = 0; i < hydroCount; i++) {
      const hx = (cRand() - 0.5) * (W - 0.45);
      const hy = -0.56 + cRand() * 0.56;
      const hz = (cRand() - 0.5) * (D - 0.4);
      const hs = 0.55 + cRand() * 0.95;
      hydroData.push({ x: hx, y: hy, z: hz, s: hs, p: cRand() * Math.PI * 2 });
      dummy.position.set(hx, hy, hz);
      dummy.scale.setScalar(hs);
      dummy.updateMatrix();
      hydroGlobules.setMatrixAt(i, dummy.matrix);
    }
    hydroGlobules.instanceMatrix.needsUpdate = true;
    root.add(hydroGlobules);

    const fibroMat = new THREE.MeshStandardMaterial({
      color: 0xffd2c7,
      emissive: new THREE.Color(0xff385c),
      emissiveIntensity: 0.95,
      roughness: 0.18,
      toneMapped: false,
    });
    const fibroblasts = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.048, 14, 12),
      fibroMat,
      fibroblastPositions.length
    );
    fibroblastPositions.forEach((p, idx) => {
      dummy.position.copy(p);
      dummy.scale.set(1.3, 0.75, 0.92);
      dummy.updateMatrix();
      fibroblasts.setMatrixAt(idx, dummy.matrix);
    });
    fibroblasts.instanceMatrix.needsUpdate = true;
    root.add(fibroblasts);

    const vesselCurves: THREE.CatmullRomCurve3[] = [];
    const vesselMat = new THREE.MeshPhysicalMaterial({
      color: 0x9cd2bc,
      emissive: new THREE.Color(0x0f8a5a),
      emissiveIntensity: 0.14,
      roughness: 0.18,
      clearcoat: 0.85,
      transparent: true,
      opacity: 0.54,
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
      root.add(new THREE.Mesh(new THREE.TubeGeometry(vc, 56, 0.028, 10, false), vesselMat));
    }

    const flowCount = 52;
    const flowMat = new THREE.MeshStandardMaterial({
      color: 0xd2ffe9,
      emissive: new THREE.Color(0x18c47e),
      emissiveIntensity: 1.1,
      roughness: 0.15,
      toneMapped: false,
    });
    const flowDroplets = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.036, 12, 10),
      flowMat,
      flowCount
    );
    root.add(flowDroplets);

    // =========================================================================
    // LAYER 3: WET STRIATED ANATOMICAL MUSCLES & EMS PULSES
    // =========================================================================
    const muscleGroup = new THREE.Group();
    muscleGroup.position.y = -0.94;
    root.add(muscleGroup);

    const muscleMat = new THREE.MeshPhysicalMaterial({
      map: muscleMap,
      normalMap: muscleNormal,
      normalScale: new THREE.Vector2(1.15, 1.15),
      color: 0xb65d50,
      emissive: new THREE.Color(0xd96614),
      emissiveIntensity: 0.04,
      roughness: 0.34,
      clearcoat: 0.68,
      clearcoatRoughness: 0.2,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xffcdb8),
    });

    const muscleBundles: THREE.Mesh[] = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 9; c++) {
        const bz = -halfD + 0.18 + (c / 8) * (D - 0.36);
        const by = r === 0 ? 0.11 : -0.11;
        const pts = [
          new THREE.Vector3(-halfW + 0.05, by, bz),
          new THREE.Vector3(-halfW * 0.35, by + 0.035, bz + Math.sin(c) * 0.025),
          new THREE.Vector3(halfW * 0.35, by - 0.025, bz - Math.sin(c) * 0.025),
          new THREE.Vector3(halfW - 0.05, by, bz),
        ];
        const mMesh = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 44, 0.135, 16, false),
          muscleMat
        );
        mMesh.scale.y = 0.85;
        mMesh.castShadow = true;
        mMesh.receiveShadow = true;
        muscleGroup.add(mMesh);
        muscleBundles.push(mMesh);
      }
    }

    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.04, 0.075, D + 0.04),
      new THREE.MeshPhysicalMaterial({
        color: 0xc9a38c,
        roughness: 0.32,
        metalness: 0.18,
      })
    );
    basePlinth.position.y = -1.21;
    basePlinth.receiveShadow = true;
    root.add(basePlinth);

    const emsPulseCount = 42;
    const emsPulseMat = new THREE.MeshStandardMaterial({
      color: 0xffe8a8,
      emissive: new THREE.Color(0xff9224),
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0,
      roughness: 0.12,
      toneMapped: false,
    });
    const emsPulses = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.036, 12, 10),
      emsPulseMat,
      emsPulseCount
    );
    emsPulses.renderOrder = 10;
    root.add(emsPulses);

    // =========================================================================
    // EXACT LUMIASCULPT™ M8807 3D PRODUCT MODEL (IDENTICAL TO HEADER HERO 3D!)
    // =========================================================================
    // wandAnchor sits at the skin-contact point beneath the treatment head
    const wandAnchor = new THREE.Group();
    wandAnchor.position.set(0, 0.56, 0);
    root.add(wandAnchor);

    // Tilt & orient the authentic M8807 wand so its chrome treatment head faces DOWN onto the skin
    // while the FULL pearl-white handle, live black OLED display & 2 chrome buttons are visible in-frame!
    const wandRig = new THREE.Group();
    wandRig.scale.setScalar(0.64);
    wandRig.rotation.order = "YXZ";
    wandRig.rotation.x = Math.PI / 2 + 0.54; // ~121° so handle stays cleanly inside frame with zero top clipping
    wandRig.rotation.y = 1.92; // 3/4 forward-left showcase showing OLED panel + 2 chrome buttons + chrome head!
    wandAnchor.add(wandRig);

    // Offset so the treatment head contact face (0, 1.0, 0.831) sits right at wandRig origin (0, 0, 0)
    const deviceModel = new THREE.Group();
    deviceModel.position.set(0, -1.0, -0.831);
    wandRig.add(deviceModel);

    // Exact Hero Materials
    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4ece2,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xffe0be),
    });
    const chromeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2eae0,
      metalness: 0.96,
      roughness: 0.09,
      clearcoat: 0.5,
    });
    const satinMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbc0,
      metalness: 0.85,
      roughness: 0.26,
    });
    const cottonRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f1e7,
      roughness: 0.16,
      transmission: 0.48,
      thickness: 0.12,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
    });
    const electrodeMat = new THREE.MeshPhysicalMaterial({
      map: electrodeTex,
      color: 0xf1eae1,
      metalness: 0.45,
      roughness: 0.22,
      clearcoat: 0.6,
      emissive: new THREE.Color(0xff7a1a),
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: MODE_CONFIG[0].color,
      emissive: new THREE.Color(MODE_CONFIG[0].color),
      emissiveIntensity: 2.2,
      roughness: 0.28,
      toneMapped: false,
    });
    const ledDotMat = new THREE.MeshBasicMaterial({ color: 0xfff8f0, toneMapped: false });

    // 1. Sculpted oval pearl-white body
    const bodyGroup = new THREE.Group();
    bodyGroup.scale.z = Z_SCALE;
    deviceModel.add(bodyGroup);

    const handleMesh = new THREE.Mesh(
      new THREE.LatheGeometry(buildHandleProfile(H_BOTTOM, H_TOP, 0, 140), 96),
      whiteMat
    );
    handleMesh.castShadow = true;
    bodyGroup.add(handleMesh);

    // 2. Curved black gloss OLED status panel (live-updated to active mode!)
    const panelCanvas = document.createElement("canvas");
    panelCanvas.width = 512;
    panelCanvas.height = 1536;
    const panelCtx = panelCanvas.getContext("2d")!;
    drawDevicePanel(panelCtx, MODE_CONFIG[0].panelKey, MODE_CONFIG[0].css);
    const panelTex = new THREE.CanvasTexture(panelCanvas);
    panelTex.colorSpace = THREE.SRGBColorSpace;
    panelTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const panelMesh = new THREE.Mesh(
      new THREE.LatheGeometry(
        buildHandleProfile(PANEL_Y0, PANEL_Y1, 0.004, 100),
        72,
        -PANEL_PHI / 2,
        PANEL_PHI
      ),
      new THREE.MeshPhysicalMaterial({
        map: panelTex,
        transparent: true,
        roughness: 0.05,
        metalness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
      })
    );
    bodyGroup.add(panelMesh);

    // 3. Chrome side accent strips & USB-C rim
    const stripRight = new THREE.Mesh(
      new THREE.LatheGeometry(buildHandleProfile(-1.35, 0.85, 0.004, 80), 8, 1.38, 0.11),
      chromeMat
    );
    const stripLeft = new THREE.Mesh(
      new THREE.LatheGeometry(buildHandleProfile(-1.35, 0.85, 0.004, 80), 8, -1.49, 0.11),
      chromeMat
    );
    bodyGroup.add(stripRight, stripLeft);

    const usbRim = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.085, 24), chromeMat);
    usbRim.rotation.x = Math.PI / 2;
    usbRim.position.set(0, H_BOTTOM + 0.01, 0);
    deviceModel.add(usbRim);

    // 4. Two metallic chrome buttons (vibration & power)
    const btnGeo = new THREE.CylinderGeometry(0.102, 0.108, 0.052, 48);
    const btnFaceGeo = new THREE.CircleGeometry(0.09, 48);
    (
      [
        [-0.62, vibIconTex],
        [-0.95, pwrIconTex],
      ] as const
    ).forEach(([y, tex]) => {
      const zFront = handleRadius(y) * Z_SCALE;
      const btn = new THREE.Group();
      btn.position.set(0, y, zFront + 0.005);
      const ring = new THREE.Mesh(btnGeo, chromeMat);
      ring.rotation.x = Math.PI / 2;
      btn.add(ring);
      const face = new THREE.Mesh(
        btnFaceGeo,
        new THREE.MeshStandardMaterial({
          map: tex,
          metalness: 0.72,
          roughness: 0.24,
          color: 0xffffff,
        })
      );
      face.position.z = 0.027;
      btn.add(face);
      deviceModel.add(btn);
    });

    // 5. Iconic Flared Chrome Treatment Head + 8 LEDs + Brushed Thermal Electrode + Magnetic Ring
    const heroHead = new THREE.Group();
    heroHead.position.set(0, 1.0, 0);
    deviceModel.add(heroHead);

    const headProfile = [
      [0.0, 0.18],
      [0.26, 0.18],
      [0.27, 0.22],
      [0.27, 0.5],
      [0.31, 0.55],
      [0.46, 0.64],
      [0.6, 0.7],
      [0.645, 0.735],
      [0.655, 0.775],
      [0.64, 0.805],
      [0.575, 0.815],
      [0.555, 0.812],
    ].map(([r, z]) => new THREE.Vector2(r, z));
    const headGeo = new THREE.LatheGeometry(headProfile, 110);
    headGeo.rotateX(Math.PI / 2);
    const headMesh = new THREE.Mesh(headGeo, chromeMat);
    headMesh.castShadow = true;
    heroHead.add(headMesh);

    const backCap = new THREE.Mesh(new THREE.CircleGeometry(0.56, 72), chromeMat);
    backCap.position.z = 0.79;
    heroHead.add(backCap);

    const stepRing = new THREE.Mesh(new THREE.RingGeometry(0.53, 0.556, 96), satinMat);
    stepRing.position.z = 0.811;
    heroHead.add(stepRing);

    const ledBand = new THREE.Mesh(new THREE.RingGeometry(0.37, 0.53, 96), ledMat);
    ledBand.position.z = 0.806;
    heroHead.add(ledBand);

    const dotGeo = new THREE.CircleGeometry(0.018, 12);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const d = new THREE.Mesh(dotGeo, ledDotMat);
      d.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.808);
      heroHead.add(d);
    }

    const centerCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.368, 0.368, 0.045, 72),
      electrodeMat
    );
    centerCyl.rotation.x = Math.PI / 2;
    centerCyl.position.z = 0.808;
    heroHead.add(centerCyl);

    const innerBezel = new THREE.Mesh(new THREE.RingGeometry(0.355, 0.376, 96), chromeMat);
    innerBezel.position.z = 0.831;
    heroHead.add(innerBezel);

    const cottonClip = new THREE.Mesh(
      new THREE.TorusGeometry(0.605, 0.032, 24, 96),
      cottonRingMat
    );
    cottonClip.position.z = 0.815;
    heroHead.add(cottonClip);

    // Dual-Layer Volumetric Penetrating Light Cone descending straight from the contact face
    const outerBeamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.46,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerBeamGeo = new THREE.CylinderGeometry(0.38, 1.04, 1.5, 48, 1, true);
    outerBeamGeo.translate(0, -0.75, 0);
    const outerBeam = new THREE.Mesh(outerBeamGeo, outerBeamMat);
    outerBeam.position.y = -0.02;
    outerBeam.renderOrder = 7;
    wandAnchor.add(outerBeam);

    const innerBeamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      color: MODE_CONFIG[0].glowColor,
      transparent: true,
      opacity: 0.56,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const innerBeamGeo = new THREE.CylinderGeometry(0.22, 0.54, 1.5, 36, 1, true);
    innerBeamGeo.translate(0, -0.75, 0);
    const innerBeam = new THREE.Mesh(innerBeamGeo, innerBeamMat);
    innerBeam.position.y = -0.02;
    innerBeam.renderOrder = 8;
    wandAnchor.add(innerBeam);

    const headLight = new THREE.PointLight(MODE_CONFIG[0].color, 5.2, 5.2, 1.6);
    headLight.position.set(0, -0.14, 0.14);
    wandAnchor.add(headLight);

    // Expanding surface sonic / EMS rings on the epidermis
    const ringGeo = new THREE.RingGeometry(0.32, 0.37, 64);
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
    const pCount = 80;
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
      size: 0.14,
      map: particleTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.85,
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
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
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
    const curSss = new THREE.Color(MODE_CONFIG[0].sssColor);
    const tgtColor = new THREE.Color();
    const tgtGlow = new THREE.Color();
    const tgtSss = new THREE.Color();
    const tempPt = new THREE.Vector3();
    let elapsed = 0;
    let currentDepth = 1.0;
    let lastDrawnMode: SynergyModeId = 0;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!rendered || !pageVisible) return;
      elapsed += dt;
      const t = elapsed;

      const mode = modeRef.current;
      const cfg = MODE_CONFIG[mode];

      // Update live OLED screen on the 3D LumiaSculpt™ handle whenever activeMode changes!
      if (mode !== lastDrawnMode) {
        lastDrawnMode = mode;
        drawDevicePanel(panelCtx, cfg.panelKey, cfg.css);
        panelTex.needsUpdate = true;
      }

      tgtColor.setHex(cfg.color);
      tgtGlow.setHex(cfg.glowColor);
      tgtSss.setHex(cfg.sssColor);
      const lerpAlpha = 1 - Math.pow(0.02, dt);
      curColor.lerp(tgtColor, lerpAlpha);
      curGlow.lerp(tgtGlow, lerpAlpha);
      curSss.lerp(tgtSss, lerpAlpha);

      const pulse = 0.86 + 0.14 * Math.sin(t * 4.8);

      ledMat.color.copy(curColor);
      ledMat.emissive.copy(curColor);
      outerBeamMat.color.copy(curColor);
      innerBeamMat.color.copy(curGlow);
      surfacePoolMat.color.copy(curColor);
      cutawayGlowMat.color.copy(curColor);
      headLight.color.copy(curColor);
      subsurfaceLight.color.copy(curSss);
      pMat.color.copy(curColor);

      // Smooth figure-8 massage glide of the authentic LumiaSculpt™ M8807 wand
      const glideX = Math.sin(t * 0.72) * 1.15;
      const glideZ = Math.sin(t * 1.44) * 0.22;
      const sonicJitter = mode === 1 ? Math.sin(t * 72) * 0.009 : 0;

      wandAnchor.position.x = glideX + sonicJitter;
      wandAnchor.position.z = glideZ;
      wandAnchor.position.y = 0.57 + Math.sin(t * 1.44) * 0.02;
      wandRig.rotation.z = -Math.cos(t * 0.72) * 0.07;

      subsurfaceLight.position.set(
        glideX,
        mode === 2 ? 0.18 : mode === 3 ? -0.52 : -0.2,
        Math.min(halfD - 0.1, glideZ + 0.65)
      );
      subsurfaceLight.intensity = (mode === 2 ? 3.8 : 4.8) * pulse;

      surfacePool.position.x = glideX;
      surfacePool.position.z = glideZ;
      surfacePoolMat.opacity = (mode === 2 ? 0.68 : 0.56) * pulse;
      surfacePool.scale.setScalar(0.96 + 0.08 * pulse);

      const targetScaleY = cfg.beamDepth / 1.5;
      currentDepth += (targetScaleY - currentDepth) * Math.min(1, dt * 4.5);
      const radScale = cfg.beamRadius / 0.96;

      outerBeam.scale.set(radScale, currentDepth, radScale);
      innerBeam.scale.set(radScale * 0.92, currentDepth * 0.94, radScale * 0.92);
      outerBeamMat.opacity = (mode === 2 ? 0.4 : 0.48) * pulse;
      innerBeamMat.opacity = (mode === 2 ? 0.48 : 0.58) * pulse;

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
            ? 0.085 * influence * (0.75 + 0.25 * Math.sin(t * 4.4))
            : mode === 0
              ? 0.072 * influence
              : 0.032 * influence;

        const sonicRipple =
          mode === 1 ? Math.sin(dist * 11 - t * 11) * 0.02 * Math.exp(-dist * 0.72) : 0;

        posAttr.setY(i, epiBaseY[i] - remainingWrinkle + lift + sonicRipple);
      }
      posAttr.needsUpdate = true;
      epiGeo.computeVertexNormals();

      // Keratinocytes
      const kEmissiveTarget = mode === 2 ? 0.75 * pulse : 0.06;
      kMat.emissive.copy(curColor);
      kMat.emissiveIntensity += (kEmissiveTarget - kMat.emissiveIntensity) * Math.min(1, dt * 4);
      for (let i = 0; i < kCount; i++) {
        const kd = kData[i];
        const distX = Math.abs(kd.x - glideX);
        const boost = Math.exp(-distX * distX * 1.4);
        const breathe = 1 + 0.05 * Math.sin(t * 3 + kd.phase) + boost * (mode === 2 ? 0.14 : 0.05);
        dummy.position.set(kd.x, kd.y + boost * 0.024, kd.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(kd.sx * breathe, kd.sy * breathe, 0.74);
        dummy.updateMatrix();
        keratinocytes.setMatrixAt(i, dummy.matrix);
      }
      keratinocytes.instanceMatrix.needsUpdate = true;

      // Hyaluronic micro-globules
      for (let i = 0; i < hydroCount; i++) {
        const hd = hydroData[i];
        dummy.position.set(
          hd.x + Math.sin(t * 0.8 + hd.p) * 0.03,
          hd.y + Math.cos(t * 1.1 + hd.p) * 0.025,
          hd.z
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(hd.s);
        dummy.updateMatrix();
        hydroGlobules.setMatrixAt(i, dummy.matrix);
      }
      hydroGlobules.instanceMatrix.needsUpdate = true;

      // 2. DERMIS: COLLAGEN + FIBROBLASTS
      const colTarget = mode === 0 ? 1.15 * pulse : 0.1;
      collagenMat.emissive.copy(curColor);
      collagenMat.emissiveIntensity +=
        (colTarget - collagenMat.emissiveIntensity) * Math.min(1, dt * 4);
      elastinMat.emissive.copy(curGlow);
      elastinMat.emissiveIntensity +=
        ((mode === 0 ? 0.75 * pulse : 0.06) - elastinMat.emissiveIntensity) * Math.min(1, dt * 4);
      collagenGroup.scale.y = mode === 0 ? 0.94 + 0.07 * Math.sin(t * 2.6) : 1;

      fibroMat.emissive.copy(curGlow);
      const fibroTarget = mode === 0 ? 1.6 * pulse : 0.22;
      fibroMat.emissiveIntensity += (fibroTarget - fibroMat.emissiveIntensity) * Math.min(1, dt * 4);
      for (let i = 0; i < fibroblastPositions.length; i++) {
        const fp = fibroblastPositions[i];
        const dist = Math.hypot(fp.x - glideX, fp.z - glideZ);
        const glowScale = 1 + (mode === 0 ? 0.48 : 0.1) * Math.exp(-dist * dist * 1.1) * pulse;
        dummy.position.set(fp.x, fp.y + (mode === 0 ? Math.sin(t * 2.6 + i) * 0.02 : 0), fp.z);
        dummy.rotation.set(0, i * 0.5, 0);
        dummy.scale.set(1.28 * glowScale, 0.78 * glowScale, 0.92 * glowScale);
        dummy.updateMatrix();
        fibroblasts.setMatrixAt(i, dummy.matrix);
      }
      fibroblasts.instanceMatrix.needsUpdate = true;

      // 3. LYMPHATIC DRAINAGE FLOW
      const vesselEmissive = mode === 1 ? 0.8 * pulse : 0.05;
      vesselMat.emissiveIntensity +=
        (vesselEmissive - vesselMat.emissiveIntensity) * Math.min(1, dt * 4);
      flowMat.emissive.copy(mode === 1 ? curGlow : curColor);
      flowMat.emissiveIntensity +=
        ((mode === 1 ? 1.55 : 0.22) - flowMat.emissiveIntensity) * Math.min(1, dt * 4);
      const flowSpeed = mode === 1 ? 0.28 : 0.08;
      for (let i = 0; i < flowCount; i++) {
        const curveIdx = i % vesselCurves.length;
        const u = (t * flowSpeed + i / flowCount) % 1;
        vesselCurves[curveIdx].getPointAt(u, tempPt);
        dummy.position.copy(tempPt);
        dummy.rotation.set(0, 0, 0);
        const s = mode === 1 ? 1.22 + 0.26 * Math.sin(t * 8 + i) : 0.56;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        flowDroplets.setMatrixAt(i, dummy.matrix);
      }
      flowDroplets.instanceMatrix.needsUpdate = true;

      // 4. DEEP MUSCLES & EMS PULSES
      const emsWave = Math.sin(t * 4.4);
      const muscTarget = mode === 3 ? 0.65 * (0.55 + 0.45 * emsWave) : 0.03;
      muscleMat.emissiveIntensity +=
        (muscTarget - muscleMat.emissiveIntensity) * Math.min(1, dt * 4);
      electrodeMat.emissiveIntensity +=
        ((mode === 3 ? 1.55 : 0) - electrodeMat.emissiveIntensity) * Math.min(1, dt * 4);

      muscleBundles.forEach((bundle, idx) => {
        const wave = mode === 3 ? Math.sin(t * 4.4 - idx * 0.35) : 0;
        bundle.scale.y = mode === 3 ? 0.85 + 0.16 * wave : 0.85;
        bundle.position.y = mode === 3 ? 0.045 * wave : 0;
      });

      const emsTargetOp = mode === 3 ? 0.94 : 0;
      emsPulseMat.opacity += (emsTargetOp - emsPulseMat.opacity) * Math.min(1, dt * 7);
      if (emsPulseMat.opacity > 0.02) {
        const channels = 6;
        const perChannel = emsPulseCount / channels;
        for (let i = 0; i < emsPulseCount; i++) {
          const ch = i % channels;
          const idxInCh = Math.floor(i / channels);
          const f = (t * 1.15 + idxInCh / perChannel) % 1;
          const topY = wandAnchor.position.y - 0.06;
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

      pulseRings.forEach((ring, i) => {
        const p = (t * (mode === 1 ? 0.95 : 0.68) + i / pulseRings.length) % 1;
        ring.position.x = glideX;
        ring.position.z = glideZ;
        ring.scale.setScalar(0.55 + p * 2.45);
        const rm = ring.material as THREE.MeshBasicMaterial;
        rm.color.copy(curColor);
        const ringAlpha = mode === 1 ? 0.65 : mode === 3 ? 0.52 : 0.32;
        rm.opacity = (1 - p) * ringAlpha;
      });

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

      userYaw += (targetYaw - userYaw) * Math.min(1, dt * 7);
      userPitch += (targetPitch - userPitch) * Math.min(1, dt * 7);
      root.rotation.y = -0.2 + Math.sin(t * 0.32) * 0.055 + userYaw;
      root.rotation.x = 0.04 + userPitch;

      composer.render();
    };
    loop();

    return () => {
      disposed = true;
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
      studioBgTex.dispose();
      skinAlbedo.dispose();
      skinNormal.dispose();
      skinRoughness.dispose();
      muscleMap.dispose();
      muscleNormal.dispose();
      beamTex.dispose();
      softPenTex.dispose();
      glowTex.dispose();
      shadowTex.dispose();
      particleTex.dispose();
      electrodeTex.dispose();
      vibIconTex.dispose();
      pwrIconTex.dispose();
      panelTex.dispose();
      spaEnvSource?.dispose();
      envTex.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const cfg = MODE_CONFIG[activeMode];

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-[#DFCBB9] bg-[#F2E3D5] shadow-md [content-visibility:auto] [contain-intrinsic-size:auto_none_auto_475px]"
    >
      {/* Top status bar */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 z-10 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-[#1E1916] shadow-2xs backdrop-blur-md">
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
        <span className="rounded-full bg-[#1E1916]/85 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-medium text-[#FAF5EF] shadow-2xs backdrop-blur-md">
          {cfg.depthLabel}
        </span>
      </div>

      {/* Right-side live anatomical depth rail (tablet/desktop) */}
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

      {/* 3D Interactive Canvas — compact on mobile so sticky preview + 4 cards below fit together! */}
      <div
        ref={mountRef}
        className="relative h-[240px] sm:h-[320px] lg:h-[470px] w-full cursor-grab active:cursor-grabbing touch-none"
        title="Glissez pour faire pivoter la coupe 3D"
      />

      {/* Desktop Bottom Biological Legend */}
      <div className="pointer-events-none hidden lg:flex absolute bottom-3 left-3.5 right-3.5 z-10 flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-2xl border border-[#E3D1C0] bg-white/92 px-4 py-2 text-[11px] font-medium text-[#5C524B] shadow-2xs backdrop-blur-md">
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

      {/* Mobile / Tablet Direct 4-Mode Quick Switcher attached right under the 3D scene */}
      {onSelectMode && (
        <div className="lg:hidden border-t border-[#E3D1C0] bg-white/95 px-2.5 py-2 backdrop-blur-md">
          <div className="grid grid-cols-4 gap-1.5">
            {MODE_CONFIG.map((m) => {
              const selected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMode(m.id)}
                  className={`flex items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 text-[10px] sm:text-[11px] font-semibold transition ${
                    selected
                      ? "bg-[#1E1916] text-[#FAF5EF] shadow-xs"
                      : "bg-[#F6EDE4] text-[#5C524B] hover:bg-[#EFE2D5]"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: m.css }}
                  />
                  <span className="truncate">{m.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
