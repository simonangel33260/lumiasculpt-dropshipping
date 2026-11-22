"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

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
    color: 0xe6264e,
    glowColor: 0xff5478,
    sssColor: 0xff335c,
    css: "#D63354",
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
    color: 0x10b274,
    glowColor: 0x3ef0a6,
    sssColor: 0x18d489,
    css: "#129C67",
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
    color: 0x2478ff,
    glowColor: 0x62b0ff,
    sssColor: 0x388cff,
    css: "#226CE0",
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
    color: 0xf07818,
    glowColor: 0xffb347,
    sssColor: 0xff8826,
    css: "#D46514",
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
    shortName: "Épiderme",
    depth: "0,2 mm",
    detail: "Pores & kératinocytes",
    swatch: "#E4B292",
    y3d: 0.28,
  },
  {
    name: "Derme & Collagène",
    shortName: "Derme",
    depth: "1,5 mm",
    detail: "Collagène, élastine & flux",
    swatch: "#D88F7B",
    y3d: -0.26,
  },
  {
    name: "Muscles Faciaux",
    shortName: "Muscles",
    depth: "3,5 mm",
    detail: "Fibres tonifiées par EMS",
    swatch: "#A85247",
    y3d: -0.94,
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

/**
 * Draws ultra-crisp 4x Retina borderless luxury serif typography onto a transparent canvas
 * for true 3D floating spatial callout planes inside the Three.js scene (zero flat 2D boxes!).
 */
function draw3DCalloutCanvas(
  ctx: CanvasRenderingContext2D,
  opts: {
    title: string;
    metric: string;
    subtitle: string;
    accentCss: string;
    active: boolean;
    align: "left" | "right";
  }
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  const padX = 22;
  const baselineY = 108;
  const ruleY = 132;
  const subY = 178;

  // Whisper-soft ivory readability glow behind letters (zero box border!)
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255, 253, 251, 0.96)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (opts.align === "left") {
    // Title (Luxury editorial serif, sized so long French names + metric fit with generous margin)
    ctx.textAlign = "left";
    ctx.font = `${opts.active ? 700 : 600} 50px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = opts.active ? "#181312" : "#564741";
    ctx.fillText(opts.title, padX, baselineY);
    const titleW = ctx.measureText(opts.title).width;

    // Depth / Tech Accent Metric beside title
    ctx.font = `700 34px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = opts.active ? opts.accentCss : "#9B8378";
    ctx.fillText(opts.metric, padX + titleW + 20, baselineY - 3);

    // Subtle hairline champagne-gold / active rule connecting seamlessly from the 3D stem!
    ctx.shadowBlur = 0;
    const ruleGrad = ctx.createLinearGradient(0, ruleY, W * 0.88, ruleY);
    ruleGrad.addColorStop(0, opts.active ? opts.accentCss : "rgba(182, 148, 128, 0.85)");
    ruleGrad.addColorStop(0.75, opts.active ? `${opts.accentCss}66` : "rgba(182, 148, 128, 0.25)");
    ruleGrad.addColorStop(1, "rgba(182, 148, 128, 0)");
    ctx.fillStyle = ruleGrad;
    ctx.fillRect(0, ruleY, W * 0.88, opts.active ? 4 : 2.5);

    // Subtitle
    ctx.shadowColor = "rgba(255, 253, 251, 0.96)";
    ctx.shadowBlur = 14;
    ctx.font = `500 33px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = opts.active ? "#3D302C" : "#78665E";
    ctx.fillText(opts.subtitle, padX, subY);
  } else {
    // Right-aligned (for upper-left LumiaSculpt™ callout extending leftward)
    ctx.textAlign = "right";
    ctx.font = `700 56px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = "#181312";
    ctx.fillText(opts.title, W - padX, baselineY);

    ctx.shadowBlur = 0;
    const ruleGrad = ctx.createLinearGradient(W, ruleY, W * 0.12, ruleY);
    ruleGrad.addColorStop(0, opts.accentCss);
    ruleGrad.addColorStop(0.72, `${opts.accentCss}66`);
    ruleGrad.addColorStop(1, "rgba(200, 70, 90, 0)");
    ctx.fillStyle = ruleGrad;
    ctx.fillRect(W * 0.12, ruleY, W * 0.88, 4);

    ctx.shadowColor = "rgba(255, 253, 251, 0.96)";
    ctx.shadowBlur = 14;
    ctx.font = `700 36px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = opts.accentCss;
    ctx.fillText(opts.metric, W - padX, subY);
  }
  ctx.restore();
}

export function SkinAction3D({ activeMode, onSelectMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<SynergyModeId>(activeMode);
  const controlsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
  } | null>(null);

  useEffect(() => {
    modeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    const container = containerRef.current;
    const mount = mountRef.current;
    if (!container || !mount) return;

    // 100% transparent frameless alpha canvas so the 3D skin slab floats directly in relief on the page!
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
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

    const pmrem = new THREE.PMREMGenerator(renderer);
    let envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.58;

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
      scene.environmentIntensity = 0.82;
    });

    // Real Photographic Human Bare-Skin PBR Maps
    const skinAlbedo = texLoader.load("/images/skin-macro-albedo.jpg");
    skinAlbedo.colorSpace = THREE.SRGBColorSpace;
    skinAlbedo.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const skinNormal = texLoader.load("/images/skin-macro-normal.jpg");
    skinNormal.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const skinRoughness = texLoader.load("/images/skin-macro-roughness.jpg");

    const camera = new THREE.PerspectiveCamera(28, 1.38, 0.1, 60);
    camera.position.set(1.6, 2.65, 7.6);
    camera.lookAt(0, -0.05, 0);

    // Bright, fresh sunlit Parisian studio lighting + Soft PCF Cast Shadows
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffdfd0, 0.86));

    const keyLight = new THREE.DirectionalLight(0xfffaf4, 2.3);
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

    const rimLight = new THREE.DirectionalLight(0xffe6d4, 1.45);
    rimLight.position.set(5.4, 3.0, -3.8);
    scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight(0xfff0e6, 0.78);
    frontFill.position.set(1.2, 1.2, 5.8);
    scene.add(frontFill);

    const root = new THREE.Group();
    scene.add(root);

    // Procedural Textures
    const { map: muscleMap, normalMap: muscleNormal } = makeMuscleMaps();
    const beamTex = makeBeamTexture();
    const softPenTex = makeSoftPenetrationTexture();
    const glowTex = makeRadialGlowTexture(0.95, 0.45, "255,255,255");
    const shadowTex = makeRadialGlowTexture(0.46, 0.44, "68,40,28");
    const particleTex = makeRadialGlowTexture(1, 0.36, "255,255,255");
    const electrodeTex = makeElectrodeTexture();
    const vibIconTex = makeButtonIconTexture("vib");
    const pwrIconTex = makeButtonIconTexture("power");

    // Soft floating relief contact shadow melting seamlessly directly onto the page background!
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 4.1),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.36;
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
    root.add(
      new THREE.Mesh(
        epiBodyGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xdda889,
          roughness: 0.28,
          clearcoat: 0.65,
          clearcoatRoughness: 0.18,
          transparent: true,
          opacity: 0.54,
          depthWrite: false,
        })
      )
    );

    // 4-Sided Basement Membrane Ribbon
    const bmMat = new THREE.MeshPhysicalMaterial({
      color: 0xc27058,
      emissive: new THREE.Color(0xa6503c),
      emissiveIntensity: 0.18,
      roughness: 0.22,
      clearcoat: 0.75,
    });
    ([halfD + 0.012, -(halfD + 0.012)] as const).forEach((zEdge) => {
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= papillaSteps; s++) {
        const x = -halfW + (s / papillaSteps) * W;
        pts.push(new THREE.Vector3(x, papillaWave(x), zEdge));
      }
      const ribbon = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.019, 10, false),
        bmMat
      );
      ribbon.castShadow = true;
      root.add(ribbon);
    });
    ([-halfW - 0.012, halfW + 0.012] as const).forEach((xEdge) => {
      const sideY = papillaWave(xEdge > 0 ? halfW : -halfW);
      const pts = [
        new THREE.Vector3(xEdge, sideY, -halfD),
        new THREE.Vector3(xEdge, sideY, halfD),
      ];
      root.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.019, 8, false),
          bmMat
        )
      );
    });

    // Smooth Organic 3D Keratinocyte Cellular Strata around ALL 4 cutaway faces
    const kData: {
      x: number;
      y: number;
      z: number;
      sx: number;
      sy: number;
      sz: number;
      phase: number;
      h: number;
      s: number;
      l: number;
    }[] = [];
    const dummy = new THREE.Object3D();
    const cellColor = new THREE.Color();
    let cSeed = 7;
    const cRand = () => {
      cSeed = (cSeed * 16807) % 2147483647;
      return (cSeed - 1) / 2147483646;
    };

    ([1, -1] as const).forEach((zSign) => {
      const cols = 42;
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < 3; row++) {
          const frac = (col + (row % 2) * 0.48) / cols;
          const x = -halfW + 0.12 + frac * (W - 0.24) + (cRand() - 0.5) * 0.02;
          const baseP = papillaWave(x);
          const y = baseP + 0.044 + row * 0.084 + (cRand() - 0.5) * 0.012;
          const z = zSign * (halfD - 0.036 - (row === 1 ? 0.018 : 0)) + (cRand() - 0.5) * 0.012;
          kData.push({
            x,
            y,
            z,
            sx: (1.18 - row * 0.07) * (0.9 + cRand() * 0.22),
            sy: (0.64 + (2 - row) * 0.11) * (0.9 + cRand() * 0.2),
            sz: 0.72,
            phase: (col * 3 + row) * 0.41,
            h: 0.052 + (cRand() - 0.5) * 0.014,
            s: 0.46 - row * 0.06 + (cRand() - 0.5) * 0.06,
            l: 0.72 + row * 0.05 + (cRand() - 0.5) * 0.05,
          });
        }
      }
    });

    ([1, -1] as const).forEach((xSign) => {
      const cols = 22;
      const sideBaseP = papillaWave(xSign > 0 ? halfW : -halfW);
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < 3; row++) {
          const frac = (col + (row % 2) * 0.48) / cols;
          const z = -halfD + 0.12 + frac * (D - 0.24) + (cRand() - 0.5) * 0.02;
          const y = sideBaseP + 0.044 + row * 0.084 + (cRand() - 0.5) * 0.012;
          const x = xSign * (halfW - 0.036 - (row === 1 ? 0.018 : 0)) + (cRand() - 0.5) * 0.012;
          kData.push({
            x,
            y,
            z,
            sx: 0.72,
            sy: (0.64 + (2 - row) * 0.11) * (0.9 + cRand() * 0.2),
            sz: (1.18 - row * 0.07) * (0.9 + cRand() * 0.22),
            phase: (col * 3 + row) * 0.47,
            h: 0.052 + (cRand() - 0.5) * 0.014,
            s: 0.46 - row * 0.06 + (cRand() - 0.5) * 0.06,
            l: 0.72 + row * 0.05 + (cRand() - 0.5) * 0.05,
          });
        }
      }
    });

    const kCount = kData.length;
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
    const keratinocytes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 14, 10), kMat, kCount);
    keratinocytes.castShadow = true;
    keratinocytes.receiveShadow = true;
    for (let i = 0; i < kCount; i++) {
      const kd = kData[i];
      dummy.position.set(kd.x, kd.y, kd.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(kd.sx, kd.sy, kd.sz);
      dummy.updateMatrix();
      keratinocytes.setMatrixAt(i, dummy.matrix);
      cellColor.setHSL(kd.h, kd.s, kd.l);
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

    const subsurfaceLight = new THREE.PointLight(MODE_CONFIG[0].sssColor, 4.8, 4.5, 1.6);
    subsurfaceLight.position.set(0, -0.18, 0);
    root.add(subsurfaceLight);

    const cutawayGlowMat = new THREE.MeshBasicMaterial({
      map: softPenTex,
      color: MODE_CONFIG[0].color,
      transparent: true,
      opacity: 0.56,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cutawayGlowGeo = new THREE.PlaneGeometry(2.35, 1.78);
    cutawayGlowGeo.translate(0, -0.89, 0);
    const cutawayGlow = new THREE.Mesh(cutawayGlowGeo, cutawayGlowMat);
    cutawayGlow.position.set(0, 0.42, 0);
    cutawayGlow.renderOrder = 9;
    root.add(cutawayGlow);

    const collagenMat = new THREE.MeshPhysicalMaterial({
      color: 0xd67e6a,
      emissive: new THREE.Color(0xd61f42),
      emissiveIntensity: 0.4,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    });
    const elastinMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6ad87,
      emissive: new THREE.Color(0xd61f42),
      emissiveIntensity: 0.22,
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
      emissiveIntensity: 1.05,
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
      emissiveIntensity: 1.15,
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
    // EXACT LUMIASCULPT™ M8807 3D PRODUCT MODEL (FLUSH CONTACT ON THE SKIN!)
    // =========================================================================
    const wandAnchor = new THREE.Group();
    wandAnchor.position.set(0, 0.45, 0);
    root.add(wandAnchor);

    const wandRig = new THREE.Group();
    wandRig.scale.setScalar(0.68);
    wandRig.rotation.order = "YXZ";
    wandRig.rotation.x = Math.PI / 2 + 0.14;
    wandRig.rotation.y = 1.68;
    wandAnchor.add(wandRig);

    const deviceModel = new THREE.Group();
    deviceModel.position.set(0, -1.0, -0.831);
    wandRig.add(deviceModel);

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

    const bodyGroup = new THREE.Group();
    bodyGroup.scale.z = Z_SCALE;
    deviceModel.add(bodyGroup);

    const handleMesh = new THREE.Mesh(
      new THREE.LatheGeometry(buildHandleProfile(H_BOTTOM, H_TOP, 0, 140), 96),
      whiteMat
    );
    handleMesh.castShadow = true;
    bodyGroup.add(handleMesh);

    const panelCanvas = document.createElement("canvas");
    panelCanvas.width = 512;
    panelCanvas.height = 1536;
    const panelCtx = panelCanvas.getContext("2d")!;
    drawDevicePanel(panelCtx, MODE_CONFIG[0].panelKey, MODE_CONFIG[0].css);
    const panelTex = new THREE.CanvasTexture(panelCanvas);
    panelTex.colorSpace = THREE.SRGBColorSpace;
    panelTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    bodyGroup.add(
      new THREE.Mesh(
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
      )
    );

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

    // Optical LED Lens Halo Sprite directly at the contact interface (clean bloom feel on alpha canvas!)
    const ledHaloMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: MODE_CONFIG[0].glowColor,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const ledHalo = new THREE.Sprite(ledHaloMat);
    ledHalo.scale.set(1.25, 1.25, 1);
    ledHalo.position.set(0, 0.03, 0);
    ledHalo.renderOrder = 10;
    wandAnchor.add(ledHalo);

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

    const headLight = new THREE.PointLight(MODE_CONFIG[0].color, 5.4, 5.4, 1.6);
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
    // TRUE 3D SPATIAL LUXURY ANATOMICAL CALLOUTS (3D Gold Orbs + Metallic Stems + 3D Serif Planes!)
    // =========================================================================
    const calloutTextures: THREE.CanvasTexture[] = [];
    const pinGoldMatBase = new THREE.MeshPhysicalMaterial({
      color: 0xd9b394,
      metalness: 0.92,
      roughness: 0.14,
      clearcoat: 0.8,
    });
    const stemLen = 0.42;
    const stemGeo = new THREE.CylinderGeometry(0.007, 0.011, stemLen, 12);
    stemGeo.rotateZ(-Math.PI / 2);
    stemGeo.translate(stemLen / 2, 0, 0);

    const orbGeo = new THREE.SphereGeometry(0.044, 18, 16);
    const haloTorusGeo = new THREE.TorusGeometry(0.076, 0.0085, 12, 32);

    const layerCallouts = DEPTH_LAYERS.map((layer, idx) => {
      const group = new THREE.Group();
      root.add(group);

      const pinMat = pinGoldMatBase.clone();
      const orb = new THREE.Mesh(orbGeo, pinMat);
      group.add(orb);

      const haloMat = new THREE.MeshBasicMaterial({
        color: MODE_CONFIG[0].color,
        transparent: true,
        opacity: idx === MODE_CONFIG[0].activeLayerIndex ? 0.65 : 0.18,
      });
      const halo = new THREE.Mesh(haloTorusGeo, haloMat);
      group.add(halo);

      const stemMat = pinGoldMatBase.clone();
      const stem = new THREE.Mesh(stemGeo, stemMat);
      group.add(stem);

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 240;
      const ctx = canvas.getContext("2d")!;
      draw3DCalloutCanvas(ctx, {
        title: layer.name,
        metric: layer.depth,
        subtitle: layer.detail,
        accentCss: MODE_CONFIG[0].css,
        active: idx === MODE_CONFIG[0].activeLayerIndex,
        align: "left",
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      calloutTextures.push(tex);

      const planeGeo = new THREE.PlaneGeometry(2.16, 0.48);
      // Position plane left-edge right at the tip of the 3D stem so underline meets the stem cleanly
      planeGeo.translate(stemLen + 1.08, 0.02, 0);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const labelPlane = new THREE.Mesh(planeGeo, planeMat);
      labelPlane.rotation.x = -0.14;
      labelPlane.renderOrder = 14;
      group.add(labelPlane);

      return { group, orb, halo, haloMat, pinMat, stemMat, canvas, ctx, tex, labelPlane };
    });

    // 4th True 3D Callout rising smoothly up-left from the gliding LumiaSculpt™ wand head
    const wandCalloutGroup = new THREE.Group();
    root.add(wandCalloutGroup);

    const wandPinMat = pinGoldMatBase.clone();
    const wandOrb = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 14), wandPinMat);
    wandCalloutGroup.add(wandOrb);

    const wandStemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.18, 0.56, 0),
      new THREE.Vector3(-0.58, 0.72, 0),
    ]);
    const wandStemMat = pinGoldMatBase.clone();
    const wandStem = new THREE.Mesh(
      new THREE.TubeGeometry(wandStemCurve, 20, 0.0085, 10, false),
      wandStemMat
    );
    wandCalloutGroup.add(wandStem);

    const wandCanvas = document.createElement("canvas");
    wandCanvas.width = 900;
    wandCanvas.height = 240;
    const wandCtx = wandCanvas.getContext("2d")!;
    draw3DCalloutCanvas(wandCtx, {
      title: "LumiaSculpt™",
      metric: MODE_CONFIG[0].wavelength,
      subtitle: "",
      accentCss: MODE_CONFIG[0].css,
      active: true,
      align: "right",
    });
    const wandTex = new THREE.CanvasTexture(wandCanvas);
    wandTex.colorSpace = THREE.SRGBColorSpace;
    wandTex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    wandTex.generateMipmaps = true;
    wandTex.minFilter = THREE.LinearMipmapLinearFilter;
    calloutTextures.push(wandTex);

    const wandPlaneGeo = new THREE.PlaneGeometry(1.78, 0.47);
    wandPlaneGeo.translate(-0.58 - 0.89, 0.76, 0);
    const wandLabelPlane = new THREE.Mesh(
      wandPlaneGeo,
      new THREE.MeshBasicMaterial({
        map: wandTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    wandLabelPlane.rotation.x = -0.14;
    wandLabelPlane.renderOrder = 14;
    wandCalloutGroup.add(wandLabelPlane);

    const update3DCalloutMode = (modeIdx: SynergyModeId) => {
      const mCfg = MODE_CONFIG[modeIdx];
      layerCallouts.forEach((lc, i) => {
        const isAct = mCfg.activeLayerIndex === i;
        draw3DCalloutCanvas(lc.ctx, {
          title: DEPTH_LAYERS[i].name,
          metric: DEPTH_LAYERS[i].depth,
          subtitle: DEPTH_LAYERS[i].detail,
          accentCss: mCfg.css,
          active: isAct,
          align: "left",
        });
        lc.tex.needsUpdate = true;
        lc.pinMat.color.setHex(isAct ? mCfg.color : 0xd6b092);
        lc.pinMat.emissive.setHex(isAct ? mCfg.color : 0x000000);
        lc.pinMat.emissiveIntensity = isAct ? 0.85 : 0;
        lc.stemMat.color.setHex(isAct ? mCfg.color : 0xcfa98c);
        lc.haloMat.color.setHex(mCfg.color);
        lc.haloMat.opacity = isAct ? 0.68 : 0.14;
      });

      draw3DCalloutCanvas(wandCtx, {
        title: "LumiaSculpt™",
        metric:
          mCfg.shortLabel === "EMS 45°"
            ? "EMS + Thermie 45 °C"
            : mCfg.wavelength.replace(" + Sonique", " · Sonique"),
        subtitle: "",
        accentCss: mCfg.css,
        active: true,
        align: "right",
      });
      wandTex.needsUpdate = true;
      wandPinMat.color.setHex(mCfg.color);
      wandPinMat.emissive.setHex(mCfg.color);
      wandPinMat.emissiveIntensity = 0.9;
      wandStemMat.color.setHex(mCfg.color);
    };
    update3DCalloutMode(0);

    // =========================================================================
    // INTERACTIVE 360° DRAG-TO-ORBIT + PINCH / WHEEL / BUTTON MACRO ZOOM
    // =========================================================================
    const activePointers = new Map<number, { x: number; y: number }>();
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastPinchDist = 0;
    let autoOrbitAngle = 0.22;
    let userYaw = 0;
    let userPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;

    const DEFAULT_RADIUS = 10.45;
    const MIN_RADIUS = 2.95; // deep ultra-macro zoom right into skin pores, keratinocytes & collagen!
    const MAX_RADIUS = 12.0;
    let currentRadius = DEFAULT_RADIUS;
    let targetRadius = DEFAULT_RADIUS;

    controlsRef.current = {
      zoomIn: () => {
        targetRadius = Math.max(MIN_RADIUS, targetRadius - 1.35);
      },
      zoomOut: () => {
        targetRadius = Math.min(MAX_RADIUS, targetRadius + 1.35);
      },
      reset: () => {
        targetRadius = DEFAULT_RADIUS;
        targetPitch = 0;
      },
    };

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      mount.setPointerCapture(e.pointerId);
      if (activePointers.size === 1) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (activePointers.size === 2) {
        isDragging = false;
        const pts = Array.from(activePointers.values());
        lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        if (lastPinchDist > 0) {
          const delta = lastPinchDist - dist;
          targetRadius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, targetRadius + delta * 0.022));
        }
        lastPinchDist = dist;
        return;
      }

      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw -= dx * 0.007;
      targetPitch = Math.max(-0.42, Math.min(0.45, targetPitch + dy * 0.005));
    };
    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (mount.hasPointerCapture(e.pointerId)) {
        mount.releasePointerCapture(e.pointerId);
      }
      if (activePointers.size < 2) lastPinchDist = 0;
      if (activePointers.size === 1) {
        const [rem] = Array.from(activePointers.values());
        lastX = rem.x;
        lastY = rem.y;
        isDragging = true;
      } else {
        isDragging = false;
      }
    };
    const onWheel = (e: WheelEvent) => {
      // Allow direct smooth zoom inside the 3D cutaway (prevent page jump while actively zooming within bounds)
      const next = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, targetRadius + e.deltaY * 0.0055));
      if (Math.abs(next - targetRadius) > 0.001) {
        e.preventDefault();
        targetRadius = next;
      }
    };

    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("pointercancel", onPointerUp);
    mount.addEventListener("wheel", onWheel, { passive: false });

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

      if (mode !== lastDrawnMode) {
        lastDrawnMode = mode;
        drawDevicePanel(panelCtx, cfg.panelKey, cfg.css);
        panelTex.needsUpdate = true;
        update3DCalloutMode(mode);
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
      ledHaloMat.color.copy(curGlow);
      ledHaloMat.opacity = 0.56 * pulse;
      outerBeamMat.color.copy(curColor);
      innerBeamMat.color.copy(curGlow);
      surfacePoolMat.color.copy(curColor);
      cutawayGlowMat.color.copy(curColor);
      headLight.color.copy(curColor);
      subsurfaceLight.color.copy(curSss);
      pMat.color.copy(curColor);

      // Flush direct skin contact glide of the exact LumiaSculpt™ M8807 wand
      const glideX = Math.sin(t * 0.72) * 1.15;
      const glideZ = Math.sin(t * 1.44) * 0.24;
      const sonicJitter = mode === 1 ? Math.sin(t * 72) * 0.008 : 0;

      const domeAtHead =
        0.065 *
        Math.cos((glideX / halfW) * (Math.PI * 0.42)) *
        Math.cos((glideZ / halfD) * (Math.PI * 0.42));
      const skinSurfaceY = 0.4 + domeAtHead;

      wandAnchor.position.x = glideX + sonicJitter;
      wandAnchor.position.z = glideZ;
      wandAnchor.position.y = skinSurfaceY + 0.004;
      wandRig.rotation.z = -Math.cos(t * 0.72) * 0.04;

      subsurfaceLight.position.set(
        glideX,
        mode === 2 ? 0.18 : mode === 3 ? -0.52 : -0.2,
        glideZ
      );
      subsurfaceLight.intensity = (mode === 2 ? 4.2 : 5.2) * pulse;

      surfacePool.position.x = glideX;
      surfacePool.position.z = glideZ;
      surfacePool.position.y = skinSurfaceY + 0.008;
      surfacePoolMat.opacity = (mode === 2 ? 0.68 : 0.56) * pulse;
      surfacePool.scale.setScalar(0.96 + 0.08 * pulse);

      const targetScaleY = cfg.beamDepth / 1.5;
      currentDepth += (targetScaleY - currentDepth) * Math.min(1, dt * 4.5);
      const radScale = cfg.beamRadius / 0.96;

      outerBeam.scale.set(radScale, currentDepth, radScale);
      innerBeam.scale.set(radScale * 0.92, currentDepth * 0.94, radScale * 0.92);
      outerBeamMat.opacity = (mode === 2 ? 0.4 : 0.48) * pulse;
      innerBeamMat.opacity = (mode === 2 ? 0.48 : 0.58) * pulse;

      cutawayGlow.position.set(glideX, skinSurfaceY - 0.02, glideZ);
      cutawayGlow.rotation.y = Math.atan2(camera.position.x - glideX, camera.position.z - glideZ);
      cutawayGlow.scale.set(radScale * 1.05, currentDepth * 0.94, 1);
      cutawayGlowMat.opacity = (mode === 2 ? 0.42 : 0.54) * pulse;

      // 1. REAL-TIME EPIDERMIS CONTACT CUSHIONING + SMOOTHING WAVE
      const posAttr = epiGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const dist = Math.hypot(vx - glideX, vz - glideZ);
        const influence = Math.exp(-dist * dist * 1.25);

        const smoothFactor = Math.min(1, influence * (mode === 0 || mode === 3 ? 1.15 : 0.85));
        const remainingWrinkle = epiWrinkleDepth[i] * (1 - smoothFactor);

        const contactPress = -0.024 * Math.exp(-dist * dist * 7.5);
        const outerPlump =
          (mode === 3
            ? 0.048 * (0.75 + 0.25 * Math.sin(t * 4.4))
            : mode === 0
              ? 0.042
              : 0.02) *
          Math.exp(-Math.pow(dist - 0.55, 2) * 3.2);

        const sonicRipple =
          mode === 1 ? Math.sin(dist * 11 - t * 11) * 0.018 * Math.exp(-dist * 0.72) : 0;

        posAttr.setY(i, epiBaseY[i] - remainingWrinkle + contactPress + outerPlump + sonicRipple);
      }
      posAttr.needsUpdate = true;
      epiGeo.computeVertexNormals();

      // Keratinocytes across all 4 cutaway sides
      const kEmissiveTarget = mode === 2 ? 0.75 * pulse : 0.06;
      kMat.emissive.copy(curColor);
      kMat.emissiveIntensity += (kEmissiveTarget - kMat.emissiveIntensity) * Math.min(1, dt * 4);
      for (let i = 0; i < kCount; i++) {
        const kd = kData[i];
        const dist2d = Math.hypot(kd.x - glideX, kd.z - glideZ);
        const boost = Math.exp(-dist2d * dist2d * 0.65);
        const breathe = 1 + 0.05 * Math.sin(t * 3 + kd.phase) + boost * (mode === 2 ? 0.14 : 0.05);
        dummy.position.set(kd.x, kd.y + boost * 0.018, kd.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(kd.sx * breathe, kd.sy * breathe, kd.sz * breathe);
        dummy.updateMatrix();
        keratinocytes.setMatrixAt(i, dummy.matrix);
      }
      keratinocytes.instanceMatrix.needsUpdate = true;

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

      // Smooth automatic 360° turntable camera orbit + ultra-macro zoom tracking
      if (!isDragging && activePointers.size === 0) {
        autoOrbitAngle += dt * 0.34;
      }
      userYaw += (targetYaw - userYaw) * Math.min(1, dt * 7);
      userPitch += (targetPitch - userPitch) * Math.min(1, dt * 7);
      currentRadius += (targetRadius - currentRadius) * Math.min(1, dt * 7.5);

      const zoomFactor = Math.max(
        0,
        Math.min(1, (DEFAULT_RADIUS - currentRadius) / (DEFAULT_RADIUS - MIN_RADIUS))
      );
      const orbitTheta = autoOrbitAngle + userYaw;
      const rightX = Math.cos(orbitTheta);
      const rightZ = -Math.sin(orbitTheta);

      // Shift lookAt toward the camera's right (+0.88) at wide view so the 3D skin slab
      // and the outward-extending 3D brushed-gold stems + 3D serif callouts balance dead-center
      // with generous margin from the right edge of the canvas!
      const aspectCompensation = camera.aspect < 1.32 ? 1.32 / Math.max(0.88, camera.aspect) : 1.0;
      const effectiveRadius = currentRadius * (1 + (aspectCompensation - 1) * (1 - zoomFactor));
      const sideBalance = 1.12 * (1 - zoomFactor);
      const focusX = rightX * sideBalance + glideX * 0.42 * zoomFactor;
      const focusY = 0.04 + 0.14 * zoomFactor;
      const focusZ = rightZ * sideBalance + glideZ * 0.35 * zoomFactor;

      const baseHeight =
        (2.9 + Math.sin(t * 0.38) * 0.22 + userPitch * 2.2) * (effectiveRadius / DEFAULT_RADIUS);
      const camY = Math.max(0.45, Math.min(4.8, baseHeight));
      camera.position.set(
        focusX + Math.sin(orbitTheta) * effectiveRadius,
        camY,
        focusZ + Math.cos(orbitTheta) * effectiveRadius
      );
      camera.lookAt(focusX, focusY, focusZ);

      // Smoothly anchor the 3 physical 3D anatomical callouts on the EXACT outermost camera-right
      // 3D silhouette corner of the skin slab (using tanh for silky 360° corner-to-corner glide
      // with zero jump and zero skin overlap!).
      const cornerX = Math.tanh(rightX * 6) * (halfW + 0.06);
      const cornerZ = Math.tanh(rightZ * 6) * (halfD + 0.06);

      layerCallouts.forEach((lc, i) => {
        const isAct = cfg.activeLayerIndex === i;
        lc.group.position.set(cornerX, DEPTH_LAYERS[i].y3d, cornerZ);
        lc.group.rotation.y = orbitTheta;
        const haloScale = isAct ? 1.0 + 0.26 * Math.sin(t * 4.5) : 0.85;
        lc.halo.scale.setScalar(haloScale);
        lc.halo.rotation.z = t * 0.6;
        // Subtle 3D perspective breathing & active prominence
        const textScale = isAct ? 1.04 : 0.94;
        lc.labelPlane.scale.setScalar(textScale);
      });

      // Position 4th physical 3D callout rising gracefully above-left of the gliding LumiaSculpt™ wand
      wandCalloutGroup.position.set(glideX, skinSurfaceY + 0.68, glideZ);
      wandCalloutGroup.rotation.y = orbitTheta;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      controlsRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointercancel", onPointerUp);
      mount.removeEventListener("wheel", onWheel);
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
      calloutTextures.forEach((t) => t.dispose());
      pinGoldMatBase.dispose();
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
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const cfg = MODE_CONFIG[activeMode];

  return (
    <div
      ref={containerRef}
      className="relative bg-[#FFFDFB]/92 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none [content-visibility:auto] [contain-intrinsic-size:auto_none_auto_480px]"
    >
      {/* Whisper-light borderless status header + tactile Zoom controls (+ / − / ↺) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 text-[11px]">
        <span className="pointer-events-none inline-flex items-center gap-2 font-semibold text-[#181312]">
          <span
            className="h-2.5 w-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: cfg.css, boxShadow: `0 0 10px ${cfg.css}88` }}
          />
          {cfg.wavelength}
          <span className="font-normal text-[#7B6862]">— {cfg.depthLabel}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[#8B756E] mr-1">
            ↻ 360° • Molette / Pincer
          </span>
          <button
            type="button"
            onClick={() => controlsRef.current?.zoomIn()}
            aria-label="Zoomer dans l'épiderme 3D"
            title="Zoomer"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8D8D2] bg-white/90 text-sm font-bold text-[#181312] shadow-2xs transition hover:border-[#C8465A] hover:text-[#C8465A]"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.zoomOut()}
            aria-label="Dézoomer"
            title="Dézoomer"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8D8D2] bg-white/90 text-sm font-bold text-[#181312] shadow-2xs transition hover:border-[#C8465A] hover:text-[#C8465A]"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.reset()}
            aria-label="Réinitialiser le zoom"
            title="Réinitialiser la vue"
            className="flex h-7 items-center justify-center rounded-full border border-[#E8D8D2] bg-white/90 px-2.5 text-[10px] font-semibold text-[#5E4E48] shadow-2xs transition hover:border-[#C8465A] hover:text-[#C8465A]"
          >
            ↺
          </button>
        </div>
      </div>

      {/* 100% Frameless Transparent 3D Canvas — True 3D Anatomical Legend Rendered Inside the 3D Scene */}
      <div
        ref={mountRef}
        className="relative h-[265px] sm:h-[355px] lg:h-[495px] w-full cursor-grab active:cursor-grabbing touch-none"
        title="Glissez pour pivoter • Molette ou 2 doigts pour zoomer dans l'épiderme"
      />

      {/* Minimal active action summary line on desktop (the 3D pins themselves now serve as the live anatomical legend!) */}
      <div className="pointer-events-none hidden lg:flex items-center justify-center gap-2 border-t border-[#EFE1DA]/80 pt-2.5 text-[11px]">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.css }} />
        <span className="font-medium" style={{ color: cfg.css }}>
          {cfg.effectSummary}
        </span>
      </div>

      {/* Clean borderless hairline 4-mode quick switcher on mobile / tablet */}
      {onSelectMode && (
        <div className="lg:hidden border-b border-[#E3D4C5] pb-2 pt-1">
          <div className="grid grid-cols-4 gap-1">
            {MODE_CONFIG.map((m) => {
              const selected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMode(m.id)}
                  className={`flex items-center justify-center gap-1.5 border-b-2 py-1.5 text-[11px] font-semibold transition ${
                    selected
                      ? "border-[#1E1916] text-[#1E1916]"
                      : "border-transparent text-[#7D6C60] hover:text-[#1E1916]"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: m.css }}
                  />
                  <span>{m.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
