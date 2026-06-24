/**
 * Hero CAD viewport — a live, precise 2D drawing that constructs itself on load.
 *
 * Built on Three.js with an OrthographicCamera (true 2D, crisp thin strokes).
 * On load the geometry "draws itself" stroke-by-stroke via animated draw-range,
 * snap markers (□ endpoint, △ midpoint, ○ center) pop in where a real CAD engine
 * would snap, a faint blueprint grid sits behind everything, and a crosshair +
 * subtle camera parallax track the pointer so the viewport feels alive.
 *
 * Three.js is dynamically imported so it is code-split out of the initial bundle
 * and only fetched when the hero is actually on screen.
 *
 * Honors `prefers-reduced-motion`: renders the *final* state once, no rAF loop,
 * no pointer tracking — a clean static drawing.
 *
 * Colors are read from CSS custom properties (--accent, --ink, --grid, --accent-2)
 * so the canvas always matches the design tokens / logo-sampled accent.
 */
import gsap from 'gsap';
import type {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  Group,
  Vector3 as TVector3,
} from 'three';

export interface HeroCanvasHandle {
  destroy(): void;
}

/** Read a CSS custom property as a usable color string (with fallback). */
function cssColor(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export async function initHeroCanvas(
  canvas: HTMLCanvasElement,
): Promise<HeroCanvasHandle | null> {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  // Code-split: Three is only loaded here, when the hero mounts.
  const THREE = await import('three');

  // ---- Palette (sampled from design tokens) ---------------------------------
  const INK = new THREE.Color(cssColor('--ink', '#15171c'));
  const ACCENT = new THREE.Color(cssColor('--accent', '#1f6feb'));
  const ACCENT2 = new THREE.Color(cssColor('--accent-2', '#e8590c'));
  const GRID = new THREE.Color(cssColor('--grid', '#c9d4e3'));

  // ---- Renderer -------------------------------------------------------------
  const renderer: WebGLRenderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true, // transparent — the paper background shows through
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const scene: Scene = new THREE.Scene();

  // World extents the drawing is authored in. The camera fits to VIEW_H and a
  // width derived from the canvas aspect ratio.
  const VIEW_H = 3.6;
  let camera: OrthographicCamera = new THREE.OrthographicCamera(
    -VIEW_H,
    VIEW_H,
    VIEW_H,
    -VIEW_H,
    0.1,
    100,
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // ---- Helpers --------------------------------------------------------------
  const disposables: { dispose(): void }[] = [];

  function track<T extends { dispose(): void }>(o: T): T {
    disposables.push(o);
    return o;
  }

  /** A line strip from points, with animatable draw-range + opacity. */
  function makeLine(
    pts: TVector3[],
    color: THREE.Color,
    opacity = 1,
    loop = false,
  ) {
    const geom = track(new THREE.BufferGeometry().setFromPoints(pts));
    const mat = track(
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
    const line = loop
      ? new THREE.LineLoop(geom, mat)
      : new THREE.Line(geom, mat);
    return { line, geom, mat, count: pts.length };
  }

  /** Generate evenly sampled points along a circle / arc. */
  function arcPoints(
    cx: number,
    cy: number,
    r: number,
    a0 = 0,
    a1 = Math.PI * 2,
    segs = 96,
  ): TVector3[] {
    const pts: TVector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const a = a0 + ((a1 - a0) * i) / segs;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
    return pts;
  }

  const V = (x: number, y: number) => new THREE.Vector3(x, y, 0);

  // ---- Blueprint grid -------------------------------------------------------
  const gridGroup = new THREE.Group();
  scene.add(gridGroup);
  {
    const step = 0.5;
    const reach = 9;
    const minor: TVector3[] = [];
    for (let x = -reach; x <= reach; x += step) {
      minor.push(V(x, -reach), V(x, reach));
    }
    for (let y = -reach; y <= reach; y += step) {
      minor.push(V(-reach, y), V(reach, y));
    }
    const minorGeom = track(new THREE.BufferGeometry().setFromPoints(minor));
    const minorMat = track(
      new THREE.LineBasicMaterial({
        color: GRID,
        transparent: true,
        opacity: 0.35,
      }),
    );
    gridGroup.add(new THREE.LineSegments(minorGeom, minorMat));

    // Bolder axes through the origin.
    const axisGeom = track(
      new THREE.BufferGeometry().setFromPoints([
        V(-reach, 0),
        V(reach, 0),
        V(0, -reach),
        V(0, reach),
      ]),
    );
    const axisMat = track(
      new THREE.LineBasicMaterial({
        color: GRID,
        transparent: true,
        opacity: 0.6,
      }),
    );
    gridGroup.add(new THREE.LineSegments(axisGeom, axisMat));
  }

  // ---- The drawing: a small dimensioned mechanical plate --------------------
  // Each "stroke" is revealed in sequence; markers pop in afterwards.
  const draw = new THREE.Group();
  scene.add(draw);

  type Stroke = { geom: THREE.BufferGeometry; total: number };
  const strokes: Stroke[] = [];

  function addStroke(
    pts: TVector3[],
    color: THREE.Color,
    opacity = 1,
    loop = false,
  ) {
    const { line, geom, count } = makeLine(pts, color, opacity, loop);
    draw.add(line);
    strokes.push({ geom, total: count });
    return geom;
  }

  // Outer plate (closed rectangle with chamfered top-right corner).
  addStroke(
    [
      V(-2.6, -1.5),
      V(2.2, -1.5),
      V(2.6, -1.1),
      V(2.6, 1.5),
      V(-2.6, 1.5),
      V(-2.6, -1.5),
    ],
    INK,
  );

  // Two bolt-hole circles.
  addStroke(arcPoints(-1.6, 0.55, 0.42), INK);
  addStroke(arcPoints(1.55, -0.55, 0.42), INK);

  // A filleted arc detail (quarter arc) + a connecting polyline.
  addStroke(arcPoints(0.2, 0.2, 0.9, Math.PI, Math.PI * 1.5), ACCENT, 1);
  addStroke([V(0.2, -0.7), V(1.1, -0.7), V(1.1, 0.2)], ACCENT, 1);

  // A construction diagonal (lighter accent-2, like a reference line).
  addStroke([V(-2.6, -1.5), V(2.6, 1.5)], ACCENT2, 0.55);

  // ---- Dimension line (extension + arrows) ----------------------------------
  const dim = new THREE.Group();
  draw.add(dim);
  {
    const y = -2.05;
    const a = -2.6;
    const b = 2.6;
    // extension lines + dimension line
    const dimGeom = track(
      new THREE.BufferGeometry().setFromPoints([
        V(a, -1.5),
        V(a, y - 0.12),
        V(b, -1.5),
        V(b, y - 0.12),
        V(a, y),
        V(b, y),
      ]),
    );
    const dimMat = track(
      new THREE.LineBasicMaterial({
        color: ACCENT2,
        transparent: true,
        opacity: 0.9,
      }),
    );
    dim.add(new THREE.LineSegments(dimGeom, dimMat));
    // arrowheads
    const ah = 0.12;
    const arrows = track(
      new THREE.BufferGeometry().setFromPoints([
        V(a, y),
        V(a + ah, y + ah * 0.6),
        V(a, y),
        V(a + ah, y - ah * 0.6),
        V(b, y),
        V(b - ah, y + ah * 0.6),
        V(b, y),
        V(b - ah, y - ah * 0.6),
      ]),
    );
    dim.add(new THREE.LineSegments(arrows, dimMat));
  }
  dim.scale.set(1, 1, 1);

  // ---- Snap markers (□ endpoint, △ midpoint, ○ center) ----------------------
  type Marker = { group: Group; mat: THREE.LineBasicMaterial };
  const markers: Marker[] = [];

  function markerSquare(x: number, y: number, s = 0.12) {
    const mat = track(
      new THREE.LineBasicMaterial({ color: ACCENT, transparent: true }),
    );
    const geom = track(
      new THREE.BufferGeometry().setFromPoints([
        V(-s, -s),
        V(s, -s),
        V(s, s),
        V(-s, s),
      ]),
    );
    const g = new THREE.Group();
    g.add(new THREE.LineLoop(geom, mat));
    g.position.set(x, y, 0.01);
    g.scale.setScalar(0);
    draw.add(g);
    markers.push({ group: g, mat });
  }

  function markerTriangle(x: number, y: number, s = 0.15) {
    const mat = track(
      new THREE.LineBasicMaterial({ color: ACCENT, transparent: true }),
    );
    const geom = track(
      new THREE.BufferGeometry().setFromPoints([
        V(-s, -s * 0.7),
        V(s, -s * 0.7),
        V(0, s * 0.8),
      ]),
    );
    const g = new THREE.Group();
    g.add(new THREE.LineLoop(geom, mat));
    g.position.set(x, y, 0.01);
    g.scale.setScalar(0);
    draw.add(g);
    markers.push({ group: g, mat });
  }

  function markerCenter(x: number, y: number, r = 0.14) {
    const mat = track(
      new THREE.LineBasicMaterial({ color: ACCENT2, transparent: true }),
    );
    const g = new THREE.Group();
    g.add(new THREE.LineLoop(track(new THREE.BufferGeometry().setFromPoints(arcPoints(0, 0, r, 0, Math.PI * 2, 24))), mat));
    // little cross in the middle
    const cross = track(
      new THREE.BufferGeometry().setFromPoints([
        V(-r * 1.5, 0),
        V(r * 1.5, 0),
        V(0, -r * 1.5),
        V(0, r * 1.5),
      ]),
    );
    g.add(new THREE.LineSegments(cross, mat));
    g.position.set(x, y, 0.01);
    g.scale.setScalar(0);
    draw.add(g);
    markers.push({ group: g, mat });
  }

  // Endpoints at plate corners, centers at holes, midpoint on the bottom edge.
  markerSquare(-2.6, 1.5);
  markerSquare(2.6, 1.5);
  markerSquare(2.6, -1.1);
  markerTriangle(-0.2, -1.5);
  markerCenter(-1.6, 0.55);
  markerCenter(1.55, -0.55);

  // ---- Crosshair (follows pointer) ------------------------------------------
  const crosshair = new THREE.Group();
  scene.add(crosshair);
  {
    const reach = 12;
    const gap = 0.18; // AutoCAD-style aperture gap at the center
    const chGeom = track(
      new THREE.BufferGeometry().setFromPoints([
        V(-reach, 0),
        V(-gap, 0),
        V(gap, 0),
        V(reach, 0),
        V(0, -reach),
        V(0, -gap),
        V(0, gap),
        V(0, reach),
      ]),
    );
    const chMat = track(
      new THREE.LineBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.45,
      }),
    );
    crosshair.add(new THREE.LineSegments(chGeom, chMat));
    // small pick-box at the center
    const box = 0.1;
    const pickGeom = track(
      new THREE.BufferGeometry().setFromPoints([
        V(-box, -box),
        V(box, -box),
        V(box, box),
        V(-box, box),
      ]),
    );
    crosshair.add(new THREE.LineLoop(pickGeom, chMat));
  }

  // ---- Sizing / resize ------------------------------------------------------
  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const aspect = w / h;
    camera.top = VIEW_H;
    camera.bottom = -VIEW_H;
    camera.left = -VIEW_H * aspect;
    camera.right = VIEW_H * aspect;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
  }
  resize();

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);

  // ---- Pointer parallax + crosshair tracking --------------------------------
  // pointer in NDC-ish space, mapped to world via the current frustum.
  const pointer = { x: 0, y: 0 };
  const camTarget = { x: 0, y: 0 };
  const crossTarget = { x: 0, y: 0 };

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.x = nx;
    pointer.y = ny;
    // crosshair follows pointer across the full frustum
    crossTarget.x = nx * camera.right;
    crossTarget.y = ny * camera.top;
    // camera drifts a touch the *opposite* way for parallax depth
    camTarget.x = -nx * 0.22;
    camTarget.y = -ny * 0.16;
  }
  // Track the pointer across the whole hero, not just the canvas, so the
  // crosshair feels connected to the cursor even over the text.
  const hero = canvas.closest('[data-hero]') ?? canvas;
  hero.addEventListener('pointermove', onPointerMove as EventListener);

  // ---- Visibility: pause rAF when offscreen / tab hidden --------------------
  let onScreen = true;
  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries[0]?.isIntersecting ?? true;
      if (onScreen) startLoop();
    },
    { threshold: 0.01 },
  );
  io.observe(canvas);

  // ---- Intro timeline (draw-on-load) ----------------------------------------
  // Start every stroke hidden.
  for (const s of strokes) s.geom.setDrawRange(0, 0);
  draw.scale.setScalar(0.985);

  function revealAllInstantly() {
    for (const s of strokes) s.geom.setDrawRange(0, s.total);
    for (const m of markers) m.group.scale.setScalar(1);
    draw.scale.setScalar(1);
    renderer.render(scene, camera);
  }

  let intro: gsap.core.Timeline | null = null;

  if (prefersReducedMotion) {
    // Static final state — render once, no animation loop, no pointer tracking.
    crosshair.visible = false;
    revealAllInstantly();
  } else {
    intro = gsap.timeline({ delay: 0.15 });
    // Reveal each stroke by animating its draw-range.
    strokes.forEach((s, i) => {
      const state = { c: 0 };
      intro!.to(
        state,
        {
          c: s.total,
          duration: 0.55,
          ease: 'power2.out',
          onUpdate: () => s.geom.setDrawRange(0, Math.ceil(state.c)),
        },
        i === 0 ? 0 : '-=0.32',
      );
    });
    // Pop the snap markers in once their geometry exists.
    markers.forEach((m, i) => {
      intro!.to(
        m.group.scale,
        { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(2.2)' },
        0.9 + i * 0.12,
      );
    });
    intro.to(draw.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'power3.out' }, 0);
  }

  // ---- Render loop ----------------------------------------------------------
  let rafId = 0;
  let running = false;

  function frame() {
    if (!running) return;
    // Ease camera + crosshair toward their targets for a fluid, weighty feel.
    camera.position.x += (camTarget.x - camera.position.x) * 0.06;
    camera.position.y += (camTarget.y - camera.position.y) * 0.06;
    crosshair.position.x += (crossTarget.x - crosshair.position.x) * 0.12;
    crosshair.position.y += (crossTarget.y - crosshair.position.y) * 0.12;
    // Subtle parallax on the grid (moves less than the drawing -> depth).
    gridGroup.position.x = camera.position.x * 0.4;
    gridGroup.position.y = camera.position.y * 0.4;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (prefersReducedMotion || running || !onScreen) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function onVisibility() {
    if (document.hidden) stopLoop();
    else startLoop();
  }
  document.addEventListener('visibilitychange', onVisibility);

  if (!prefersReducedMotion) startLoop();

  // ---- Teardown -------------------------------------------------------------
  function destroy() {
    stopLoop();
    intro?.kill();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    hero.removeEventListener('pointermove', onPointerMove as EventListener);
    for (const d of disposables) d.dispose();
    renderer.dispose();
  }

  return { destroy };
}
