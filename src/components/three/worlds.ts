import * as THREE from "three";
import { gsap } from "gsap";
import type { ServiceSlug } from "@/config/services";
import { CameraRig, createStage, type Stage } from "./core";
import * as K from "./kit";

/**
 * Szenen der Service Worlds. Jede Welt ist eine pausierte GSAP-Timeline:
 * Station i liegt bei Zeit i. setProgress(p) mit p ∈ [0, Stationen-1] – gesteuert vom Scrollen.
 */
export interface WorldApi {
  steps: number;
  setProgress(p: number): void;
  dispose(): void;
}

interface Ctx {
  stage: Stage;
  rig: CameraRig;
  tl: gsap.core.Timeline;
  color: string;
  lite: boolean;
  locale: "de" | "fa";
}

const tiny = 0.001;
const hide = (o: THREE.Object3D) => (o.scale.setScalar(tiny), o);
const cam = (ctx: Ctx, at: number, pos: [number, number, number], target: [number, number, number], duration = 1) => {
  ctx.tl.to(ctx.rig.pos, { x: pos[0], y: pos[1], z: pos[2], duration, ease: "power2.inOut" }, at);
  ctx.tl.to(ctx.rig.target, { x: target[0], y: target[1], z: target[2], duration, ease: "power2.inOut" }, at);
};
const pop = (tl: gsap.core.Timeline, o: THREE.Object3D, at: number, s = 1, duration = 0.4) =>
  tl.fromTo(o.scale, { x: tiny, y: tiny, z: tiny }, { x: s, y: s, z: s, duration, ease: "back.out(1.6)", immediateRender: false }, at);
const shrink = (tl: gsap.core.Timeline, o: THREE.Object3D, at: number, duration = 0.3) => tl.to(o.scale, { x: tiny, y: tiny, z: tiny, duration, ease: "power2.in" }, at);

function colorTween(tl: gsap.core.Timeline, m: THREE.MeshStandardMaterial, to: string, at: number, duration = 1) {
  const from = m.color.clone();
  const target = new THREE.Color(to);
  const p = { t: 0 };
  tl.to(p, { t: 1, duration, ease: "none", onUpdate: () => m.color.lerpColors(from, target, p.t) }, at);
}

