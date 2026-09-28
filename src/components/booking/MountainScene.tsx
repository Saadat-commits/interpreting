"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 3D-Berglandschaft (Hindukusch-inspiriert): schneebedeckte Gipfel, grüne Täler und ein
 * türkisgrüner Bergsee wie in Band-e Amir. Die Kamera gleitet mit jedem Buchungsschritt
 * weiter über die Landschaft („auf die andere Seite“). Rein landschaftlich – keine religiösen Motive.
 *
 * `progress` 0…1 steuert die Kamerafahrt. Ohne WebGL wird eine gezeichnete Silhouette gezeigt.
 */
export function MountainScene({ progress, className = "" }: { progress: number; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const [fallback, setFallback] = useState(false);
  progressRef.current = progress;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { createNoise2D } = await import("simplex-noise");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      } catch {
        setFallback(true);
        return;
      }
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setClearColor(0xffffff, 1);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xffffff, 110, 300);
      const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 600);

      /* ---------- Gelände ---------- */
      // Fester Startwert → jede Besucherin sieht dieselben Berge
      let seed = 7;
      const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const noise = createNoise2D(rand);
      const W = 420;
      const D = 260;
      const geo = new THREE.PlaneGeometry(W, D, 240, 150);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position as import("three").BufferAttribute;
      const colors: number[] = [];
      const cValley = new THREE.Color("#5FAF82");
      const cMeadow = new THREE.Color("#2C8A5D");
      const cRock = new THREE.Color("#A9B6AF");
      const cRockDark = new THREE.Color("#7F958A");
      const cSnow = new THREE.Color("#FFFFFF");
      const tmp = new THREE.Color();

      const heightAt = (x: number, z: number) => {
        // Kammlinien (ridged noise) für scharfe Gipfel
        let h = 0;
        let amp = 1;
        let freq = 0.0065;
        for (let o = 0; o < 4; o++) {
          const n = 1 - Math.abs(noise(x * freq, z * freq));
          h += n * n * amp;
          amp *= 0.42;
          freq *= 2.1;
        }
        const back = Math.min(1, Math.max(0, (-z + 30) / 120)); // hinten höher
        const valley = Math.min(1, Math.max(0, (z - 10) / 60)); // weites Tal im Vordergrund
        return (h * 36 * (0.15 + 0.85 * back) + back * 18) * (1 - valley * 0.92) - 3;
      };

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = heightAt(x, z);
        pos.setY(i, y);
      }
      geo.computeVertexNormals();
      const normals = geo.attributes.normal as import("three").BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const slope = 1 - normals.getY(i); // 0 = flach
        const jitter = noise(pos.getX(i) * 0.3, pos.getZ(i) * 0.3) * 3;
        if (y + jitter > 26 && slope < 0.62) tmp.copy(cSnow);
        else if (y + jitter > 19) tmp.copy(cRock).lerp(cSnow, Math.max(0, (y - 19) / 9) * (1 - slope * 0.6));
        else if (y > 8) tmp.copy(cRockDark).lerp(cRock, (y - 8) / 11);
        else if (y > 1.5) tmp.copy(cMeadow).lerp(cRockDark, (y - 1.5) / 6.5);
        else tmp.copy(cValley).lerp(cMeadow, Math.max(0, y + 4) / 5.5);
        colors.push(tmp.r, tmp.g, tmp.b);
      }
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
      scene.add(terrain);

      /* ---------- Bergsee (Band-e Amir) ---------- */
      const lake = new THREE.Mesh(
        new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2),
        new THREE.MeshPhongMaterial({ color: "#8FD1BE", transparent: true, opacity: 0.82, shininess: 90, specular: new THREE.Color("#ffffff") }),
      );
      lake.position.y = -1.2;
      scene.add(lake);

      /* ---------- Wolken ---------- */
      const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, flatShading: true });
      const clouds: import("three").Group[] = [];
      for (let c = 0; c < 7; c++) {
        const g = new THREE.Group();
        for (let p = 0; p < 4; p++) {
          const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 + rand() * 2.4, 0), cloudMat);
          puff.position.set(p * 3 - 4, rand() * 1.4, rand() * 2);
          g.add(puff);
        }
        g.position.set(-160 + rand() * 320, 44 + rand() * 14, -110 + rand() * 70);
        clouds.push(g);
        scene.add(g);
      }

      /* ---------- Licht ---------- */
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8fbfa3, 1.25));
      const sun = new THREE.DirectionalLight(0xfffbf0, 1.35);
      sun.position.set(-60, 80, 40);
      scene.add(sun);

      /* ---------- Kamera & Animation ---------- */
      let mouseX = 0;
      let mouseY = 0;
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        mouseX = (e.clientX - r.left) / r.width - 0.5;
        mouseY = (e.clientY - r.top) / r.height - 0.5;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const resize = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(host);

      let camX = -90 + progressRef.current * 180;
      let raf = 0;
      let t = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        t += 0.016;
        const target = -90 + progressRef.current * 180;
        camX += (target - camX) * (reduceMotion ? 1 : 0.035);
        const drift = reduceMotion ? 0 : Math.sin(t * 0.25) * 2;
        const narrow = camera.aspect < 1.4 ? 1.35 : 1; // Handy: etwas weiter weg
        camera.position.set(camX + drift + mouseX * 6, 30 * narrow - mouseY * 3, 118 * narrow);
        camera.lookAt(camX * 0.9 + mouseX * 10, 34, -60);
        for (const [i, c] of clouds.entries()) {
          c.position.x += reduceMotion ? 0 : 0.02 + i * 0.004;
          if (c.position.x > 220) c.position.x = -220;
        }
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        geo.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setFallback(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={hostRef} className={`relative overflow-hidden ${className}`} aria-hidden="true">
      {fallback && (
        <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <path d="M0 230 L140 120 L220 170 L360 60 L470 150 L600 40 L720 150 L860 70 L980 160 L1100 90 L1200 150 V300 H0Z" fill="#7C8A83" />
          <path d="M360 60 L395 90 L375 88 L360 100 L345 86 Z M600 40 L640 75 L615 72 L600 86 L585 70 Z M860 70 L895 100 L870 97 L860 108 L848 96 Z" fill="#fff" />
          <path d="M0 260 C 200 220, 400 250, 600 235 C 800 220, 1000 250, 1200 238 V300 H0Z" fill="#2C8A5D" />
        </svg>
      )}
    </div>
  );
}
