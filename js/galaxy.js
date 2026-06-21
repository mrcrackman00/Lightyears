// galaxy.js — Phase 2: Three.js 3D star field with camera fly-to.
//
// createGalaxy(canvas) returns an API used by main.js:
//   buildField(stars)   build the THREE.Points cloud once
//   reveal() / hide()    fade the canvas + toggle interaction
//   highlight(star)      mark the user's star (glow sprite + pulsing ring)
//   flyTo(star)          animate the camera to the star (~2.5s) -> Promise
//   reset()              clear highlight, return camera home
//
// Star x/y/z are in parsecs (straight from the HYG catalog).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { colorForCi } from './stars.js';

const FLY_MS = 2500;
const LY_PER_PARSEC = 3.262;
const prefersReducedMotion =
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True if the browser can give us a WebGL context. */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/** Convert a hex string like "#AABFFF" to a THREE.Color. */
function hexToColor(hex) {
  return new THREE.Color(hex);
}

/** A soft radial-gradient sprite so points read as glowing stars, not squares. */
function makeStarTexture() {
  const size = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

export function createGalaxy(canvas) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100000
  );
  const HOME = new THREE.Vector3(0, 0, 0.0001); // origin = us, looking out
  camera.position.copy(HOME);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enabled = false; // off until revealed
  controls.minDistance = 1;
  controls.maxDistance = 4000;
  controls.target.set(0, 0, 0);

  const starTex = makeStarTexture();

  let field = null; // THREE.Points
  let highlightGroup = null; // glow sprite + ring
  let ringMesh = null;
  let glowSprite = null;
  let shellMesh = null; // Phase 3: translucent distance sphere
  let shellActive = false;

  // ----- field --------------------------------------------------------------
  function buildField(stars) {
    if (field) return; // build once

    const positions = [];
    const colors = [];
    const sizes = [];

    for (const s of stars) {
      if (
        !Number.isFinite(s.x) ||
        !Number.isFinite(s.y) ||
        !Number.isFinite(s.z)
      ) {
        continue;
      }
      positions.push(s.x, s.y, s.z);

      const col = hexToColor(colorForCi(s.ci));
      colors.push(col.r, col.g, col.b);

      // Brighter (lower mag) -> bigger point. mag roughly -1.5..6.5.
      const mag = Number.isFinite(s.mag) ? s.mag : 6;
      const size = THREE.MathUtils.clamp(7 - mag, 1.2, 9);
      sizes.push(size);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Custom shader so each point can have its own size + soft sprite.
    // uShellR < 0 disables the timeline "shell band" highlight (Phase 3).
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: starTex },
        uScale: { value: window.innerHeight / 2 },
        uShellR: { value: -1.0 }, // shell radius in parsecs (-1 = off)
        uBandWidth: { value: 1.0 }, // half-width of the lit band in parsecs
        uShellBoost: { value: 2.2 }, // brightness/size multiplier inside the band
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vBoost;
        uniform float uScale;
        uniform float uShellR;
        uniform float uBandWidth;
        uniform float uShellBoost;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float boost = 1.0;
          if (uShellR >= 0.0) {
            float d = length(position);
            float edge = abs(d - uShellR);
            // 1 at the shell, fading to 0 at the band edge.
            float band = 1.0 - smoothstep(0.0, uBandWidth, edge);
            boost = mix(0.6, uShellBoost, band); // dim stars outside the band
          }
          vBoost = boost;
          float pt = size * boost * (uScale / -mv.z);
          gl_PointSize = clamp(pt, 1.0, 96.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vBoost;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.02) discard;
          gl_FragColor = vec4(vColor * vBoost, 1.0) * tex;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    field = new THREE.Points(geo, material);
    scene.add(field);
  }

  // ----- highlight ----------------------------------------------------------
  function clearHighlight() {
    if (highlightGroup) {
      scene.remove(highlightGroup);
      highlightGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      highlightGroup = null;
      ringMesh = null;
      glowSprite = null;
    }
  }

  function highlight(star) {
    clearHighlight();
    const color = hexToColor(colorForCi(star.ci));
    const pos = new THREE.Vector3(star.x, star.y, star.z);

    highlightGroup = new THREE.Group();
    highlightGroup.position.copy(pos);

    // Big additive glow sprite.
    const glowMat = new THREE.SpriteMaterial({
      map: starTex,
      color: color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    glowSprite = new THREE.Sprite(glowMat);
    const dist = pos.length();
    const glowScale = THREE.MathUtils.clamp(dist * 0.12, 1.5, 14);
    glowSprite.scale.setScalar(glowScale);
    highlightGroup.add(glowSprite);

    // Thin pulsing ring around it.
    const r = glowScale * 0.9;
    const ringGeo = new THREE.RingGeometry(r, r * 1.08, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    ringMesh = new THREE.Mesh(ringGeo, ringMat);
    highlightGroup.add(ringMesh);

    scene.add(highlightGroup);
  }

  // ----- timeline shell (Phase 3) ------------------------------------------
  function ensureShellMesh() {
    if (shellMesh) return shellMesh;
    // Unit sphere we scale per scrub; BackSide so we see it from inside.
    const geo = new THREE.SphereGeometry(1, 48, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#8ab4ff'),
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    shellMesh = new THREE.Mesh(geo, mat);
    shellMesh.visible = false;
    scene.add(shellMesh);
    return shellMesh;
  }

  /**
   * Light up the shell of stars sitting `lightYears` from Earth (origin):
   * a faint translucent sphere at that radius + brightened band of stars.
   */
  function showShell(lightYears) {
    const R = Math.max(lightYears / LY_PER_PARSEC, 0.01); // parsecs
    ensureShellMesh();
    shellMesh.scale.setScalar(R);
    shellMesh.visible = true;
    shellActive = true;

    if (field) {
      const u = field.material.uniforms;
      u.uShellR.value = R;
      // Band scales a little with distance so far shells stay visible.
      u.uBandWidth.value = THREE.MathUtils.clamp(R * 0.08, 0.6, 4.0);
    }
  }

  function hideShell() {
    shellActive = false;
    if (shellMesh) shellMesh.visible = false;
    if (field) field.material.uniforms.uShellR.value = -1.0;
  }

  // ----- camera fly-to ------------------------------------------------------
  let flyAnim = null;

  function flyTo(star) {
    const target = new THREE.Vector3(star.x, star.y, star.z);

    // Stand a few parsecs back from the star, between us and it.
    const dist = target.length() || 1;
    const back = THREE.MathUtils.clamp(dist * 0.18, 2.5, 60);
    const dir = target.clone().normalize();
    const camTarget = target.clone().sub(dir.multiplyScalar(back));

    if (prefersReducedMotion) {
      camera.position.copy(camTarget);
      controls.target.copy(target);
      controls.update();
      return Promise.resolve();
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const t0 = performance.now();

    return new Promise((resolve) => {
      flyAnim = (now) => {
        const t = Math.min((now - t0) / FLY_MS, 1);
        const e = smoothstep(t);
        camera.position.lerpVectors(startPos, camTarget, e);
        controls.target.lerpVectors(startTarget, target, e);
        controls.update();
        if (t >= 1) {
          flyAnim = null;
          resolve();
        }
      };
    });
  }

  /**
   * Pull the camera back toward Earth (origin) far enough to take in a shell of
   * radius `lightYears`, looking at the center. Used when entering timeline mode.
   */
  function frameShell(lightYears) {
    const R = Math.max(lightYears / LY_PER_PARSEC, 1);
    const camTarget = new THREE.Vector3(0, 0, R * 1.6 + 6);
    const lookTarget = new THREE.Vector3(0, 0, 0);

    if (prefersReducedMotion) {
      camera.position.copy(camTarget);
      controls.target.copy(lookTarget);
      controls.update();
      return Promise.resolve();
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const t0 = performance.now();

    return new Promise((resolve) => {
      flyAnim = (now) => {
        const t = Math.min((now - t0) / FLY_MS, 1);
        const e = smoothstep(t);
        camera.position.lerpVectors(startPos, camTarget, e);
        controls.target.lerpVectors(startTarget, lookTarget, e);
        controls.update();
        if (t >= 1) {
          flyAnim = null;
          resolve();
        }
      };
    });
  }

  // ----- reveal / hide / reset ---------------------------------------------
  function reveal() {
    canvas.classList.add('is-visible');
    controls.enabled = true;
  }

  function hide() {
    canvas.classList.remove('is-visible');
    controls.enabled = false;
  }

  function reset() {
    clearHighlight();
    hideShell();
    flyAnim = null;
    camera.position.copy(HOME);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  // ----- loop + resize ------------------------------------------------------
  let running = true;
  const clock = new THREE.Clock();

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (field) field.material.uniforms.uScale.value = h / 2;
  }
  window.addEventListener('resize', onResize);

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) clock.getDelta(); // drop the gap
  });

  function tick(now) {
    requestAnimationFrame(tick);
    if (!running) return;

    if (flyAnim) flyAnim(now);

    // Pulse the highlight ring.
    if (ringMesh && glowSprite && !prefersReducedMotion) {
      const t = clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 2.2) * 0.12;
      ringMesh.scale.setScalar(pulse);
      ringMesh.material.opacity = 0.45 + Math.sin(t * 2.2) * 0.25;
      // Keep glow + ring facing the camera.
      ringMesh.quaternion.copy(camera.quaternion);
    }

    // Breathe the timeline shell so it reads as "alive".
    if (shellActive && shellMesh && !prefersReducedMotion) {
      const t = clock.getElapsedTime();
      shellMesh.material.opacity = 0.05 + (Math.sin(t * 1.6) * 0.5 + 0.5) * 0.06;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  return {
    buildField,
    reveal,
    hide,
    highlight,
    flyTo,
    frameShell,
    showShell,
    hideShell,
    reset,
    hasField: () => !!field,
  };
}
