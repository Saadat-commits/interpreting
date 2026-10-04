import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * HAMRAH-Formensprache: weiche Kanten, kompakte Proportionen, matte Materialien.
 * Alle Objekte entstehen prozedural – keine externen Modelle.
 */

export const palette = {
  stone: "#EFEBE2",
  stoneDeep: "#E2DCCF",
  paper: "#FAF8F3",
  ink: "#1E2A24",
  wood: "#D9B98C",
  woodDark: "#B8915F",
  card: "#C9955A",
  tape: "#E9D4A8",
  metal: "#A7B0B8",
  glass: "#2B3A44",
  saffron: "#E9A23B",
  mint: "#6EE7A0",
  dirt: "#6B5843",
  skin: "#E3B48F",
  leaf: "#5E8A62",
  mountain: "#B7B9A6",
  mountainDark: "#8F977F",
  snow: "#FFFFFF",
};

const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: { rough?: number; metal?: number; opacity?: number; emissive?: string } = {}) {
  const key = `${color}|${opts.rough ?? ""}|${opts.metal ?? ""}|${opts.opacity ?? ""}|${opts.emissive ?? ""}`;
  if (opts.opacity === undefined) {
    const hit = matCache.get(key);
    if (hit) return hit;
  }
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.7,
    metalness: opts.metal ?? 0,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? "#000000",
    emissiveIntensity: opts.emissive ? 0.35 : 0,
  });
  if (opts.opacity === undefined) matCache.set(key, m);
  return m;
}
/** Eigenes Material, wenn Farbe/Deckkraft animiert wird */
export const ownMat = (color: string, opts: { rough?: number; opacity?: number } = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.7, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1 });

export function clearMaterialCache() {
  matCache.forEach((m) => m.dispose());
  matCache.clear();
}

function shade<T extends THREE.Object3D>(o: T, cast = true, receive = true) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = cast;
      c.receiveShadow = receive;
    }
  });
  return o;
}

export function rbox(w: number, h: number, d: number, material: THREE.Material, r = 0.06) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), material);
  return shade(m);
}
export function cyl(rt: number, rb: number, h: number, material: THREE.Material, seg = 32) {
  return shade(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material));
}
export function sphere(r: number, material: THREE.Material, seg = 24) {
  return shade(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), material));
}

/** Unsichtbarer Boden, der nur Schatten zeigt */
export function shadowFloor(size = 30) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity: 0.12 }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/** Runde Insel als Bühne */
export function platform(radius = 4.4, color = palette.stone) {
  const g = new THREE.Group();
  const top = cyl(radius, radius, 0.32, mat(color, { rough: 0.9 }), 96);
  top.position.y = -0.16;
  const rim = cyl(radius + 0.02, radius - 0.15, 0.5, mat(palette.stoneDeep, { rough: 0.95 }), 96);
  rim.position.y = -0.55;
  g.add(top, rim);
  return g;
}

/** Rechteckige Bühne */
export function slab(w: number, d: number, color = palette.stone) {
  const s = rbox(w, 0.36, d, mat(color, { rough: 0.9 }), 0.16);
  s.position.y = -0.18;
  return s;
}

/* ---------- Objekte ---------- */

export function cardboardBox(w = 0.7, h = 0.55, d = 0.55, color = palette.card) {
  const g = new THREE.Group();
  const body = rbox(w, h, d, mat(color, { rough: 0.85 }), 0.04);
  body.position.y = h / 2;
  const tape = rbox(w * 0.22, 0.012, d + 0.01, mat(palette.tape, { rough: 0.6 }), 0.004);
  tape.position.y = h + 0.003;
  const label = rbox(0.18, 0.12, 0.01, mat(palette.paper), 0.01);
  label.position.set(w * 0.22, h * 0.55, d / 2 + 0.003);
  g.add(body, tape, label);
  return g;
}

/** Offener Karton mit Deckel (für „Packen“) */
export function openBox(w = 0.7, h = 0.5, d = 0.55, color = palette.card) {
  const g = new THREE.Group();
  const m = mat(color, { rough: 0.85 });
  const body = rbox(w, h, d, m, 0.03);
  body.position.y = h / 2;
  const lid = new THREE.Group();
  const lidMesh = rbox(w + 0.02, 0.04, d + 0.02, m, 0.015);
  lidMesh.position.z = (d + 0.02) / 2;
  lid.add(lidMesh);
  lid.position.set(0, h + 0.02, -(d + 0.02) / 2);
  lid.rotation.x = -1.9;
  const tape = rbox(w * 0.22, 0.012, d + 0.03, mat(palette.tape), 0.004);
  tape.position.y = h + 0.045;
  tape.scale.set(1, 1, 0.001);
  g.add(body, lid, tape);
  g.userData = { lid, tape };
  return g;
}