/* ---------- Reinigung: Schmutz → Wasser → Reinigung → sauber → Buchung ---------- */
function cleaning(ctx: Ctx) {
  const { stage, tl, color } = ctx;
  const s = stage.scene;
  s.add(K.slab(7.4, 4.6));
  const tileMat = K.ownMat("#C9BFAA", { rough: 0.9 });
  const tile = K.rbox(4.4, 0.16, 2.8, tileMat, 0.06);
  tile.position.set(0.3, 0.08, 0);
  s.add(tile);

  const dirtMat = K.mat(K.palette.dirt, { rough: 1 });
  const spots: THREE.Mesh[] = [];
  const seed = [[-1.5, -0.8, 0.28], [-0.9, 0.6, 0.2], [-0.2, -0.3, 0.32], [0.5, 0.8, 0.18], [0.9, -0.7, 0.24], [1.5, 0.2, 0.3], [2, -0.9, 0.16], [-1.2, 0.05, 0.14], [1.2, 0.95, 0.12]];
  seed.forEach(([x, z, r]) => {
    const d = K.cyl(r, r, 0.012, dirtMat, 20);
    d.position.set(x + 0.3, 0.168, z);
    d.scale.set(1, 1, 0.75);
    d.receiveShadow = true;
    spots.push(d);
    s.add(d);
  });

  const b = K.bucket(color);
  b.position.set(-5, 0, 1.6);
  const spray = K.sprayBottle(color);
  spray.position.set(-2.9, 0, -1.6);
  spray.rotation.y = 0.6;
  s.add(b, spray);

  const drops = Array.from({ length: ctx.lite ? 6 : 10 }, (_, i) => {
    const d = K.sphere(0.07, K.mat("#8FD3E2", { rough: 0.1 }), 12);
    d.position.set(-1.6 + (i % 5) * 0.85, 3.2 + (i % 3) * 0.4, -0.7 + Math.floor(i / 5) * 1.3);
    d.scale.setScalar(tiny);
    s.add(d);
    return d;
  });

  const mop = new THREE.Group();
  const head = K.rbox(0.18, 0.1, 2.6, K.mat(color, { rough: 0.5 }), 0.04);
  head.position.y = 0.22;
  const stick = K.cyl(0.025, 0.025, 1.8, K.mat(K.palette.metal, { rough: 0.3, metal: 0.6 }), 8);
  stick.position.set(-0.45, 1.0, 0);
  stick.rotation.z = 0.55;
  mop.add(head, stick);
  mop.position.set(-2.5, 0, 0);
  hide(mop);
  s.add(mop);

  const sparks = [0, 1, 2, 3].map((i) => {
    const sp = K.sparkle(i % 2 ? "#FFFFFF" : K.palette.saffron, 0.16);
    sp.position.set(-1.2 + i * 1.1, 0.6 + (i % 2) * 0.3, -0.3 + (i % 2) * 0.5);
    hide(sp);
    s.add(sp);
    return sp;
  });
  const cal = K.calendarCard(color);
  cal.position.set(1.4, 1.2, -1.7);
  cal.rotation.x = -0.15;
  hide(cal);
  s.add(cal);

  ctx.rig.set(new THREE.Vector3(0, 5.4, 7.2), new THREE.Vector3(0.2, 0.2, 0));

  // 0 → 1 Wasser
  tl.to(b.position, { x: -2.9, duration: 0.6, ease: "power3.out" }, 0);
  drops.forEach((d, i) => {
    tl.fromTo(d.scale, { x: tiny, y: tiny, z: tiny }, { x: 0.8, y: 1.5, z: 0.8, duration: 0.1, immediateRender: false }, 0.2 + i * 0.05);
    tl.to(d.position, { y: 0.2, duration: 0.5, ease: "power2.in" }, 0.25 + i * 0.05);
    tl.to(d.scale, { x: 1.8, y: 0.15, z: 1.8, duration: 0.15 }, 0.75 + i * 0.05);
    shrink(tl, d, 0.92 + i * 0.05, 0.12);
  });
  // 1 → 2 Reinigung
  pop(tl, mop, 1, 1, 0.2);
  tl.to(mop.position, { x: 3, duration: 0.8, ease: "power1.inOut" }, 1.1);
  spots.forEach((d) => {
    const at = 1.1 + ((d.position.x + 2.5) / 5.5) * 0.8;
    shrink(tl, d, at, 0.12);
  });
  colorTween(tl, tileMat, "#DDD6C6", 1.1, 0.8);
  // 2 → 3 sauber
  colorTween(tl, tileMat, "#F7F4EE", 2, 0.6);
  tl.to(mop.position, { x: 4.6, z: 1.2, duration: 0.5, ease: "power2.in" }, 2);
  sparks.forEach((sp, i) => {
    pop(tl, sp, 2.2 + i * 0.1, 1);
    tl.to(sp.rotation, { y: Math.PI, duration: 0.6 }, 2.2 + i * 0.1);
  });
  // 3 → 4 Buchung
  sparks.forEach((sp, i) => tl.to(sp.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.3 }, 3 + i * 0.05));
  pop(tl, cal, 3.2, 1.1, 0.5);
  tl.fromTo(cal.rotation, { y: -0.8 }, { y: -0.15, duration: 0.6, ease: "power3.out", immediateRender: false }, 3.2);
  cam(ctx, 3, [0.8, 4.4, 6.4], [0.8, 0.8, -0.6]);
  return 5;
}

