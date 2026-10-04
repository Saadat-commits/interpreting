import * as THREE from "three";
import { gsap } from "gsap";
import type { ServiceSlug } from "@/config/services";
import { CameraRig, createStage } from "./core";
import * as K from "./kit";

/**
 * Startseiten-Diorama: eine Insel, sechs Leistungen, verbunden durch die HAMRAH-Linie.
 *  - setScroll(0..1): Kamera von „Überblick“ (Hero) zu „Auswahl“ (Service Selector)
 *  - focus(slug): Kamera fährt zum Objekt, Objekt hebt sich und zeigt seine Bewegung
 *  - Hover/Klick über Raycasting
 */

export interface DioramaApi {
  setScroll(p: number): void;
  focus(slug: ServiceSlug | null): void;
  dispose(): void;
}

const ORDER: ServiceSlug[] = ["reinigung", "umzug", "montage", "transport", "dolmetschen", "sicherheit"];
const ANGLES = [158, 202, 246, 294, 338, 22].map((d) => (d * Math.PI) / 180);
const RADIUS = 2.4;

export function createDiorama(
  canvas: HTMLCanvasElement,
  opts: { lite: boolean; reduced: boolean; colors: Record<ServiceSlug, string>; locale: "de" | "fa"; onHover?: (s: ServiceSlug | null) => void; onSelect?: (s: ServiceSlug) => void },
): DioramaApi {
  const stage = createStage(canvas, { lite: opts.lite, fov: opts.lite ? 34 : 30 });
  const ctx = gsap.context(() => {});
  const { scene, camera, requestRender } = stage;
  const rig = new CameraRig(camera);
  if (opts.lite) rig.designAspect = 1.05;
  stage.onResize = () => rig.apply();
  const C = opts.colors;

  scene.add(K.platform(3.85));
  if (!opts.lite) {
    scene.add(K.shadowFloor());
    scene.add(K.mountains());
  }

  const stations = new Map<ServiceSlug, { group: THREE.Group; inner: THREE.Group; ring: THREE.Mesh; pos: THREE.Vector3; play: () => gsap.core.Timeline }>();

  const build: Record<ServiceSlug, (g: THREE.Group) => () => gsap.core.Timeline> = {
    reinigung: (g) => {
      const b = K.bucket(C.reinigung);
      b.position.set(-0.18, 0, 0.05);
      const sp = K.sprayBottle(C.reinigung);
      sp.position.set(0.38, 0, 0.18);
      sp.rotation.y = -0.5;
      const sparks = [K.sparkle(K.palette.saffron, 0.09), K.sparkle("#FFFFFF", 0.07), K.sparkle(K.palette.saffron, 0.06)];
      sparks.forEach((s, i) => {
        s.position.set(-0.4 + i * 0.35, 0.95 + (i % 2) * 0.18, 0.1);
        s.scale.multiplyScalar(i === 1 ? 0.8 : 1);
      });
      g.add(b, sp, ...sparks);
      return () =>
        gsap
          .timeline()
          .to(b.rotation, { z: 0.18, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut" })
          .to(sparks.map((s) => s.rotation), { y: Math.PI, duration: 0.8, ease: "power2.out", stagger: 0.08 }, 0)
          .fromTo(sparks.map((s) => s.scale), { x: 0.2, y: 0.4, z: 0.2 }, { x: 0.6, y: 1.3, z: 0.6, duration: 0.5, stagger: 0.08, ease: "back.out(2)" }, 0);
    },
    umzug: (g) => {
      const boxes = [K.cardboardBox(0.72, 0.5, 0.56), K.cardboardBox(0.62, 0.46, 0.5), K.cardboardBox(0.5, 0.4, 0.44)];
      boxes[0].position.set(0, 0, 0);
      boxes[1].position.set(0.05, 0.5, 0.02);
      boxes[1].rotation.y = 0.18;
      boxes[2].position.set(-0.02, 0.96, 0);
      boxes[2].rotation.y = -0.12;
      const side = K.cardboardBox(0.5, 0.36, 0.44);
      side.position.set(0.66, 0, 0.18);
      side.rotation.y = 0.4;
      g.add(...boxes, side);
      return () =>
        gsap
          .timeline()
          .to([boxes[2].position, boxes[1].position], { y: "+=0.18", duration: 0.22, stagger: 0.07, yoyo: true, repeat: 1, ease: "power2.out" })
          .to(side.rotation, { y: 0.4 + Math.PI * 0.5, duration: 0.6, ease: "power2.inOut" }, 0);
    },
    montage: (g) => {
      const { sides, boards } = K.shelfParts(K.palette.wood);
      sides[0].position.set(-0.5, 0.7, 0);
      sides[1].position.set(0.5, 0.7, 0);
      boards.forEach((b, i) => b.position.set(0, 0.06 + i * 0.44, 0));
      const book = K.rbox(0.12, 0.3, 0.26, K.mat(C.montage), 0.02);
      book.position.set(-0.3, 0.65, 0);
      const book2 = K.rbox(0.1, 0.26, 0.26, K.mat(K.palette.saffron), 0.02);
      book2.position.set(-0.17, 0.63, 0);
      const pl = K.plant();
      pl.position.set(0.25, 0.94, 0);
      pl.scale.setScalar(0.8);
      const hm = K.hammer(C.montage);
      hm.position.set(0.82, 0, 0.3);
      hm.rotation.set(0, 0.4, -1.45);
      hm.position.y = 0.07;
      g.add(...sides, ...boards, book, book2, pl, hm);
      return () =>
        gsap
          .timeline()
          .to(hm.rotation, { z: -1.05, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.inOut" })
          .fromTo(boards.map((b) => b.position), { x: -0.25 }, { x: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" }, 0);
    },
    transport: (g) => {
      const v = K.vehicle("van", C.transport);
      v.rotation.y = 0.25;
      const pkg = K.cardboardBox(0.36, 0.28, 0.3);
      pkg.position.set(-1.1, 0, 0.35);
      g.add(v, pkg);
      const spin = { a: 0 };
      return () =>
        gsap
          .timeline()
          .to(v.position, { x: 0.35, duration: 0.45, ease: "power2.out", yoyo: true, repeat: 1 })
          .to(spin, { a: Math.PI * 3, duration: 0.9, ease: "power2.inOut", onUpdate: () => K.spinWheels(v, spin.a) }, 0);
    },
    dolmetschen: (g) => {
      const a = K.bubble("سلام", C.dolmetschen, "#FFFFFF", true);
      a.position.set(-0.3, 1.25, 0);
      a.scale.setScalar(0.8);
      const b = K.bubble("Hallo", K.palette.paper, K.palette.ink, false);
      b.position.set(0.35, 0.62, 0.2);
      b.scale.setScalar(0.72);
      b.rotation.y = -0.15;
      const p = K.person(C.dolmetschen, 0.7);
      p.position.set(-0.55, 0, 0.3);
      g.add(a, b, p);
      return () =>
        gsap
          .timeline()
          .to(a.scale, { x: 0.92, y: 0.92, z: 0.92, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" })
          .to(b.scale, { x: 0.84, y: 0.84, z: 0.84, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }, 0.3);
    },
    sicherheit: (g) => {
      const sh = K.shield(C.sicherheit, 0.95);
      sh.position.set(0, 0.85, 0);
      const p = K.person(C.sicherheit, 0.8);
      p.position.set(0.55, 0, 0.25);
      g.add(sh, p);
      return () => gsap.timeline().to(sh.rotation, { y: `+=${Math.PI * 2}`, duration: 1.1, ease: "power2.inOut" });
    },
  };

  ORDER.forEach((slug, i) => {
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const a = ANGLES[i];
    const pos = new THREE.Vector3(Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS);
    group.position.copy(pos);
    group.rotation.y = Math.atan2(-pos.x, 10 - pos.z) * 0.8;
    const play = build[slug](inner);
    const ring = K.focusRing(0.95);
    group.add(ring);
    group.traverse((o) => (o.userData.slug = slug));
    scene.add(group);
    stations.set(slug, { group, inner, ring, pos, play });
  });

  // HAMRAH-Linie verbindet alle Stationen
  const pts = ORDER.map((_, i) => {
    const a = ANGLES[i];
    return new THREE.Vector3(Math.cos(a) * (RADIUS - 0.95), 0.02, Math.sin(a) * (RADIUS - 0.95));
  });
  const line = K.routeLine([pts[0].clone().multiplyScalar(1.25), ...pts, pts[5].clone().multiplyScalar(1.25)], K.palette.saffron, 0.03);
  line.mesh.position.y = 0.01;
  scene.add(line.mesh);

  // Kamerazustände
  const hero = { pos: new THREE.Vector3(0, 5.6, 10.4), target: new THREE.Vector3(0, 0.9, -0.6) };
  const select = { pos: new THREE.Vector3(0, 6.4, 8.8), target: new THREE.Vector3(0, 0.3, -0.2) };
  rig.set(hero.pos, hero.target);
  requestRender();

  const tick = () => {
    rig.apply();
    requestRender();
  };

  let scroll = 0;
  let focused: ServiceSlug | null = null;
  let camTween: gsap.core.Tween | null = null;

  const baseCam = () => ({
    pos: hero.pos.clone().lerp(select.pos, scroll),
    target: hero.target.clone().lerp(select.target, scroll),
  });

  const moveCamera = (to: { pos: THREE.Vector3; target: THREE.Vector3 }, duration: number) => {
    camTween?.kill();
    if (opts.reduced || duration === 0) {
      rig.pos.copy(to.pos);
      rig.target.copy(to.target);
      tick();
      return;
    }
    const from = { p: 0 };
    const p0 = rig.pos.clone();
    const t0 = rig.target.clone();
    camTween = gsap.to(from, {
      p: 1,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        rig.pos.lerpVectors(p0, to.pos, from.p);
        rig.target.lerpVectors(t0, to.target, from.p);
        tick();
      },
    });
  };

  // Linie zeichnet sich beim ersten Erscheinen
  if (opts.reduced) {
    line.progress(1);
  } else {
    const lp = { p: 0 };
    ctx.add(() => gsap.to(lp, { p: 1, duration: 1.6, delay: 0.3, ease: "power2.inOut", onUpdate: () => (line.progress(lp.p), requestRender()) }));
  }

  const api: DioramaApi = {
    setScroll: (p) => ctx.add(() => {
      scroll = p;
      if (!focused) {
        camTween?.kill();
        const b = baseCam();
        rig.pos.copy(b.pos);
        rig.target.copy(b.target);
        tick();
      }
    }),
    focus: (slug) => ctx.add(() => {
      if (slug === focused) return;
      const prev = focused ? stations.get(focused) : null;
      focused = slug;
      if (prev) {
        gsap.to(prev.inner.position, { y: 0, duration: opts.reduced ? 0 : 0.4, ease: "power2.out", onUpdate: requestRender });
        gsap.to(prev.ring.material as THREE.MeshBasicMaterial, { opacity: 0, duration: opts.reduced ? 0 : 0.3, onUpdate: requestRender });
      }
      if (!slug) {
        moveCamera(baseCam(), 0.9);
        return;
      }
      const st = stations.get(slug)!;
      const target = st.pos.clone().setY(0.6);
      const out = st.pos.clone().setY(0).normalize();
      const camPos = target.clone().add(new THREE.Vector3(out.x * 2.2, 2.7, Math.max(out.z, 0) * 2.2 + 4.4));
      moveCamera({ pos: camPos, target }, 1.0);
      gsap.to(st.inner.position, { y: 0.22, duration: opts.reduced ? 0 : 0.45, ease: "power3.out", onUpdate: requestRender });
      gsap.to(st.ring.material as THREE.MeshBasicMaterial, { opacity: 0.9, duration: opts.reduced ? 0 : 0.35, onUpdate: requestRender });
      if (!opts.reduced) st.play().eventCallback("onUpdate", requestRender);
    }),
    dispose() {
      ctx.kill();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      stage.dispose();
      K.clearMaterialCache();
    },
  };

  // Raycasting für Hover / Klick; Maus-Parallaxe nur auf Desktop
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: ServiceSlug | null = null;
  const pick = (e: PointerEvent | MouseEvent): ServiceSlug | null => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...stations.values()].map((s) => s.inner), true)[0];
    return (hit?.object.userData.slug as ServiceSlug) ?? null;
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const s = pick(e);
    canvas.style.cursor = s ? "pointer" : "";
    if (s !== hovered) {
      hovered = s;
      opts.onHover?.(s);
    }
    if (!opts.reduced && !opts.lite && !focused) {
      const r = canvas.getBoundingClientRect();
      rig.offset.set(((e.clientX - r.left) / r.width - 0.5) * 0.6, -((e.clientY - r.top) / r.height - 0.5) * 0.3, 0);
      tick();
    }
  };
  const onLeave = () => {
    if (hovered) opts.onHover?.(null);
    hovered = null;
    ctx.add(() => gsap.to(rig.offset, { x: 0, y: 0, duration: 0.6, ease: "power2.out", onUpdate: tick }));
  };
  const onClick = (e: MouseEvent) => {
    const s = pick(e);
    if (s) opts.onSelect?.(s);
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);

  return api;
}