export function bucket(color: string) {
  const g = new THREE.Group();
  const body = cyl(0.42, 0.33, 0.62, mat(color, { rough: 0.45 }), 40);
  body.position.y = 0.31;
  const rim = shade(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 10, 40), mat(color, { rough: 0.4 })));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.62;
  const water = cyl(0.39, 0.39, 0.02, mat("#BFE7EF", { rough: 0.15 }), 40);
  water.position.y = 0.55;
  const handle = shade(new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.018, 8, 40, Math.PI), mat(palette.metal, { rough: 0.3, metal: 0.6 })));
  handle.position.y = 0.6;
  handle.rotation.y = Math.PI / 2;
  g.add(body, rim, water, handle);
  return g;
}

export function sprayBottle(color: string) {
  const g = new THREE.Group();
  const body = rbox(0.24, 0.48, 0.16, mat(palette.paper, { rough: 0.4 }), 0.06);
  body.position.y = 0.24;
  const neck = cyl(0.05, 0.06, 0.1, mat(color), 16);
  neck.position.y = 0.53;
  const head = rbox(0.18, 0.1, 0.1, mat(color), 0.03);
  head.position.set(0.04, 0.62, 0);
  const label = rbox(0.18, 0.18, 0.01, mat(color), 0.02);
  label.position.set(0, 0.22, 0.083);
  g.add(body, neck, head, label);
  return g;
}

export function sparkle(color = palette.saffron, s = 0.12) {
  const m = shade(new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), mat(color, { rough: 0.3, emissive: color })), true, false);
  m.scale.set(0.6, 1.3, 0.6);
  return m;
}

export function wheel(r = 0.17) {
  const g = new THREE.Group();
  const tire = cyl(r, r, 0.14, mat(palette.ink, { rough: 0.8 }), 24);
  tire.rotation.x = Math.PI / 2;
  const hub = cyl(r * 0.5, r * 0.5, 0.15, mat(palette.metal, { rough: 0.35, metal: 0.5 }), 16);
  hub.rotation.x = Math.PI / 2;
  g.add(tire, hub);
  return g;
}

/** Transporter (kind=van) oder LKW (kind=truck). Fährt in +x-Richtung. */
export function vehicle(kind: "van" | "truck", color: string) {
  const g = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const white = mat(palette.paper, { rough: 0.45 });
  const accent = mat(color, { rough: 0.5 });
  const glass = mat(palette.glass, { rough: 0.15, metal: 0.2 });
  if (kind === "van") {
    const body = rbox(1.5, 0.72, 0.78, accent, 0.14);
    body.position.set(-0.1, 0.56, 0);
    const nose = rbox(0.5, 0.42, 0.76, accent, 0.12);
    nose.position.set(0.72, 0.41, 0);
    const shield = rbox(0.06, 0.3, 0.66, glass, 0.03);
    shield.position.set(0.55, 0.76, 0);
    shield.rotation.z = -0.5;
    const side = rbox(0.34, 0.24, 0.02, glass, 0.03);
    side.position.set(0.38, 0.76, 0.395);
    const side2 = side.clone();
    side2.position.z = -0.395;
    const stripe = rbox(1.3, 0.06, 0.8, white, 0.02);
    stripe.position.set(-0.15, 0.48, 0);
    g.add(body, nose, shield, side, side2, stripe);
    [[-0.5, 0.39], [-0.5, -0.39], [0.62, 0.39], [0.62, -0.39]].forEach(([x, z]) => {
      const w = wheel();
      w.position.set(x, 0.17, z);
      wheels.push(w);
      g.add(w);
    });
  } else {
    const cargo = rbox(1.7, 1.05, 0.95, accent, 0.08);
    cargo.position.set(-0.35, 0.78, 0);
    const cab = rbox(0.62, 0.78, 0.9, white, 0.12);
    cab.position.set(0.86, 0.6, 0);
    const shield = rbox(0.06, 0.32, 0.76, glass, 0.03);
    shield.position.set(1.17, 0.78, 0);
    const bumper = rbox(0.1, 0.12, 0.92, mat(palette.ink), 0.04);
    bumper.position.set(1.18, 0.28, 0);
    const back = rbox(0.02, 0.92, 0.82, mat(palette.ink, { opacity: 0.12 }), 0.01);
    back.position.set(-1.21, 0.78, 0);
    g.add(cargo, cab, shield, bumper, back);
    [[-0.85, 0.45], [-0.85, -0.45], [0.85, 0.45], [0.85, -0.45]].forEach(([x, z]) => {
      const w = wheel(0.2);
      w.position.set(x, 0.2, z);
      wheels.push(w);
      g.add(w);
    });
  }
  g.userData.wheels = wheels;
  return g;
}