/* ---------- Umzug: Wohnung → Kartons → Packen → LKW → Route → Ankunft ---------- */
function moving(ctx: Ctx) {
  const { stage, tl, color } = ctx;
  const s = stage.scene;
  s.add(K.slab(12.4, 5.4));
  const floor = K.rbox(3.2, 0.08, 2.6, K.mat(K.palette.wood, { rough: 0.7 }), 0.03);
  floor.position.set(-3.6, 0.04, -0.3);
  const wallM = K.mat(K.palette.paper, { rough: 0.9 });
  const wallB = K.rbox(3.2, 1.5, 0.1, wallM, 0.03);
  wallB.position.set(-3.6, 0.75, -1.6);
  const wallL = K.rbox(0.1, 1.5, 2.6, wallM, 0.03);
  wallL.position.set(-5.2, 0.75, -0.3);
  s.add(floor, wallB, wallL);

  const so = K.sofa("#7F9A86");
  so.position.set(-3.9, 0.08, -1.05);
  const la = K.lamp();
  la.position.set(-2.4, 0.08, -1.2);
  const pl = K.plant();
  pl.position.set(-4.85, 0.08, 0.6);
  s.add(so, la, pl);
  const furniture = [so, la, pl];

  const boxes = [0, 1, 2, 3].map((i) => {
    const bx = K.openBox(0.62, 0.46, 0.5, color);
    bx.position.set(-4.5 + i * 0.75, 0.08, 0.45);
    hide(bx);
    s.add(bx);
    return bx;
  });

  const truck = K.vehicle("truck", color);
  truck.position.set(-9, 0, 1.75);
  s.add(truck);

  const roadPts = [new THREE.Vector3(-1.6, 0.01, 1.75), new THREE.Vector3(0.4, 0.01, 2.0), new THREE.Vector3(1.9, 0.01, 1.5), new THREE.Vector3(2.9, 0.01, 1.3)];
  const rd = K.road([new THREE.Vector3(-6.2, 0.01, 1.75), ...roadPts], 1.1);
  s.add(rd.mesh);
  const route = K.routeLine(roadPts.map((p) => p.clone().setY(0.04)), K.palette.saffron, 0.04);
  s.add(route.mesh);
  const routeCurve = route.curve;

  const home = K.house(color, 1.05);
  home.position.set(4.8, 0, -1.0);
  home.rotation.y = -0.5;
  s.add(home);
  if (!ctx.lite) {
    [[1.8, -1.4, 0.9], [3, -2, 1.1], [-0.6, -1.6, 0.8], [5.6, 1.3, 0.9]].forEach(([x, z, sc]) => {
      const t = K.tree(sc);
      t.position.set(x, 0, z);
      s.add(t);
    });
  }
  const p = K.pin();
  p.position.set(4.8, 2.1, -1.0);
  hide(p);
  s.add(p);

  ctx.rig.set(new THREE.Vector3(-2.6, 4.6, 6.6), new THREE.Vector3(-3.1, 0.5, -0.2));
  const wheelSpin = { a: 0 };
  const spin = () => K.spinWheels(truck, wheelSpin.a);

  // 0 → 1 Kartons
  boxes.forEach((bx, i) => {
    pop(tl, bx, 0.15 + i * 0.12);
    tl.fromTo(bx.position, { y: 1.2 }, { y: 0.08, duration: 0.4, ease: "bounce.out", immediateRender: false }, 0.15 + i * 0.12);
  });
  // 1 → 2 Packen
  furniture.forEach((f, i) => shrink(tl, f, 1.05 + i * 0.12, 0.35));
  boxes.forEach((bx, i) => {
    tl.to((bx.userData.lid as THREE.Group).rotation, { x: 0, duration: 0.35, ease: "power2.out" }, 1.4 + i * 0.1);
    tl.to((bx.userData.tape as THREE.Mesh).scale, { z: 1, duration: 0.2 }, 1.7 + i * 0.08);
  });
  // 2 → 3 LKW
  tl.to(truck.position, { x: roadPts[0].x, duration: 0.55, ease: "power2.out" }, 2);
  tl.to(wheelSpin, { a: 14, duration: 0.55, ease: "power2.out", onUpdate: spin }, 2);
  cam(ctx, 2, [-1.6, 5.6, 9.2], [-2.0, 0.5, 0.6], 0.8);
  boxes.forEach((bx, i) => {
    const at = 2.55 + i * 0.1;
    tl.to(bx.position, { x: roadPts[0].x - 1.1, z: 1.75, duration: 0.3, ease: "power1.inOut" }, at);
    tl.to(bx.position, { y: 0.9, duration: 0.15, ease: "power2.out", yoyo: true, repeat: 1 }, at);
    shrink(tl, bx, at + 0.25, 0.08);
  });
  // 3 → 4 Route
  const drive = { t: 0 };
  tl.to(
    drive,
    {
      t: 1,
      duration: 1,
      ease: "power1.inOut",
      onUpdate: () => {
        const pt = routeCurve.getPointAt(drive.t);
        truck.position.set(pt.x, 0, pt.z);
        truck.rotation.y = K.headingAt(routeCurve, drive.t);
        route.progress(drive.t);
        K.spinWheels(truck, 14 + drive.t * 30);
      },
    },
    3,
  );
  cam(ctx, 3, [1.6, 5.8, 9.4], [1.6, 0.5, 0.2]);
  // 4 → 5 Ankunft
  boxes.forEach((bx, i) => {
    const at = 4.15 + i * 0.12;
    tl.set(bx.position, { x: 2.0, y: 0.6, z: 1.3 }, at);
    pop(tl, bx, at, 0.85, 0.3);
    tl.to(bx.position, { x: 3.7 + (i % 2) * 0.7, y: 0, z: -0.15 + Math.floor(i / 2) * 0.6, duration: 0.35, ease: "power2.out" }, at);
  });
  pop(tl, p, 4.6, 1);
  tl.fromTo(p.position, { y: 2.8 }, { y: 2.1, duration: 0.4, ease: "bounce.out", immediateRender: false }, 4.6);
  cam(ctx, 4, [2.8, 5, 8.2], [3.8, 0.6, -0.3]);
  return 6;
}

