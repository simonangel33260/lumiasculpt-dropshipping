"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const PHASE_DURATION = 4.8;

const PHASES = [
  {
    color: 0xff3348,
    css: "#C83E52",
    halo: "rgba(228, 122, 138, 0.18)",
    panelKey: "LED 630",
    label: "LED Rouge",
    title: "Lumière rouge 630 nm",
    desc: "Stimule le collagène naturel et raffermit l'ovale du visage.",
  },
  {
    color: 0x4aa3ff,
    css: "#2E78C7",
    halo: "rgba(130, 182, 238, 0.16)",
    panelKey: "LIFT EMS",
    label: "Micro-courants",
    title: "Micro-courants EMS",
    desc: "Des impulsions douces tonifient le cou et la ligne mandibulaire.",
  },
  {
    color: 0xf58220,
    css: "#C4621D",
    halo: "rgba(238, 172, 118, 0.20)",
    panelKey: "SÉRUM 45°",
    label: "Thermie 45 °C",
    title: "Chaleur douce 45 °C",
    desc: "Ouvre les pores et décuple l'absorption de vos sérums.",
  },
  {
    color: 0x24c981,
    css: "#1E8E63",
    halo: "rgba(128, 210, 175, 0.16)",
    panelKey: "PURETÉ",
    label: "Sonique",
    title: "Vibrations haute fréquence",
    desc: "Nettoient en profondeur et drainent les traits au réveil.",
  },
] as const;

const H_BOTTOM = -1.75;
const H_TOP = 1.36;

function smooth(a: number, b: number, x: number) {
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
  return 0.35 + 0.11 * smooth(-1.58, 0.95, y);
}

function profile(y0: number, y1: number, offset: number, steps = 160) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    pts.push(new THREE.Vector2(Math.max(0.0001, handleRadius(y) + offset), y));
  }
  return pts;
}

const Z_SCALE = 0.82;
const PANEL_Y0 = -0.42;
const PANEL_Y1 = 1.3;
const PANEL_PHI = 1.15;