export function spinWheels(v: THREE.Object3D, angle: number) {
  (v.userData.wheels as THREE.Group[] | undefined)?.forEach((w) => (w.rotation.z = -angle));
}

export function person(color: string, h = 1) {
  const g = new THREE.Group();
  const body = shade(new THREE.Mesh(new THREE.CapsuleGeometry(0.2 * h, 0.42 * h, 6, 16), mat(color, { rough: 0.6 })));
  body.position.y = 0.42 * h;
  const head = sphere(0.15 * h, mat(palette.skin, { rough: 0.7 }));
  head.position.y = 0.98 * h;
  g.add(body, head);
  g.userData.head = head;
  return g;
}

/** Sprechblase mit Text (Canvas-Textur – Persisch wird vom Browser korrekt gesetzt) */
export function bubble(text: string, color: string, textColor = "#FFFFFF", rtl = false, tailRight = false) {
  const g = new THREE.Group();
  const w = 1.25;
  const h = 0.56;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 230;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 230);
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.font = `700 ${rtl ? 92 : 78}px ${rtl ? "Vazirmatn, Tahoma" : "Manrope, Arial"}, sans-serif`;
  ctx.fillText(text, 256, 120);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const base = mat(color, { rough: 0.55 });
  const body = rbox(w, h, 0.16, base, 0.2);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.82), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  face.position.z = 0.082;
  const tail = shade(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 4), base));
  tail.position.set(tailRight ? 0.32 : -0.32, -h / 2 - 0.07, 0);
  tail.rotation.z = Math.PI;
  g.add(body, face, tail);
  return g;
}

function extrude(shape: THREE.Shape, depth: number, material: THREE.Material, bevel = 0.04) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 });
  geo.center();
  return shade(new THREE.Mesh(geo, material));
}

export function shield(color: string, s = 1, withCheck = true) {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.62);
  sh.bezierCurveTo(0.22, 0.52, 0.4, 0.5, 0.5, 0.5);
  sh.bezierCurveTo(0.5, 0.05, 0.36, -0.36, 0, -0.62);
  sh.bezierCurveTo(-0.36, -0.36, -0.5, 0.05, -0.5, 0.5);
  sh.bezierCurveTo(-0.4, 0.5, -0.22, 0.52, 0, 0.62);
  const body = extrude(sh, 0.14, mat(color, { rough: 0.45 }));
  g.add(body);
  const ck = new THREE.Shape();
  ck.moveTo(-0.22, 0.02);
  ck.lineTo(-0.06, -0.14);
  ck.lineTo(0.24, 0.18);
  ck.lineTo(0.17, 0.25);
  ck.lineTo(-0.06, 0.01);
  ck.lineTo(-0.15, 0.1);
  ck.closePath();
  const check = extrude(ck, 0.04, mat(palette.paper, { rough: 0.4 }), 0.015);
  check.position.z = 0.11;
  check.visible = withCheck;
  g.add(check);
  g.scale.setScalar(s);
  g.userData.check = check;
  return g;
}

export function calendarCard(color: string) {
  const g = new THREE.Group();
  const card = rbox(1, 0.9, 0.08, mat(palette.paper, { rough: 0.5 }), 0.08);
  const band = rbox(1, 0.22, 0.09, mat(color, { rough: 0.5 }), 0.06);
  band.position.y = 0.34;
  g.add(card, band);
  const dot = mat(palette.stoneDeep);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) {
      const d = rbox(0.13, 0.1, 0.02, r === 1 && c === 2 ? mat(palette.saffron, { emissive: palette.saffron }) : dot, 0.02);
      d.position.set(-0.3 + c * 0.2, 0.1 - r * 0.17, 0.05);
      g.add(d);
    }
  return g;
}