/* ---------- Montage: Einzelteile → Werkzeuge → Montage → fertiges Möbel ---------- */
function assembly(ctx: Ctx) {
  const { stage, tl, color } = ctx;
  const s = stage.scene;
  s.add(K.slab(6.6, 4.6));
  const { sides, boards } = K.shelfParts(K.palette.wood);
  const flatSides = [new THREE.Vector3(-1.4, 0.04, 1.0), new THREE.Vector3(-1.4, 0.04, 0.4)];
  sides.forEach((p, i) => {
    p.rotation.z = Math.PI / 2;
    p.position.copy(flatSides[i]);
    s.add(p);
  });
  boards.forEach((b, i) => {
    b.position.set(1.1, 0.03 + i * 0.065, 0.8);
    b.rotation.y = 0.1;
    s.add(b);
  });

  const sd = K.screwdriver(color);
  const hm = K.hammer(color);
  const wr = K.wrench();
  const toolsRest = [
    { o: sd, pos: [2.2, 0.06, -0.2], rot: [0, 0.3, Math.PI / 2] },
    { o: hm, pos: [2.5, 0.06, 0.6], rot: [0, -0.4, Math.PI / 2] },
    { o: wr, pos: [1.9, 0.03, 1.5], rot: [0, 0.6, 0] },
  ] as const;
  toolsRest.forEach(({ o, pos, rot }) => {
    o.position.set(pos[0], 3, pos[2]);
    o.rotation.set(rot[0], rot[1], rot[2]);
    hide(o);
    s.add(o);
  });
  const screws = Array.from({ length: 6 }, (_, i) => {
    const sc = K.cyl(0.02, 0.02, 0.1, K.mat(K.palette.metal, { metal: 0.7, rough: 0.3 }), 6);
    sc.position.set(-0.2 + (i % 3) * 0.14, 0.05, 1.6 + Math.floor(i / 3) * 0.12);
    sc.rotation.z = Math.PI / 2;
    hide(sc);
    s.add(sc);
    return sc;
  });

  const items = [
    (() => {
      const g = new THREE.Group();
      g.add(K.rbox(0.12, 0.32, 0.28, K.mat(color), 0.02), K.rbox(0.1, 0.28, 0.28, K.mat(K.palette.saffron), 0.02));
      g.children[1].position.x = 0.13;
      g.position.set(-0.3, 0.6, -0.4);
      return g;
    })(),
    (() => {
      const g = K.plant();
      g.position.set(0.25, 0.94, -0.4);
      g.scale.setScalar(0.9);
      return g;
    })(),
    (() => {
      const g = K.cardboardBox(0.42, 0.3, 0.32, "#E7E2D6");
      g.position.set(0.1, 0.09, -0.4);
      return g;
    })(),
    (() => {
      const g = K.rbox(0.22, 0.22, 0.22, K.mat("#7F9A86"), 0.1);
      g.position.set(-0.25, 1.44, -0.4);
      return g;
    })(),
  ];
  items.forEach((it) => {
    hide(it);
    s.add(it);
  });
  const ring = K.focusRing(1.15);
  ring.position.set(0, 0.012, -0.4);
  s.add(ring);

  ctx.rig.set(new THREE.Vector3(0.6, 4.6, 6.4), new THREE.Vector3(0.3, 0.3, 0.2));

  // 0 → 1 Werkzeuge
  toolsRest.forEach(({ o, pos }, i) => {
    pop(tl, o, 0.1 + i * 0.12, 1, 0.2);
    tl.to(o.position, { y: pos[1], duration: 0.45, ease: "bounce.out" }, 0.1 + i * 0.12);
  });
  screws.forEach((sc, i) => pop(tl, sc, 0.5 + i * 0.04, 1, 0.2));
  // 1 → 2 Montage
  sides.forEach((p, i) => {
    tl.to(p.position, { x: i ? 0.5 : -0.5, y: 0.7, z: -0.4, duration: 0.45, ease: "power3.inOut" }, 1 + i * 0.12);
    tl.to(p.rotation, { z: 0, duration: 0.45, ease: "power3.inOut" }, 1 + i * 0.12);
  });
  boards.forEach((b, i) => {
    tl.to(b.position, { x: 0, y: 0.06 + i * 0.44, z: -0.4, duration: 0.4, ease: "power3.out" }, 1.35 + i * 0.1);
    tl.to(b.rotation, { y: 0, duration: 0.4 }, 1.35 + i * 0.1);
  });
  screws.forEach((sc, i) => shrink(tl, sc, 1.4 + i * 0.05, 0.15));
  tl.to(sd.position, { x: 0.62, y: 0.9, z: 0, duration: 0.3, ease: "power2.out" }, 1.45);
  tl.to(sd.rotation, { x: 0, y: 0, z: Math.PI / 2, duration: 0.3 }, 1.45);
  tl.to(sd.rotation, { x: Math.PI * 4, duration: 0.45, ease: "none" }, 1.55);
  tl.to(sd.position, { y: 0.5, duration: 0.25 }, 1.75);
  cam(ctx, 1, [0.4, 3.8, 5.8], [0, 0.6, -0.2]);
  // 2 → 3 fertig
  tl.to(sd.position, { x: 2.2, y: 0.06, z: -0.2, duration: 0.35, ease: "power2.inOut" }, 2);
  tl.to(sd.rotation, { x: 0, y: 0.3, z: Math.PI / 2, duration: 0.35 }, 2);
  items.forEach((it, i) => pop(tl, it, 2.25 + i * 0.12, 1));
  tl.to(ring.material as THREE.MeshBasicMaterial, { opacity: 0.9, duration: 0.4 }, 2.5);
  cam(ctx, 2, [-0.6, 3.2, 5.2], [0, 0.8, -0.4]);
  return 4;
}

