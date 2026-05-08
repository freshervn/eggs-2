"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type KeyState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ThreeDemo() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef<(() => void) | null>(null);
  const [locked, setLocked] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const keyState = useMemo<KeyState>(
    () => ({
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    }),
    [],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    setInitError(null);

    let raf = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.Fog(0x070a12, 10, 120);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 400);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.tabIndex = 0;
    mount.appendChild(renderer.domElement);

    // Minimal "pointer lock FPS" rig (no three/examples dependency).
    const pitch = new THREE.Object3D();
    pitch.add(camera);
    const yaw = new THREE.Object3D();
    const EYE_HEIGHT = 1.65;
    const PLAYER_RADIUS = 0.35;
    const PLAYER_HEIGHT = 1.7;
    yaw.position.set(0, EYE_HEIGHT, 6);
    yaw.add(pitch);
    scene.add(yaw);

    // Simple visible character (capsule-ish).
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8,
      metalness: 0.05,
    });
    const bodyGeo = new THREE.CapsuleGeometry(PLAYER_RADIUS, Math.max(0.1, PLAYER_HEIGHT - 2 * PLAYER_RADIUS), 8, 16);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = false;
    body.position.set(0, EYE_HEIGHT - PLAYER_HEIGHT / 2, 0);
    yaw.add(body);

    const hemi = new THREE.HemisphereLight(0xbdd7ff, 0x1f2937, 0.9);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(12, 18, 6);
    scene.add(dir);

    const floorGeo = new THREE.PlaneGeometry(240, 240, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1220,
      roughness: 1,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const grid = new THREE.GridHelper(240, 120, 0x334155, 0x1f2937);
    grid.position.y = 0.001;
    scene.add(grid);

    const boxes: THREE.Mesh[] = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMats = [
      new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        roughness: 0.4,
        metalness: 0.1,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        roughness: 0.5,
        metalness: 0.05,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.55,
        metalness: 0.0,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        roughness: 0.45,
        metalness: 0.05,
      }),
    ];
    for (let i = 0; i < 36; i++) {
      const m = boxMats[i % boxMats.length]!;
      const b = new THREE.Mesh(boxGeo, m);
      b.position.set((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40);
      b.rotation.y = Math.random() * Math.PI;
      b.scale.setScalar(0.8 + Math.random() * 1.8);
      boxes.push(b);
      scene.add(b);
    }

    const clock = new THREE.Clock();
    const velocity = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3(0, 0, 0);
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    let velY = 0;
    let grounded = true;
    const GRAVITY = 18; // units/s^2
    const JUMP_VELOCITY = 6.2; // units/s

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") keyState.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keyState.backward = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keyState.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keyState.right = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") keyState.sprint = true;
      if (e.code === "Space") {
        keyState.jump = true;
        e.preventDefault();
      }
      if (e.code.startsWith("Arrow")) e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") keyState.forward = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keyState.backward = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keyState.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keyState.right = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") keyState.sprint = false;
      if (e.code === "Space") {
        keyState.jump = false;
        e.preventDefault();
      }
      if (e.code.startsWith("Arrow")) e.preventDefault();
    };

    const onResize = () => resize();

    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      setLocked(isLocked);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      const mx = e.movementX || 0;
      const my = e.movementY || 0;
      yaw.rotation.y -= mx * 0.0022;
      pitch.rotation.x = clamp(pitch.rotation.x - my * 0.0022, -1.35, 1.35);
    };

    const requestLock = () => {
      renderer.domElement.focus();
      renderer.domElement.requestPointerLock?.();
    };

    const onCanvasClick = () => requestLock();

    lockRef.current = requestLock;

    document.addEventListener("pointerlockchange", onPointerLockChange);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: false });
    window.addEventListener("resize", onResize);
    renderer.domElement.addEventListener("click", onCanvasClick);

    const animate = () => {
      raf = window.requestAnimationFrame(animate);
      const dt = clamp(clock.getDelta(), 0, 0.05);

      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i]!;
        b.rotation.y += dt * 0.15 * (i % 2 === 0 ? 1 : -1);
      }

      if (document.pointerLockElement === renderer.domElement) {
        // Jump: rising edge only.
        if (keyState.jump && grounded) {
          grounded = false;
          velY = JUMP_VELOCITY;
        }

        direction.set(
          Number(keyState.right) - Number(keyState.left),
          0,
          Number(keyState.backward) - Number(keyState.forward),
        );
        if (direction.lengthSq() > 0) direction.normalize();

        const speed = keyState.sprint ? 9.5 : 6.0;
        velocity.x += (direction.x * speed - velocity.x) * (1 - Math.pow(0.001, dt));
        velocity.z += (direction.z * speed - velocity.z) * (1 - Math.pow(0.001, dt));

        forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.rotation.y);
        right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.rotation.y);

        yaw.position.addScaledVector(right, velocity.x * dt);
        yaw.position.addScaledVector(forward, -velocity.z * dt);

        // Gravity + ground.
        velY -= GRAVITY * dt;
        yaw.position.y += velY * dt;
        if (yaw.position.y <= EYE_HEIGHT) {
          yaw.position.y = EYE_HEIGHT;
          velY = 0;
          grounded = true;
        }

        yaw.position.x = clamp(yaw.position.x, -110, 110);
        yaw.position.z = clamp(yaw.position.z, -110, 110);
      } else {
        velocity.multiplyScalar(0.92);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(raf);
      lockRef.current = null;
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown as EventListener);
      window.removeEventListener("keyup", onKeyUp as EventListener);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onCanvasClick);

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock?.();
      }

      setLocked(false);

      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }

      boxGeo.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      boxMats.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, [keyState]);

  return (
    <div className="relative">
      <div ref={mountRef} className="h-[min(78dvh,680px)] w-full" />

      <div className="pointer-events-none absolute left-0 top-0 right-0 p-4">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 backdrop-blur">
          <span className="font-semibold text-slate-100">Controls</span>
          <span className="text-slate-400">Click to {locked ? "unlock" : "lock"} mouse</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">WASD + mouse</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">Shift = sprint</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">Space = jump</span>
        </div>
      </div>

      {!locked ? (
        <button
          type="button"
          onClick={() => {
            lockRef.current?.();
          }}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 text-sm font-semibold text-slate-100 backdrop-blur-[1px] transition hover:bg-slate-950/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          Click to start
        </button>
      ) : null}

      {initError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-6 text-center backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
            {initError}
          </div>
        </div>
      ) : null}
    </div>
  );
}