export function documentCard(lines = 4, accent = palette.saffron) {
  const g = new THREE.Group();
  const card = rbox(0.74, 0.96, 0.05, mat(palette.paper, { rough: 0.5 }), 0.05);
  g.add(card);
  for (let i = 0; i < lines; i++) {
    const l = rbox(i === 0 ? 0.42 : 0.52, 0.05, 0.01, mat(i === 0 ? accent : palette.stoneDeep), 0.02);
    l.position.set(i === 0 ? -0.05 : 0, 0.3 - i * 0.16, 0.03);
    g.add(l);
  }
  return g;
}

export function house(color: string, s = 1) {
  const g = new THREE.Group();
  const body = rbox(1.3, 1, 1.1, mat(palette.paper, { rough: 0.8 }), 0.05);
  body.position.y = 0.5;
  // Dreiecksprisma: Spitze nach oben, Giebel zur Vorderseite
  const roofGeo = new THREE.CylinderGeometry(0.82, 0.82, 1.24, 3, 1).rotateX(-Math.PI / 2).scale(1, 0.55, 1);
  const roof = shade(new THREE.Mesh(roofGeo, mat(color, { rough: 0.7 })));
  roof.position.y = 1.225;
  const door = rbox(0.3, 0.5, 0.04, mat(palette.woodDark), 0.04);
  door.position.set(0, 0.25, 0.56);
  const win = rbox(0.28, 0.24, 0.04, mat("#CFE2EA", { rough: 0.2 }), 0.03);
  win.position.set(-0.4, 0.62, 0.56);
  const win2 = win.clone();
  win2.position.x = 0.4;
  g.add(body, roof, door, win, win2);
  g.scale.setScalar(s);
  g.userData.door = door;
  return g;
}

export function tree(s = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.05, 0.06, 0.3, mat(palette.woodDark), 8);
  trunk.position.y = 0.15;
  const crown = sphere(0.28, mat(palette.leaf, { rough: 0.85 }), 12);
  crown.position.y = 0.48;
  crown.scale.set(1, 1.15, 1);
  g.add(trunk, crown);
  g.scale.setScalar(s);
  return g;
}

export function mountains() {
  const g = new THREE.Group();
  const peaks: [number, number, number, number, string][] = [
    [-4.2, -5.6, 2.2, 3.0, palette.mountain],
    [-1.6, -6.4, 2.7, 4.0, palette.mountainDark],
    [1.3, -6.0, 2.4, 3.4, palette.mountain],
    [3.9, -5.6, 2.0, 2.7, palette.mountainDark],
  ];
  peaks.forEach(([x, z, r, h, c]) => {
    const m = shade(new THREE.Mesh(new THREE.ConeGeometry(r, h, 5, 1), mat(c, { rough: 1 })), false, true);
    m.position.set(x, h / 2 - 0.6, z);
    m.rotation.y = x;
    const snow = shade(new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, h * 0.32, 5, 1), mat(palette.snow, { rough: 0.9 })), false, false);
    snow.position.set(x, h - 0.6 - h * 0.16 + 0.01, z);
    snow.rotation.y = x;
    g.add(m, snow);
  });
  return g;
}

export function sofa(color: string) {
  const g = new THREE.Group();
  const m = mat(color, { rough: 0.85 });
  const seat = rbox(1.2, 0.26, 0.55, m, 0.08);
  seat.position.y = 0.22;
  const back = rbox(1.2, 0.42, 0.16, m, 0.07);
  back.position.set(0, 0.46, -0.2);
  const armL = rbox(0.16, 0.36, 0.55, m, 0.06);
  armL.position.set(-0.6, 0.3, 0);
  const armR = armL.clone();
  armR.position.x = 0.6;
  g.add(seat, back, armL, armR);
  return g;
}

export function lamp() {
  const g = new THREE.Group();
  const base = cyl(0.12, 0.14, 0.04, mat(palette.ink), 20);
  base.position.y = 0.02;
  const pole = cyl(0.015, 0.015, 0.9, mat(palette.ink), 8);
  pole.position.y = 0.47;
  const shadeM = cyl(0.12, 0.2, 0.22, mat(palette.paper, { rough: 0.6, emissive: "#FFE7B8" }), 24);
  shadeM.position.y = 0.95;
  g.add(base, pole, shadeM);
  return g;
}

export function plant() {
  const g = new THREE.Group();
  const pot = cyl(0.12, 0.09, 0.2, mat(palette.paper), 16);
  pot.position.y = 0.1;
  const leaves = sphere(0.18, mat(palette.leaf), 10);
  leaves.position.y = 0.32;
  g.add(pot, leaves);
  return g;
}