/* ---------- Transport: Paket → Abholung → Fahrzeug → Route → Lieferung ---------- */
function transport(ctx: Ctx) {
  const { stage, tl, color } = ctx;
  const s = stage.scene;
  s.add(K.slab(11.2, 5));
  const a = K.house("#8F977F", 0.85);
  a.position.set(-4, 0, -1);
  const b = K.house(color, 0.85);
  b.position.set(4, 0, -1);
  s.add(a, b);
  const pts = [new THREE.Vector3(-3.4, 0.01, 0.75), new THREE.Vector3(-1.4, 0.01, 1.45), new THREE.Vector3(0.6, 0.01, 0.55), new THREE.Vector3(2.4, 0.01, 1.05), new THREE.Vector3(3.5, 0.01, 0.75)];
  const rd = K.road([new THREE.Vector3(-6, 0.01, 0.75), ...pts], 1.05);
  s.add(rd.mesh);
  const route = K.routeLine(pts.map((p) => p.clone().setY(0.04)), K.palette.saffron, 0.04);
  s.add(route.mesh);
  if (!ctx.lite) {
    [[-1.8, -1.2, 1], [0.4, -1.7, 1.2], [1.6, -0.9, 0.8], [-0.5, 2.2, 0.8], [2.1, 2.1, 1]].forEach(([x, z, sc]) => {
      const t = K.tree(sc);
      t.position.set(x, 0, z);
      s.add(t);
    });
  }
  const pkg = K.cardboardBox(0.46, 0.36, 0.38);
  pkg.position.set(-3.4, 0, -0.1);
  s.add(pkg);
  const p1 = K.pin();
  p1.position.set(-3.4, 0.4, -0.1);
  hide(p1);
  s.add(p1);
  const van = K.vehicle("van", color);
  van.position.set(-8, 0, 0.75);
  s.add(van);
  const done = K.sparkle(K.palette.saffron, 0.2);
  done.position.set(4, 2.2, -1);
  hide(done);
  s.add(done);

  ctx.rig.set(new THREE.Vector3(-2.4, 4.4, 6.6), new THREE.Vector3(-2.9, 0.4, -0.2));
  const sp = { a: 0 };

  // 0 → 1 Abholung
  pop(tl, p1, 0.1);
  tl.to(van.position, { x: pts[0].x, duration: 0.7, ease: "power2.out" }, 0.25);
  tl.to(sp, { a: 12, duration: 0.7, ease: "power2.out", onUpdate: () => K.spinWheels(van, sp.a) }, 0.25);
  // 1 → 2 Fahrzeug
  tl.to(pkg.position, { x: pts[0].x - 0.6, z: pts[0].z, duration: 0.5, ease: "power1.inOut" }, 1.1);
  tl.to(pkg.position, { y: 0.9, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, 1.1);
  shrink(tl, pkg, 1.55, 0.12);
  shrink(tl, p1, 1.2, 0.2);
  // 2 → 3 Route
  const drive = { t: 0 };
  tl.to(
    drive,
    {
      t: 1,
      duration: 1,
      ease: "power1.inOut",
      onUpdate: () => {
        const pt = route.curve.getPointAt(drive.t);
        van.position.set(pt.x, 0, pt.z);
        van.rotation.y = K.headingAt(route.curve, drive.t);
        route.progress(drive.t);
        K.spinWheels(van, 12 + drive.t * 36);
      },
    },
    2,
  );
  cam(ctx, 2, [0, 5.6, 8.2], [0, 0.3, 0]);
  // 3 → 4 Lieferung
  tl.set(pkg.position, { x: 3.2, y: 0.5, z: 0.75 }, 3.05);
  pop(tl, pkg, 3.05, 1, 0.25);
  tl.to(pkg.position, { x: 4, y: 0, z: -0.15, duration: 0.45, ease: "power2.out" }, 3.1);
  pop(tl, done, 3.5, 1);
  tl.to(done.rotation, { y: Math.PI * 2, duration: 0.5 }, 3.5);
  cam(ctx, 3, [2.6, 4.2, 6.2], [3.4, 0.5, -0.4]);
  return 5;
}

/* ---------- Dolmetschen: Sprache A → Dolmetscher → Sprache B → Termin → Einsatz ---------- */
function interpreting(ctx: Ctx) {
  const { stage, tl, color } = ctx;
  const s = stage.scene;
  s.add(K.slab(7, 4.4));
  const pa = K.person("#B77B57");
  pa.position.set(-2, 0, 0.3);
  pa.rotation.y = 0.5;
  const pi = K.person(color);
  pi.position.set(0, 0, -0.3);
  hide(pi);
  const pb = K.person("#5872A0");
  pb.position.set(2, 0, 0.3);
  pb.rotation.y = -0.5;
  s.add(pa, pi, pb);

  const ba = K.bubble("سلام", "#B77B57", "#FFFFFF", true);
  ba.position.set(-2.1, 1.75, 0.3);
  const bbWrap = K.bubble("Guten Tag", K.palette.paper, K.palette.ink, false, true);
  bbWrap.position.set(2.1, 1.75, 0.3);
  hide(bbWrap);
  s.add(ba, bbWrap);

  const arc1 = K.routeLine([new THREE.Vector3(-1.6, 1.55, 0.3), new THREE.Vector3(-0.9, 2.15, 0), new THREE.Vector3(-0.15, 1.35, -0.3)], color, 0.035);
  const arc2 = K.routeLine([new THREE.Vector3(0.15, 1.35, -0.3), new THREE.Vector3(0.9, 2.15, 0), new THREE.Vector3(1.6, 1.55, 0.3)], K.palette.saffron, 0.035);
  s.add(arc1.mesh, arc2.mesh);

  const cal = K.calendarCard(color);
  cal.position.set(0, 2.5, -0.9);
  hide(cal);
  const tb = K.table();
  tb.position.set(0, 0, 0.3);
  hide(tb);
  s.add(cal, tb);

  ctx.rig.set(new THREE.Vector3(0, 3.6, 7.6), new THREE.Vector3(0, 1.1, 0));
  const a1 = { p: 0 };
  const a2 = { p: 0 };

  // Startzustand Station 0: Sprache A sichtbar
  // 0 → 1 Dolmetscher
  pop(tl, pi, 0.1, 1, 0.45);
  tl.to(a1, { p: 1, duration: 0.6, ease: "power2.inOut", onUpdate: () => arc1.progress(a1.p) }, 0.35);
  // 1 → 2 Sprache B
  tl.to(a2, { p: 1, duration: 0.6, ease: "power2.inOut", onUpdate: () => arc2.progress(a2.p) }, 1);
  pop(tl, bbWrap, 1.5, 1, 0.4);
  tl.to(pb.userData.head.position, { y: "-=0.06", duration: 0.12, yoyo: true, repeat: 3 }, 1.6);
  // 2 → 3 Termin
  tl.to([ba.scale, bbWrap.scale], { x: 0.55, y: 0.55, z: 0.55, duration: 0.35 }, 2);
  tl.to(a1, { p: 0, duration: 0.3, onUpdate: () => arc1.progress(a1.p) }, 2);
  tl.to(a2, { p: 0, duration: 0.3, onUpdate: () => arc2.progress(a2.p) }, 2);
  pop(tl, cal, 2.3, 1.1, 0.45);
  cam(ctx, 2, [0, 3.4, 7], [0, 1.5, -0.3]);
  // 3 → 4 Einsatz
  shrink(tl, ba, 3, 0.25);
  shrink(tl, bbWrap, 3, 0.25);
  pop(tl, tb, 3.15, 1, 0.4);
  tl.to(pa.position, { x: -0.95, z: 0.85, duration: 0.5, ease: "power2.inOut" }, 3.2);
  tl.to(pb.position, { x: 0.95, z: 0.85, duration: 0.5, ease: "power2.inOut" }, 3.2);
  tl.to(pi.position, { z: -0.55, duration: 0.5, ease: "power2.inOut" }, 3.2);
  tl.to(cal.position, { x: 1.9, y: 1.7, z: -1.2, duration: 0.5 }, 3.2);
  tl.to(cal.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 0.5 }, 3.2);
  cam(ctx, 3, [0.4, 4.4, 5.6], [0, 0.6, 0.2]);
  return 5;
}

