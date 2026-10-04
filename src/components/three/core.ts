import * as THREE from "three";

/**
 * Gemeinsame Bühne für alle HAMRAH-Szenen.
 * Gerendert wird nur auf Anforderung (requestRender) – nie in einer Dauer-Schleife.
 */
export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  lite: boolean;
  /** Wird nach jeder Größenänderung vor dem Rendern aufgerufen (z. B. Kamera neu ausrichten) */
  onResize: (() => void) | null;
  requestRender: () => void;
  dispose: () => void;
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function createStage(canvas: HTMLCanvasElement, opts: { lite: boolean; fov?: number }): Stage {
  const { lite } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: lite ? "low-power" : "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 30, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0bf, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-6, 11, 7);
  if (!lite) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -9;
    sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -9;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 30;
    sun.shadow.bias = -0.0008;
    sun.shadow.radius = 4;
  }
  scene.add(sun);
  const fillLight = new THREE.DirectionalLight(0xdfe9ff, 0.55);
  fillLight.position.set(7, 4, -3);
  scene.add(fillLight);

  let frame = 0;
  const render = () => {
    frame = 0;
    renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stage.onResize?.();
    requestRender();
  };
  const ro = new ResizeObserver(resize);

  const dispose = () => {
    ro.disconnect();
    if (frame) cancelAnimationFrame(frame);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mat) => {
        (mat as THREE.MeshStandardMaterial).map?.dispose();
        mat.dispose();
      });
    });
    renderer.dispose();
  };

  const stage: Stage = { scene, camera, renderer, lite, onResize: null, requestRender, dispose };
  ro.observe(canvas);
  resize();
  return stage;
}

/** Kamera-Ziel, das GSAP tweenen kann */
export class CameraRig {
  pos = new THREE.Vector3();
  target = new THREE.Vector3();
  offset = new THREE.Vector3();
  /** Seitenverhältnis, für das die Kamerapositionen gestaltet sind */
  designAspect = 1.35;
  constructor(private camera: THREE.PerspectiveCamera) {}
  set(pos: THREE.Vector3Like, target: THREE.Vector3Like) {
    this.pos.copy(pos as THREE.Vector3);
    this.target.copy(target as THREE.Vector3);
    this.apply();
  }
  apply() {
    // Hochformat (Handy): Kamera weiter zurück, damit die Szene vollständig sichtbar bleibt
    const a = this.camera.aspect;
    const zoom = a < this.designAspect ? this.designAspect / a : 1;
    this.camera.position.copy(this.pos).sub(this.target).multiplyScalar(zoom).add(this.target).add(this.offset);
    this.camera.lookAt(this.target);
  }
}