export function shelfParts(color: string) {
  const m = mat(color, { rough: 0.75 });
  const side = () => rbox(0.08, 1.4, 0.46, m, 0.02);
  const board = () => rbox(1.04, 0.06, 0.44, m, 0.02);
  return { sides: [side(), side()], boards: [board(), board(), board(), board()] };
}

export function screwdriver(color: string) {
  const g = new THREE.Group();
  const handle = cyl(0.06, 0.07, 0.3, mat(color, { rough: 0.45 }), 16);
  handle.position.y = 0.15;
  const shaft = cyl(0.015, 0.015, 0.34, mat(palette.metal, { rough: 0.25, metal: 0.8 }), 8);
  shaft.position.y = 0.47;
  g.add(handle, shaft);
  return g;
}

export function hammer(color: string) {
  const g = new THREE.Group();
  const handle = rbox(0.06, 0.6, 0.06, mat(palette.wood), 0.025);
  handle.position.y = 0.3;
  const head = rbox(0.34, 0.11, 0.11, mat(palette.metal, { rough: 0.3, metal: 0.7 }), 0.03);
  head.position.y = 0.62;
  const grip = rbox(0.075, 0.22, 0.075, mat(color), 0.03);
  grip.position.y = 0.12;
  g.add(handle, head, grip);
  return g;
}

export function wrench() {
  const g = new THREE.Group();
  const bar = rbox(0.62, 0.05, 0.1, mat(palette.metal, { rough: 0.3, metal: 0.7 }), 0.02);
  const jaw = shade(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 8, 16, Math.PI * 1.5), mat(palette.metal, { rough: 0.3, metal: 0.7 })));
  jaw.rotation.x = Math.PI / 2;
  jaw.position.x = 0.36;
  g.add(bar, jaw);
  return g;
}

export function table() {
  const g = new THREE.Group();
  const top = cyl(0.62, 0.62, 0.06, mat(palette.wood, { rough: 0.6 }), 40);
  top.position.y = 0.52;
  const leg = cyl(0.05, 0.08, 0.5, mat(palette.ink), 12);
  leg.position.y = 0.25;
  g.add(top, leg);
  return g;
}

/** Bodenmarke unter einem Objekt (Fokus-Zustand) */
export function focusRing(r = 0.75) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.88, r, 64), new THREE.MeshBasicMaterial({ color: palette.saffron, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  return m;
}

export function pin(color = palette.saffron) {
  const g = new THREE.Group();
  const head = sphere(0.16, mat(color, { rough: 0.35, emissive: color }), 20);
  head.position.y = 0.48;
  const tip = shade(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 16), mat(color, { rough: 0.35 })));
  tip.rotation.x = Math.PI;
  tip.position.y = 0.26;
  const dot = sphere(0.06, mat(palette.paper), 12);
  dot.position.set(0, 0.5, 0.12);
  g.add(head, tip, dot);
  return g;
}

/** Linie (HAMRAH-Linie) entlang einer Kurve, die sich per progress(0..1) zeichnet */
export function routeLine(points: THREE.Vector3[], color = palette.saffron, radius = 0.035) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const tubular = 160;
  const radial = 8;
  const geo = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  const mesh = new THREE.Mesh(geo, mat(color, { rough: 0.4, emissive: color }));
  mesh.castShadow = false;
  const total = geo.index ? geo.index.count : 0;
  const progress = (p: number) => {
    const n = Math.round(Math.max(0, Math.min(1, p)) * tubular);
    geo.setDrawRange(0, Math.min(total, n * radial * 6));
  };
  progress(0);
  return { mesh, curve, progress };
}

/** Flacher Weg (Straße) entlang einer Kurve */
export function road(points: THREE.Vector3[], width = 0.7) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const shape = new THREE.Shape();
  shape.moveTo(-0.01, -width / 2);
  shape.lineTo(0.01, -width / 2);
  shape.lineTo(0.01, width / 2);
  shape.lineTo(-0.01, width / 2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { steps: 120, bevelEnabled: false, extrudePath: curve });
  const m = new THREE.Mesh(geo, mat(palette.stoneDeep, { rough: 1 }));
  m.receiveShadow = true;
  return { mesh: m, curve };
}

/** Tangente einer Kurve in Gierwinkel umrechnen (Fahrzeug fährt in +x) */
export function headingAt(curve: THREE.Curve<THREE.Vector3>, t: number) {
  const tan = curve.getTangentAt(Math.max(0, Math.min(1, t)));
  return Math.atan2(-tan.z, tan.x);
}