function drawPanel(ctx: CanvasRenderingContext2D, activeKey: string, activeHex: string) {
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

function makeIconTexture(kind: "vib" | "power") {
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

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Asymmetric directional shadow texture cast to the RIGHT (+X) from the left window sunlight,
 * with a clean left falloff so it stays strictly on the travertine tabletop and never spills off the desk edge.
 */
function makeDirectionalShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 256);

  // Core contact umbra right under the handle base (around x=170, y=128)
  const g1 = ctx.createRadialGradient(175, 128, 6, 195, 128, 95);
  g1.addColorStop(0, "rgba(58, 42, 28, 0.62)");
  g1.addColorStop(0.5, "rgba(68, 50, 34, 0.28)");
  g1.addColorStop(1, "rgba(68, 50, 34, 0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 512, 256);

  // Long soft penumbra cast to the right (+X) by the left arched window sunbeams
  ctx.save();
  ctx.translate(285, 124);
  ctx.scale(1.65, 0.58);
  const g2 = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
  g2.addColorStop(0, "rgba(64, 46, 30, 0.34)");
  g2.addColorStop(0.6, "rgba(72, 53, 36, 0.14)");
  g2.addColorStop(1, "rgba(72, 53, 36, 0)");
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hard clip mask on the left edge so no shadow ever bleeds past the left edge of the counter
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createLinearGradient(75, 0, 130, 0);
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 512, 256);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function ProductHero3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{
    reset: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  } | null>(null);
  const [phase, setPhase] = useState(0);
  const [phaseSeconds, setPhaseSeconds] = useState(PHASE_DURATION);
  const [exploded, setExploded] = useState(false);
  const explodedRef = useRef(false);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    const mount = mountRef.current;
    const section = sectionRef.current;
    if (!mount || !section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reducedMotion ? 0.35 : 1;
    setPhaseSeconds(PHASE_DURATION / speed);

    // ---------- Renderer / Scene ----------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    Object.assign(renderer.domElement.style, {
      display: "block",
      width: "100%",
      height: "100%",
      cursor: "grab",
      touchAction: "none",
    });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.72;

    let roomEnvTex: THREE.Texture | null = null;
    new THREE.TextureLoader().load("/images/spa-institut-bg.jpg", (loaded) => {
      loaded.mapping = THREE.EquirectangularReflectionMapping;
      loaded.colorSpace = THREE.SRGBColorSpace;
      roomEnvTex = pmrem.fromEquirectangular(loaded).texture;
      scene.environment = roomEnvTex;
      loaded.dispose();
    });

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.15, 8.8);

    // Strong directional side-lighting from the LEFT arched windows (-X) matching the photo's sunbeams
    // Lower ambient + right fill so the right side of the wand has authentic warm shade like the orchid vase!
    scene.add(new THREE.AmbientLight(0xf3dfc8, 0.34));

    const windowSunKey = new THREE.DirectionalLight(0xffe4bc, 3.3);
    windowSunKey.position.set(-6.8, 2.4, 2.2);
    scene.add(windowSunKey);

    const windowRimLeft = new THREE.DirectionalLight(0xfff0d6, 1.8);
    windowRimLeft.position.set(-5.0, 1.2, -1.8);
    scene.add(windowRimLeft);

    // Subtle warm travertine tabletop bounce from below, and very soft right shade fill
    const tableBounce = new THREE.DirectionalLight(0xd9b896, 0.75);
    tableBounce.position.set(0.5, -3.2, 1.5);
    scene.add(tableBounce);

    const rightShadeFill = new THREE.DirectionalLight(0xc9ad92, 0.28);
    rightShadeFill.position.set(5.0, 0.5, 2.0);
    scene.add(rightShadeFill);

    // ---------- Materials tuned for directional side-light ----------
    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2e8dc,
      roughness: 0.24,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xffe0be),
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf0e8de,
      metalness: 0.96,
      roughness: 0.1,
    });
    const satinMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbc0,
      metalness: 0.85,
      roughness: 0.28,
    });
    const cottonRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f1e7,
      roughness: 0.18,
      transmission: 0.48,
      thickness: 0.12,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
    });
    const electrodeTex = makeElectrodeTexture();
    const innerMat = new THREE.MeshPhysicalMaterial({
      map: electrodeTex,
      color: 0xf1eae1,
      metalness: 0.42,
      roughness: 0.22,
      clearcoat: 0.6,
      clearcoatRoughness: 0.16,
      emissive: new THREE.Color(0xff7a1a),
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xff3348,
      emissive: new THREE.Color(0xff3348),
      emissiveIntensity: 2.0,
      roughness: 0.32,
      toneMapped: false,
    });
    const ledDotMat = new THREE.MeshBasicMaterial({ color: 0xfff8f0, toneMapped: false });

    // ---------- Hierarchy ----------
    const stage = new THREE.Group();
    scene.add(stage);

    const device = new THREE.Group();
    stage.add(device);
    const pose = new THREE.Group();
    pose.rotation.set(-0.05, -0.22, -0.1);
    device.add(pose);

    const body = new THREE.Group();
    body.scale.z = Z_SCALE;
    pose.add(body);

    const handle = new THREE.Mesh(
      new THREE.LatheGeometry(profile(H_BOTTOM, H_TOP, 0, 220), 140),
      whiteMat
    );
    body.add(handle);

    const panelCanvas = document.createElement("canvas");
    panelCanvas.width = 512;
    panelCanvas.height = 1536;
    const panelCtx = panelCanvas.getContext("2d")!;
    const panelTex = new THREE.CanvasTexture(panelCanvas);
    panelTex.colorSpace = THREE.SRGBColorSpace;
    panelTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const panelMat = new THREE.MeshPhysicalMaterial({
      map: panelTex,
      transparent: true,
      roughness: 0.05,
      metalness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    });
    const panel = new THREE.Mesh(
      new THREE.LatheGeometry(profile(PANEL_Y0, PANEL_Y1, 0.004, 160), 96, -PANEL_PHI / 2, PANEL_PHI),
      panelMat
    );
    body.add(panel);

    const stripRight = new THREE.Mesh(
      new THREE.LatheGeometry(profile(-1.35, 0.85, 0.004, 120), 10, 1.38, 0.11),
      chromeMat
    );
    const stripLeft = new THREE.Mesh(
      new THREE.LatheGeometry(profile(-1.35, 0.85, 0.004, 120), 10, -1.49, 0.11),
      chromeMat
    );
    body.add(stripRight, stripLeft);

    const usbRim = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.085, 32), chromeMat);
    usbRim.rotation.x = Math.PI / 2;
    usbRim.position.set(0, H_BOTTOM + 0.01, 0);
    pose.add(usbRim);

    const btnGeo = new THREE.CylinderGeometry(0.102, 0.108, 0.052, 64);
    const btnFaceGeo = new THREE.CircleGeometry(0.09, 64);
    (
      [
        [-0.62, "vib"],
        [-0.95, "power"],
      ] as const
    ).forEach(([y, kind]) => {
      const zFront = handleRadius(y) * Z_SCALE;
      const btn = new THREE.Group();
      btn.position.set(0, y, zFront + 0.005);
      const ring = new THREE.Mesh(btnGeo, chromeMat);
      ring.rotation.x = Math.PI / 2;
      btn.add(ring);
      const face = new THREE.Mesh(
        btnFaceGeo,
        new THREE.MeshStandardMaterial({
          map: makeIconTexture(kind),
          metalness: 0.72,
          roughness: 0.24,
          color: 0xffffff,
        })
      );
      face.position.z = 0.027;
      btn.add(face);
      pose.add(btn);
    });

    // ---------- Treatment Head & Explodable Layers ----------
    const head = new THREE.Group();
    head.position.set(0, 1.0, 0);
    pose.add(head);

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
    const headGeo = new THREE.LatheGeometry(headProfile, 160);
    headGeo.rotateX(Math.PI / 2);
    head.add(new THREE.Mesh(headGeo, chromeMat));

    const backCap = new THREE.Mesh(new THREE.CircleGeometry(0.56, 128), chromeMat);
    backCap.position.z = 0.79;
    head.add(backCap);

    const ledGroup = new THREE.Group();
    head.add(ledGroup);
    const step = new THREE.Mesh(new THREE.RingGeometry(0.53, 0.556, 160), satinMat);
    step.position.z = 0.811;
    ledGroup.add(step);
    const ledBand = new THREE.Mesh(new THREE.RingGeometry(0.37, 0.53, 160), ledMat);
    ledBand.position.z = 0.806;
    ledGroup.add(ledBand);
    const dotGeo = new THREE.CircleGeometry(0.018, 16);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const d = new THREE.Mesh(dotGeo, ledDotMat);
      d.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.808);
      ledGroup.add(d);
    }

    const electrodeGroup = new THREE.Group();
    head.add(electrodeGroup);
    const centerCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.368, 0.368, 0.045, 128),
      innerMat
    );
    centerCyl.rotation.x = Math.PI / 2;
    centerCyl.position.z = 0.808;
    electrodeGroup.add(centerCyl);
    const innerBezel = new THREE.Mesh(new THREE.RingGeometry(0.355, 0.376, 160), chromeMat);
    innerBezel.position.z = 0.831;
    electrodeGroup.add(innerBezel);

    const magneticRingGroup = new THREE.Group();
    head.add(magneticRingGroup);
    const cottonClip = new THREE.Mesh(
      new THREE.TorusGeometry(0.605, 0.032, 32, 160),
      cottonRingMat
    );
    cottonClip.position.z = 0.815;
    magneticRingGroup.add(cottonClip);

    const headLight = new THREE.PointLight(0xff3348, 2.8, 3.5, 2);
    headLight.position.set(0, 0, 1.4);
    head.add(headLight);

    const glowTex = makeGlowTexture();
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0xff3348,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), glowMat);
    glow.position.z = 0.9;
    head.add(glow);

    const waveGeo = new THREE.RingGeometry(0.62, 0.64, 128);
    const waves = Array.from({ length: 3 }, () => {
      const m = new THREE.Mesh(
        waveGeo,
        new THREE.MeshBasicMaterial({
          color: 0x4aa3ff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      head.add(m);
      return m;
    });

    // ---------- Directional Tabletop Shadow (Cast to the Right +X onto the Travertine Desk) ----------
    const dirShadowTex = makeDirectionalShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: dirShadowTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.05), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    // Offset to the right (+X = +0.38) so the shadow trails rightward across the tabletop
    shadow.position.set(0.38, -1.82, -0.05);
    stage.add(shadow);

    const counterLightMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0xff3348,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const counterLight = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.85), counterLightMat);
    counterLight.rotation.x = -Math.PI / 2;
    counterLight.position.set(0.28, -1.815, 0.15);
    stage.add(counterLight);

    // ---------- Layout & Clamped Counter Anchor ----------
    let isMobile = false;
    let defaultPos = new THREE.Vector3(2.05, -0.18, 0);
    let defaultScale = 0.72;
    let userOffset = new THREE.Vector2(0, 0);
    let targetOffset = new THREE.Vector2(0, 0);
    let zoomFactor = 1;
    let targetZoom = 1;

    const applyLayout = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      isMobile = w < 900;
      if (isMobile) {
        // Seated squarely on the sunlit travertine tabletop right beside the orchid vase
        defaultPos.set(0.18, -0.74, 0);
        defaultScale = 0.45;
      } else {
        // Seated proportionally over the travertine vanity counter (right side of room)
        defaultPos.set(2.05, -0.18, 0);
        defaultScale = 0.72;
      }
    };
    const ro = new ResizeObserver(applyLayout);
    ro.observe(mount);
    applyLayout();

    // ---------- Direct 3D Object Trackball Manipulation (Rotate on X/Y/Z in place + Clamped Pan) ----------
    let dragging: "none" | "rotate" | "pan" = "none";
    let lastPt = { x: 0, y: 0 };
    let userRot = { x: 0, y: 0, z: 0 };
    let targetUserRot = { x: 0, y: 0, z: 0 };
    let userInteracting = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    const activePointers = new Map<number, { x: number; y: number }>();

    const startInteract = () => {
      userInteracting = true;
      renderer.domElement.style.cursor = "grabbing";
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const endInteract = () => {
      renderer.domElement.style.cursor = "grab";
      resumeTimer = setTimeout(() => {
        userInteracting = false;
      }, 3200);
    };

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      renderer.domElement.setPointerCapture(e.pointerId);
      startInteract();
      if (activePointers.size >= 2 || e.button === 2 || e.shiftKey) {
        dragging = "pan";
      } else {
        dragging = "rotate";
      }
      lastPt = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size >= 2) {
        // 2-finger touch pan (clamped to counter zone so it never goes behind text)
        const pts = Array.from(activePointers.values());
        const cx = (pts[0].x + pts[1].x) * 0.5;
        const cy = (pts[0].y + pts[1].y) * 0.5;
        const dx = cx - lastPt.x;
        const dy = cy - lastPt.y;
        lastPt = { x: cx, y: cy };
        targetOffset.x = THREE.MathUtils.clamp(targetOffset.x + dx * 0.005, -0.45, 0.55);
        targetOffset.y = THREE.MathUtils.clamp(targetOffset.y - dy * 0.005, -0.32, 0.35);
        return;
      }

      const dx = e.clientX - lastPt.x;
      const dy = e.clientY - lastPt.y;
      lastPt = { x: e.clientX, y: e.clientY };

      if (dragging === "pan") {
        // Clamped so the device stays on the right counter side and never crosses behind the left text!
        targetOffset.x = THREE.MathUtils.clamp(targetOffset.x + dx * 0.005, -0.45, 0.55);
        targetOffset.y = THREE.MathUtils.clamp(targetOffset.y - dy * 0.005, -0.32, 0.35);
      } else if (dragging === "rotate") {
        // Multi-axis 3D trackball rotation in place (yaw + pitch + banking tilt)
        targetUserRot.y += dx * 0.011;
        targetUserRot.x = THREE.MathUtils.clamp(targetUserRot.x + dy * 0.009, -0.95, 0.95);
        targetUserRot.z = THREE.MathUtils.clamp(targetUserRot.z - dx * 0.0025, -0.45, 0.45);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        dragging = "none";
        endInteract();
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("contextmenu", onContextMenu);

    controlsRef.current = {
      reset: () => {
        targetUserRot = { x: 0, y: 0, z: 0 };
        targetOffset.set(0, 0);
        targetZoom = 1;
      },
      zoomIn: () => {
        targetZoom = Math.min(1.28, targetZoom + 0.12);
      },
      zoomOut: () => {
        targetZoom = Math.max(0.76, targetZoom - 0.12);
      },
    };

    // ---------- Visibility Pause ----------
    let rendered = true;
    const onCV = (e: Event) => {
      rendered = !(e as Event & { skipped: boolean }).skipped;
    };
    section.addEventListener("contentvisibilityautostatechange", onCV);
    let pageVisible = !document.hidden;
    const onVis = () => {
      pageVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    // ---------- Multi-Axis Choreographed Animation Loop ----------
    const clock = new THREE.Clock();
    const cur = new THREE.Color(PHASES[0].color);
    const tgt = new THREE.Color();
    let elapsed = 0;
    let explodeProgress = 0;
    let lastIdx = -1;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!rendered || !pageVisible) return;
      elapsed += dt * speed;
      const t = elapsed;

      const idx = Math.floor(t / PHASE_DURATION) % PHASES.length;
      if (idx !== lastIdx) {
        lastIdx = idx;
        drawPanel(panelCtx, PHASES[idx].panelKey, PHASES[idx].css);
        panelTex.needsUpdate = true;
        setPhase(idx);
      }

      tgt.setHex(PHASES[idx].color);
      cur.lerp(tgt, 1 - Math.pow(0.04, dt));
      const pulse = 0.86 + 0.14 * Math.sin(t * 4.5);
      ledMat.color.copy(cur);
      ledMat.emissive.copy(cur);
      ledMat.emissiveIntensity = 2.0 * pulse;
      headLight.color.copy(cur);
      headLight.intensity = 2.8 * pulse;
      glowMat.color.copy(cur);
      glowMat.opacity = 0.16 + 0.06 * pulse;
      counterLightMat.color.copy(cur);
      counterLightMat.opacity = 0.14 + 0.06 * pulse;

      // Smoothly decay user rotation back to choreographed showcase when idle
      if (!userInteracting) {
        targetUserRot.x *= Math.pow(0.45, dt);
        targetUserRot.y *= Math.pow(0.45, dt);
        targetUserRot.z *= Math.pow(0.45, dt);
      }
      const damp = Math.min(1, dt * 8);
      userRot.x += (targetUserRot.x - userRot.x) * damp;
      userRot.y += (targetUserRot.y - userRot.y) * damp;
      userRot.z += (targetUserRot.z - userRot.z) * damp;
      userOffset.lerp(targetOffset, damp);
      zoomFactor += (targetZoom - zoomFactor) * damp;

      // Multi-axis choreographed 3D motion per technology chapter (varied, figure-8 & inspection tilts)
      let choreoX = 0;
      let choreoY = 0;
      let choreoZ = 0;
      let liftY = Math.sin(t * 1.1) * 0.045;

      if (explodedRef.current) {
        choreoX = 0.14;
        choreoY = -0.78 + Math.sin(t * 0.6) * 0.12;
        choreoZ = 0.06;
      } else if (idx === 0) {
        // Chapter 1 (LED 630): Figure-8 orbital tilt presenting the glowing optical crown
        choreoX = Math.sin(t * 0.9) * 0.22 + 0.08;
        choreoY = Math.sin(t * 0.55) * 0.48;
        choreoZ = Math.cos(t * 0.55) * 0.14;
      } else if (idx === 1) {
        // Chapter 2 (EMS Lift): Upward sculpting glide & diagonal roll
        choreoX = -0.18 + Math.sin(t * 1.2) * 0.24;
        choreoY = -0.35 + Math.cos(t * 0.8) * 0.55;
        choreoZ = -0.22 + Math.sin(t * 0.8) * 0.18;
        liftY = Math.sin(t * 1.4) * 0.08;
      } else if (idx === 2) {
        // Chapter 3 (Thermie 45°C): Full 360° slow inspection turn revealing profile & back
        const phaseProgress = (t % PHASE_DURATION) / PHASE_DURATION;
        choreoY = phaseProgress * Math.PI * 2;
        choreoX = Math.sin(phaseProgress * Math.PI * 2) * 0.2;
        choreoZ = Math.cos(phaseProgress * Math.PI * 2) * 0.12;
      } else {
        // Chapter 4 (Sonic): Forward macro nod toward the viewer
        choreoX = 0.28 + Math.sin(t * 1.3) * 0.12;
        choreoY = Math.sin(t * 0.7) * 0.35;
        choreoZ = Math.sin(t * 1.1) * 0.1;
      }

      const targetRx = choreoX + userRot.x;
      const targetRy = choreoY + userRot.y;
      const targetRz = choreoZ + userRot.z;
      device.rotation.x += (targetRx - device.rotation.x) * Math.min(1, dt * 5);
      device.rotation.y += (targetRy - device.rotation.y) * Math.min(1, dt * 5);
      device.rotation.z += (targetRz - device.rotation.z) * Math.min(1, dt * 5);
      device.position.y = liftY;

      stage.position.set(
        defaultPos.x + userOffset.x,
        defaultPos.y + userOffset.y,
        defaultPos.z
      );
      stage.scale.setScalar(defaultScale * zoomFactor);

      // Keep shadow anchored on the tabletop surface and responding to lift & tilt
      shadow.position.y = -1.82 - userOffset.y * 0.35;
      shadow.position.x = 0.38 + Math.sin(device.rotation.z) * -0.18;
      shadowMat.opacity = THREE.MathUtils.clamp(0.72 - liftY * 1.4 - userOffset.y * 0.5, 0.22, 0.82);
      shadow.scale.set(1 + liftY * 0.8, 1 + Math.abs(Math.sin(device.rotation.x)) * 0.35, 1);

      counterLight.position.y = shadow.position.y + 0.005;

      // Smooth exploded-view transition for the 3 head layers
      const expTarget = explodedRef.current ? 1 : 0;
      explodeProgress += (expTarget - explodeProgress) * Math.min(1, dt * 6);
      ledGroup.position.z = explodeProgress * 0.22;
      electrodeGroup.position.z = explodeProgress * 0.48;
      magneticRingGroup.position.z = explodeProgress * 0.76;

      head.position.x = idx === 3 ? Math.sin(t * 90) * 0.006 : 0;

      const heat = idx === 2 ? 0.75 : 0;
      innerMat.emissiveIntensity += (heat - innerMat.emissiveIntensity) * Math.min(1, dt * 2.5);

      waves.forEach((w, i) => {
        const p = (t * 0.5 + i / waves.length) % 1;
        w.scale.setScalar(1 + p * 1.5);
        w.position.z = 0.85 + p * 0.65;
        const m = w.material as THREE.MeshBasicMaterial;
        m.color.copy(cur);
        m.opacity = (1 - p) * (idx === 1 ? 0.42 : 0);
      });

      // Subtle room parallax synced with object rotation/offset
      if (bgRef.current) {
        const px = THREE.MathUtils.clamp((userRot.y * 10 + userOffset.x * 18), -22, 22);
        const py = THREE.MathUtils.clamp((userRot.x * 8 - userOffset.y * 14), -14, 14);
        bgRef.current.style.transform = `scale(1.06) translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("contextmenu", onContextMenu);
      section.removeEventListener("contentvisibilityautostatechange", onCV);
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
      dirShadowTex.dispose();
      electrodeTex.dispose();
      glowTex.dispose();
      envTex.dispose();
      roomEnvTex?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const active = PHASES[phase];

  return (
    <section
      ref={sectionRef}
      aria-label="Présentation 3D interactive LumiaSculpt dans un institut"
      className="relative w-full overflow-hidden border-b border-[#E8DDD2] bg-[#EFE3D4] text-[#1E1916] [content-visibility:auto] [contain-intrinsic-size:auto_none_auto_760px]"
    >
      {/* Architectural Parisian Spa / Institut Background Image with 3D Parallax */}
      {/* Mobile crops directly onto the sunlit travertine vanity tabletop + orchid vase (74% X, 78% Y) */}
      <div
        ref={bgRef}
        className="pointer-events-none absolute inset-0 bg-cover bg-[74%_78%] md:bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: `url('/images/spa-institut-bg.jpg')`,
          transform: "scale(1.06)",
        }}
      />

      {/* Soft sunlit silk veil: top-down on mobile so the travertine desk at bottom stays crisp & clear; left-to-right on desktop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FFFDFB]/94 via-[#FFFDFB]/68 via-45% to-transparent md:bg-gradient-to-r md:from-[#FCF8F3]/92 md:via-[#F8EFE6]/58 md:to-transparent" />

      {/* Directional warm morning sunbeam from left window across the scene */}
      <div
        className="pointer-events-none absolute inset-0 z-15 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(108deg, rgba(255,236,204,0.62) 0%, rgba(255,222,178,0.25) 52%, rgba(160,120,85,0.24) 100%)",
        }}
      />

      <div className="relative mx-auto h-[720px] sm:h-[760px] md:h-[88svh] md:min-h-[650px] md:max-h-[880px] max-w-[1600px]">
        {/* Interactive 3D Canvas */}
        <div ref={mountRef} className="absolute inset-0 z-10" />

        {/* Left Editorial Column */}
        <div className="pointer-events-none relative z-20 mx-auto flex h-full max-w-6xl px-5 pt-5 md:items-center md:pt-0">
          <div className="max-w-xl space-y-3 md:space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#EAD9D4] bg-white/90 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7D5A44] shadow-2xs backdrop-blur-md">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active.css }}
              />
              Institut LumiaSculpt™ • Paris
            </span>

            <h1 className="font-[family-name:var(--font-serif)] text-[32px] font-bold leading-[1.04] tracking-tight text-[#181312] sm:text-5xl md:text-6xl">
              Le soin cabine expert,{" "}
              <span className="italic text-[#C8465A]">dans votre rituel du soir.</span>
            </h1>

            <p className="max-w-md text-[13px] leading-relaxed text-[#4E443E] sm:text-base">
              Micro-courants EMS, luminothérapie LED et chaleur douce à 45 °C réunis dans un
              écrin nacré pour raffermir, lisser et illuminer votre peau en 5 minutes.
            </p>

            <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 md:gap-3 pt-0.5 md:pt-1">
              <a
                href="#commander"
                className="rounded-full bg-gradient-to-r from-[#C8465A] to-[#A83247] px-5 md:px-6 py-2.5 md:py-3.5 text-xs md:text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(200,70,90,0.52)] transition hover:brightness-105"
              >
                Découvrir l&apos;offre — dès 49,90 €
              </a>
              <button
                type="button"
                onClick={() => setExploded((v) => !v)}
                className={`rounded-full border px-4 md:px-5 py-2.5 md:py-3.5 text-xs md:text-sm font-semibold transition backdrop-blur-md ${
                  exploded
                    ? "border-[#C8465A] bg-[#C8465A] text-white"
                    : "border-[#DFC7CC] bg-white/88 text-[#181312] hover:bg-white"
                }`}
              >
                {exploded ? "✓ Vue assemblée" : "✦ Explorer les 3 couches"}
              </button>
            </div>

            {/* Technology chapters (desktop) */}
            <div className="hidden max-w-md rounded-2xl border border-[#E4D6C8] bg-white/80 p-4 shadow-xs backdrop-blur-md md:block">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold" style={{ color: active.css }}>
                  {active.title}
                </p>
                <span className="font-mono text-[11px] text-[#8C7B6E]">
                  0{phase + 1} / 0{PHASES.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5C524B]">{active.desc}</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {PHASES.map((p, i) => (
                  <div key={p.label} className="space-y-1.5">
                    <div className="h-1 overflow-hidden rounded-full bg-[#E5D8CB]">
                      <div
                        key={i === phase ? `on-${phase}` : `off-${i}`}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: p.css,
                          width: i < phase ? "100%" : i === phase ? undefined : "0%",
                          animation:
                            i === phase
                              ? `heroProgress ${phaseSeconds}s linear forwards`
                              : undefined,
                        }}
                      />
                    </div>
                    <p
                      className={`text-[10px] font-semibold ${
                        i === phase ? "text-[#1E1916]" : "text-[#9A8B7E]"
                      }`}
                    >
                      {p.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive 3D Controls Bar: visible right above sticky bottom bar on mobile, top-right on desktop */}
        <div className="pointer-events-auto absolute bottom-[82px] right-3 md:bottom-auto md:right-5 md:top-5 z-20 flex items-center gap-2 rounded-full border border-[#E6D6CF] bg-white/90 px-2.5 md:px-3.5 py-1.5 text-xs font-medium text-[#4A3F38] shadow-sm backdrop-blur-md">
          <span className="hidden md:inline text-[11px] text-[#6E6056]">
            ↻ Glissez pour incliner &amp; tourner • Clic droit / 2 doigts : déplacer sur la table
          </span>
          <div className="flex items-center gap-1 md:border-l md:border-[#E2D4C6] md:pl-2">
            <button
              type="button"
              onClick={() => controlsRef.current?.zoomIn()}
              aria-label="Zoomer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7ECE8] text-xs font-bold hover:bg-[#ECD9D2]"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => controlsRef.current?.zoomOut()}
              aria-label="Dézoomer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7ECE8] text-xs font-bold hover:bg-[#ECD9D2]"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setExploded(false);
                controlsRef.current?.reset();
              }}
              aria-label="Réinitialiser"
              className="rounded-full bg-[#F7ECE8] px-2 md:px-2.5 py-1 text-[11px] font-semibold hover:bg-[#ECD9D2]"
            >
              <span className="md:hidden">↺</span>
              <span className="hidden md:inline">Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