/* ---------- Sicherheit: Mitarbeiter → Qualifikation → Auftrag → unterwegs → Einsatz → Abschluss ---------- */
function security(ctx: Ctx) {
  const { stage, tl, color } = ctx;
  const s = stage.scene;
  s.add(K.slab(10.6, 5));
  const guard = K.person(color, 1.05);
  guard.position.set(-3.2, 0, 0.4);
  guard.rotation.y = 0.3;
  s.add(guard);

  const building = new THREE.Group();
  const blk = K.rbox(1.9, 2.3, 1.5, K.mat(K.palette.paper, { rough: 0.85 }), 0.06);
  blk.position.y = 1.15;
  building.add(blk);
  const winM = K.mat("#C9D4EA", { rough: 0.2 });
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const w = K.rbox(0.36, 0.38, 0.04, winM, 0.03);
      w.position.set(-0.55 + c * 0.55, 0.75 + r * 0.6, 0.76);
      building.add(w);
    }
  const door = K.rbox(0.5, 0.62, 0.05, K.mat(color), 0.04);
  door.position.set(0, 0.31, 0.76);
  building.add(door);
  building.position.set(3.2, 0, -0.9);
  s.add(building);

  const pts = [new THREE.Vector3(-3.2, 0.04, 0.4), new THREE.Vector3(-1.2, 0.04, 1.3), new THREE.Vector3(1.1, 0.04, 0.9), new THREE.Vector3(3.2, 0.04, 0.35)];
  const route = K.routeLine(pts, K.palette.saffron, 0.035);
  s.add(route.mesh);

  const badge = K.shield(color, 0.24);
  badge.position.set(-3.2, 2.6, 0.4);
  hide(badge);
  const cert = K.documentCard(4, K.palette.saffron);
  cert.position.set(-4.1, 1.3, -0.5);
  hide(cert);
  const order = K.documentCard(5, color);
  order.position.set(-2.1, 1.5, 0.1);
  order.rotation.set(-0.1, -0.25, 0.08);
  hide(order);
  const big = K.shield(color, 1.25, true);
  big.position.set(3.2, 3.3, -0.9);
  (big.userData.check as THREE.Mesh).scale.setScalar(tiny);
  hide(big);
  const scan = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.025, 8, 80), new THREE.MeshBasicMaterial({ color: K.palette.saffron, transparent: true, opacity: 0 }));
  scan.rotation.x = Math.PI / 2;
  scan.position.set(3.2, 0.05, -0.9);
  scan.scale.setScalar(0.4);
  const report = K.documentCard(4, K.palette.mint);
  report.position.set(1.6, 1.6, 0.7);
  report.rotation.y = -0.3;
  hide(report);
  s.add(badge, cert, order, big, scan, report);

  ctx.rig.set(new THREE.Vector3(-2.6, 3.9, 6.4), new THREE.Vector3(-3, 0.9, 0));

  // 0 → 1 Qualifikation
  pop(tl, badge, 0.1, 1, 0.3);
  tl.to(badge.position, { x: -3.12, y: 0.72, z: 0.62, duration: 0.5, ease: "power2.inOut" }, 0.2);
  pop(tl, cert, 0.3, 1, 0.4);
  tl.fromTo(cert.rotation, { y: Math.PI / 2 }, { y: 0.2, duration: 0.5, ease: "power3.out", immediateRender: false }, 0.3);
  // 1 → 2 Auftrag
  shrink(tl, cert, 1, 0.3);
  pop(tl, order, 1.2, 1, 0.45);
  // 2 → 3 unterwegs
  shrink(tl, order, 2, 0.25);
  const walk = { t: 0 };
  tl.to(
    walk,
    {
      t: 1,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        const pt = route.curve.getPointAt(walk.t);
        const bob = Math.abs(Math.sin(walk.t * Math.PI * 10)) * 0.05;
        guard.position.set(pt.x, bob, pt.z);
        badge.position.set(pt.x + 0.08, 0.72 + bob, pt.z + 0.22);
        guard.rotation.y = K.headingAt(route.curve, walk.t) + Math.PI / 2;
        route.progress(walk.t);
      },
    },
    2,
  );
  cam(ctx, 2, [1.2, 4.6, 7.6], [1.4, 0.9, -0.3]);
  // 3 → 4 Einsatz
  tl.to(guard.rotation, { y: 0, duration: 0.3 }, 3);
  pop(tl, big, 3.2, 1.25, 0.5);
  tl.to(scan.material, { opacity: 0.9, duration: 0.2 }, 3.3);
  tl.to(scan.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "power2.out" }, 3.3);
  // 4 → 5 Abschluss
  tl.to((big.userData.check as THREE.Mesh).scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: "back.out(2)" }, 4.1);
  tl.to(big.rotation, { y: Math.PI * 2, duration: 0.6, ease: "power2.inOut" }, 4.1);
  pop(tl, report, 4.4, 1, 0.4);
  tl.to(scan.material, { opacity: 0.35, duration: 0.3 }, 4.4);
  cam(ctx, 4, [2.4, 3.8, 6.4], [2.6, 1.6, -0.6]);
  return 6;
}

