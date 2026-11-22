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
    color: 0xe63950,
    css: "#C83E52",
    depthLabel: "Cible : Derme (Collagène)",
    beamDepth: 1.35,
    beamRadius: 0.95,
  },
  {
    color: 0x26a671,
    css: "#1E8E63",
    depthLabel: "Cible : Microcirculation & Drainage",
    beamDepth: 0.95,
    beamRadius: 1.05,
  },
  {
    color: 0x3b8ce2,
    css: "#2563A6",
    depthLabel: "Cible : Épiderme & Pores",
    beamDepth: 0.55,
    beamRadius: 0.85,
  },
  {
    color: 0xe8862a,
    css: "#B85D19",
    depthLabel: "Cible : Fibres Musculaires (EMS + 45 °C)",
    beamDepth: 1.85,
    beamRadius: 1.1,
  },
] as const;

function makeBeamTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.45, "rgba(255,255,255,0.32)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
    renderer.toneMappingExposure = 1.08;
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
    scene.environmentIntensity = 0.65;

    const camera = new THREE.PerspectiveCamera(32, 1.4, 0.1, 50);
    camera.position.set(0.35, 2.35, 5.45);
    camera.lookAt(0, -0.15, 0);

    // Warm Parisian spa studio lighting
    scene.add(new THREE.AmbientLight(0xfff5ec, 0.72));
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.9);
    keyLight.position.set(-4, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xf6dfd0, 0.9);
    fillLight.position.set(4, 2, 3);
    scene.add(fillLight);

    const root = new THREE.Group();
    root.rotation.y = -0.22;
    scene.add(root);

    // ---------- 3 Biological Skin Strata (Isometric Cutaway Block) ----------
    const W = 4.4;
    const D = 2.4;

    // 1. Epidermis (silky dewy top surface with deformable vertices)
    const epiGeo = new THREE.PlaneGeometry(W, D, 48, 24);
    epiGeo.rotateX(-Math.PI / 2);
    const epiBaseY = new Float32Array(epiGeo.attributes.position.count);
    for (let i = 0; i < epiGeo.attributes.position.count; i++) {
      epiBaseY[i] = epiGeo.attributes.position.getY(i);
    }
    const epiMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4d8c4,
      roughness: 0.3,
      metalness: 0.02,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xfff0e6),
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const epiMesh = new THREE.Mesh(epiGeo, epiMat);
    epiMesh.position.y = 0.35;
    root.add(epiMesh);

    // Thin translucent front rim of epidermis
    const epiWall = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.26, D),
      new THREE.MeshPhysicalMaterial({
        color: 0xf0cdb6,
        roughness: 0.38,
        transparent: true,
        opacity: 0.48,
      })
    );
    epiWall.position.y = 0.22;
    root.add(epiWall);

    // 2. Dermis (rose-nude translucent layer housing the 3D collagen network)
    const dermisWall = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.72, D),
      new THREE.MeshPhysicalMaterial({
        color: 0xe6b5a2,
        roughness: 0.42,
        transparent: true,
        opacity: 0.42,
      })
    );
    dermisWall.position.y = -0.28;
    root.add(dermisWall);

    // 3D Collagen Fiber Network inside the Dermis (illuminated during 630nm Red LED)
    const collagenMat = new THREE.MeshStandardMaterial({
      color: 0xd99b82,
      emissive: new THREE.Color(0xd92b45),
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.15,
    });
    const collagenGroup = new THREE.Group();
    collagenGroup.position.y = -0.28;
    root.add(collagenGroup);

    const fiberCurves: THREE.Mesh[] = [];
    for (let row = 0; row < 5; row++) {
      const z = -0.85 + row * 0.42;
      const pts: THREE.Vector3[] = [];
      for (let step = 0; step <= 12; step++) {
        const x = -W / 2 + 0.15 + (step / 12) * (W - 0.3);
        const y = Math.sin(step * 0.9 + row * 1.4) * 0.16;
        pts.push(new THREE.Vector3(x, y, z + Math.cos(step * 0.7 + row) * 0.08));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.024, 8, false), collagenMat);
      collagenGroup.add(tube);
      fiberCurves.push(tube);
    }
    // Cross-linking diagonal fibers
    for (let col = 0; col < 7; col++) {
      const x = -1.7 + col * 0.56;
      const pts = [
        new THREE.Vector3(x - 0.25, -0.22, -0.95),
        new THREE.Vector3(x, 0.12, 0),
        new THREE.Vector3(x + 0.25, -0.18, 0.95),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.018, 8, false), collagenMat);
      collagenGroup.add(tube);
      fiberCurves.push(tube);
    }

    // 3. Deep Facial Muscle Layer (contracts & tones during EMS + 45°C)
    const muscleMat = new THREE.MeshPhysicalMaterial({
      color: 0xc98878,
      emissive: new THREE.Color(0xe8862a),
      emissiveIntensity: 0.05,
      roughness: 0.48,
      transparent: true,
      opacity: 0.72,
    });
    const muscleBlock = new THREE.Mesh(new THREE.BoxGeometry(W, 0.54, D), muscleMat);
    muscleBlock.position.y = -0.92;
    root.add(muscleBlock);

    // Subtle crisp champagne borders framing the cutaway block
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xc8a78c,
      transparent: true,
      opacity: 0.45,
    });
    const frameEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(W, 1.54, D)),
      edgesMat
    );
    frameEdges.position.y = -0.42;
    root.add(frameEdges);

    // ---------- Gliding LumiaSculpt™ Treatment Head ----------
    const wandHead = new THREE.Group();
    wandHead.position.set(0, 0.88, 0);
    root.add(wandHead);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf4eee6,
      metalness: 0.96,
      roughness: 0.1,
    });
    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8f3ec,
      roughness: 0.2,
      clearcoat: 0.9,
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xe63950,
      emissive: new THREE.Color(0xe63950),
      emissiveIntensity: 2.2,
      toneMapped: false,
    });

    // Upper neck & angled handle stub
    const neckStub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55, 48), chromeMat);
    neckStub.position.y = 0.28;
    wandHead.add(neckStub);

    const handleStub = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.65, 16, 32), whiteMat);
    handleStub.position.set(-0.22, 0.82, -0.06);
    handleStub.rotation.z = 0.34;
    wandHead.add(handleStub);

    // Flared chrome contact head facing down onto the skin
    const headBase = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.48, 0.16, 72), chromeMat);
    headBase.position.y = 0;
    wandHead.add(headBase);

    // Glowing LED ring underneath the head
    const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 20, 72), ledMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.y = -0.075;
    wandHead.add(ledRing);

    // Center thermal electrode disc
    const electrode = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.04, 64),
      new THREE.MeshStandardMaterial({
        color: 0xf1ece5,
        metalness: 0.65,
        roughness: 0.2,
        emissive: new THREE.Color(0xe8862a),
        emissiveIntensity: 0,
      })
    );
    electrode.position.y = -0.085;
    wandHead.add(electrode);

    // Volumetric penetrating light cone beneath the head (NormalBlending so colors stay vivid on light spa backdrop)
    const beamTex = makeBeamTexture();
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      color: 0xe02845,
      transparent: true,
      opacity: 0.48,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeo = new THREE.CylinderGeometry(0.42, 0.98, 1.5, 48, 1, true);
    beamGeo.translate(0, -0.75, 0);
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = -0.08;
    wandHead.add(beamMesh);

    const headLight = new THREE.PointLight(0xe63950, 3.2, 4.5, 2);
    headLight.position.set(0, -0.35, 0);
    wandHead.add(headLight);

    // Expanding surface sonic / EMS rings on the epidermis
    const ringGeo = new THREE.RingGeometry(0.34, 0.4, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const pulseRings = Array.from({ length: 3 }, () => {
      const m = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: 0x1e9462,
          transparent: true,
          opacity: 0,
          blending: THREE.NormalBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      m.position.y = 0.39;
      root.add(m);
      return m;
    });

    // Biological micro-particles (drainage flow / purifying ions / EMS sparks)
    const pCount = 95;
    const pPos = new Float32Array(pCount * 3);
    const pOffsets = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * (W - 0.4);
      pPos[i * 3 + 1] = -0.9 + Math.random() * 1.2;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * (D - 0.4);
      pOffsets[i] = Math.random() * Math.PI * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.075,
      color: 0xe02845,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    root.add(particles);

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

    // ---------- Pause when off-screen (content-visibility: auto) ----------
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

    // ---------- Animation Loop ----------
    const clock = new THREE.Clock();
    const curColor = new THREE.Color(MODE_CONFIG[0].color);
    const tgtColor = new THREE.Color();
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
      curColor.lerp(tgtColor, 1 - Math.pow(0.03, dt));

      const pulse = 0.85 + 0.15 * Math.sin(t * 5);
      ledMat.color.copy(curColor);
      ledMat.emissive.copy(curColor);
      beamMat.color.copy(curColor);
      headLight.color.copy(curColor);
      pMat.color.copy(curColor);

      // Smoothly glide the treatment head across the skin surface
      const glideX = Math.sin(t * 0.78) * 1.25;
      const glideZ = Math.cos(t * 0.52) * 0.32;
      const sonicJitter = mode === 1 ? Math.sin(t * 68) * 0.012 : 0;
      wandHead.position.x = glideX + sonicJitter;
      wandHead.position.z = glideZ;
      wandHead.position.y = 0.58 + Math.sin(t * 1.56) * 0.025;
      wandHead.rotation.z = -Math.cos(t * 0.78) * 0.08;

      // Adapt volumetric beam penetration depth to active mode
      const targetScaleY = cfg.beamDepth / 1.5;
      currentDepth += (targetScaleY - currentDepth) * Math.min(1, dt * 4);
      beamMesh.scale.set(cfg.beamRadius / 0.95, currentDepth, cfg.beamRadius / 0.95);
      beamMat.opacity = (mode === 2 ? 0.34 : 0.44) * pulse;

      // Deform the epidermis subtly underneath the gliding head (visible lift / wave effect)
      const posAttr = epiGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const dist = Math.hypot(vx - glideX, vz - glideZ);
        const influence = Math.exp(-dist * dist * 1.4);
        const lift = mode === 0 || mode === 3 ? 0.075 * influence : 0.03 * influence;
        const ripple =
          mode === 1 ? Math.sin(dist * 9 - t * 9) * 0.022 * Math.exp(-dist * 0.7) : 0;
        posAttr.setY(i, epiBaseY[i] + lift + ripple);
      }
      posAttr.needsUpdate = true;
      epiGeo.computeVertexNormals();

      // Mode-specific biological layer reactions:
      // Mode 0 (630nm Red): Collagen fibers glow & tighten gently
      const colTarget = mode === 0 ? 1.15 * pulse : 0.12;
      collagenMat.emissive.copy(curColor);
      collagenMat.emissiveIntensity += (colTarget - collagenMat.emissiveIntensity) * Math.min(1, dt * 4);
      collagenGroup.scale.y = mode === 0 ? 0.92 + 0.08 * Math.sin(t * 2.5) : 1;

      // Mode 3 (EMS + 45°C): Deep muscle layer contracts rhythmically + thermal disc warms
      const muscTarget = mode === 3 ? 0.55 * (0.6 + 0.4 * Math.sin(t * 4.2)) : 0.02;
      muscleMat.emissiveIntensity += (muscTarget - muscleMat.emissiveIntensity) * Math.min(1, dt * 4);
      muscleBlock.scale.y = mode === 3 ? 1 + 0.07 * Math.sin(t * 4.2) : 1;
      const elecMat = electrode.material as THREE.MeshStandardMaterial;
      elecMat.emissiveIntensity += ((mode === 3 ? 0.95 : 0) - elecMat.emissiveIntensity) * Math.min(1, dt * 4);

      // Expanding surface pulse rings (visible in Drainage & EMS modes)
      pulseRings.forEach((ring, i) => {
        const p = (t * 0.7 + i / pulseRings.length) % 1;
        ring.position.x = glideX;
        ring.position.z = glideZ;
        ring.scale.setScalar(0.6 + p * 2.4);
        const rm = ring.material as THREE.MeshBasicMaterial;
        rm.color.copy(curColor);
        const ringAlpha = mode === 1 ? 0.55 : mode === 3 ? 0.4 : 0.2;
        rm.opacity = (1 - p) * ringAlpha;
      });

      // Animate biological micro-particles
      const pAttr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        let px = pAttr.getX(i);
        let py = pAttr.getY(i);
        const off = pOffsets[i];
        if (mode === 1) {
          // Drainage horizontal flow
          px += dt * 0.55;
          if (px > W / 2 - 0.2) px = -W / 2 + 0.2;
          py = -0.15 + Math.sin(t * 2 + off) * 0.22;
        } else if (mode === 2) {
          // Blue light surface calming
          py = 0.18 + Math.sin(t * 1.8 + off) * 0.14;
        } else if (mode === 3) {
          // EMS deep vertical micro-pulses
          py = -0.55 + Math.sin(t * 4.2 + off) * 0.35;
        } else {
          // Red 630nm collagen rising radiance
          py = -0.25 + Math.sin(t * 1.6 + off) * 0.3;
        }
        pAttr.setX(i, px);
        pAttr.setY(i, py);
      }
      pAttr.needsUpdate = true;

      // Very gentle showcase camera sway
      root.rotation.y = -0.22 + Math.sin(t * 0.35) * 0.08;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
      beamTex.dispose();
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
      className="relative overflow-hidden rounded-3xl border border-[#E6D7C8] bg-gradient-to-br from-[#FBF6F1] via-[#F5EAE0] to-[#EEDFD1] shadow-sm [content-visibility:auto] [contain-intrinsic-size:auto_none_auto_420px]"
    >
      {/* Top status badge */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1E1916] shadow-2xs backdrop-blur-md">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.css }} />
          Simulation 3D en temps réel
        </span>
        <span className="rounded-full bg-[#1E1916]/80 px-3 py-1 text-[11px] font-medium text-[#FAF5EF] backdrop-blur-md">
          {cfg.depthLabel}
        </span>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="h-[340px] sm:h-[420px] w-full" />

      {/* Biological Depth Legend */}
      <div className="pointer-events-none absolute bottom-3.5 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E5D5C6] bg-white/85 px-4 py-2 text-[11px] font-medium text-[#5C524B] backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F2CFB8] border border-[#D4B098]" />
          1. Épiderme (Surface)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E6B5A2] border border-[#C99480]" />
          2. Derme &amp; Collagène
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#C98878] border border-[#A8695A]" />
          3. Muscles Faciaux
        </span>
      </div>
    </div>
  );
}