const builders: Record<ServiceSlug, (ctx: Ctx) => number> = {
  reinigung: cleaning,
  umzug: moving,
  montage: assembly,
  transport,
  dolmetschen: interpreting,
  sicherheit: security,
};

export function createWorld(canvas: HTMLCanvasElement, slug: ServiceSlug, opts: { lite: boolean; color: string; locale: "de" | "fa" }): WorldApi {
  const stage = createStage(canvas, { lite: opts.lite, fov: 30 });
  if (!opts.lite) stage.scene.add(K.shadowFloor());
  const rig = new CameraRig(stage.camera);
  rig.designAspect = opts.lite ? 1.3 : 1.55;
  stage.onResize = () => rig.apply();
  const tl = gsap.timeline({ paused: true });
  const ctx: Ctx = { stage, rig, tl, color: opts.color, lite: opts.lite, locale: opts.locale };
  const steps = builders[slug](ctx);
  const total = steps - 1;
  // Timeline auf exakt eine Zeiteinheit pro Station strecken
  tl.to({}, { duration: 0.001 }, total - 0.001);
  tl.eventCallback("onUpdate", () => {
    rig.apply();
    stage.requestRender();
  });
  tl.progress(0);
  rig.apply();
  stage.requestRender();

  return {
    steps,
    setProgress(p) {
      tl.time(Math.max(0, Math.min(total, p)));
      rig.apply();
      stage.requestRender();
    },
    dispose() {
      tl.kill();
      stage.dispose();
      K.clearMaterialCache();
    },
  };
}
