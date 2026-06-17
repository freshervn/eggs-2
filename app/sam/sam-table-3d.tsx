"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { useMemo } from "react";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "2";

export type Sam3DCard = {
  id: string;
  rank: Rank;
  suit: Suit;
  value: number;
};

function suitColor(suit: Suit) {
  return suit === "♥" || suit === "♦" ? "#e11d48" : "#0f172a";
}

function CardBack({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.05, 1.45, 0.06]} radius={0.12} smoothness={4}>
        <meshStandardMaterial color="#0b1220" roughness={0.55} metalness={0.1} />
      </RoundedBox>
      <RoundedBox args={[1.0, 1.4, 0.02]} radius={0.11} smoothness={4} position={[0, 0, 0.031]}>
        <meshStandardMaterial color="#1d4ed8" roughness={0.65} metalness={0.05} />
      </RoundedBox>
    </group>
  );
}

function OpponentHand({
  label,
  count,
  center,
  rotation,
}: {
  label: string;
  count: number;
  center: [number, number, number];
  rotation: [number, number, number];
}) {
  const layout = useMemo(() => {
    const n = Math.min(10, Math.max(0, count));
    const spread = Math.min(0.5, 0.18 + n * 0.02);
    const start = -((Math.max(n, 1) - 1) * spread) / 2;
    const angle = Math.min(0.22, 0.08 + n * 0.01);
    return { n, start, spread, angle };
  }, [count]);

  const [cx, cy, cz] = center;

  return (
    <group>
      <Text position={[cx, cy + 0.18, cz]} fontSize={0.18} color="#cbd5e1" anchorX="center" anchorY="middle">
        {label} · {count}
      </Text>
      <group position={center} rotation={rotation}>
        {Array.from({ length: layout.n }).map((_, idx) => {
          const x = layout.start + idx * layout.spread;
          const rotZ = (idx - (layout.n - 1) / 2) * (layout.angle / Math.max(1, layout.n - 1));
          return (
            <CardBack
              key={`${label}_${idx}`}
              position={[x, 0.02 + idx * 0.004, idx * -0.01]}
              rotation={[-Math.PI / 2, 0, rotZ]}
            />
          );
        })}
      </group>
    </group>
  );
}

function CardMesh({
  card,
  disabled,
  highlight,
  selected,
  position,
  rotationX = 0,
  rotationZ,
  onClick,
}: {
  card: Sam3DCard;
  disabled?: boolean;
  highlight?: boolean;
  selected?: boolean;
  position: [number, number, number];
  rotationX?: number;
  rotationZ: number;
  onClick?: () => void;
}) {
  const base = selected ? "#e0f2fe" : highlight ? "#fff7ed" : "#ffffff";
  const border = selected ? "#38bdf8" : highlight ? "#fb923c" : "#e2e8f0";
  const emissive = selected ? "#38bdf8" : highlight ? "#fdba74" : "#000000";
  const opacity = disabled ? 0.55 : 1;

  return (
    <group position={position} rotation={[rotationX, 0, rotationZ]}>
      <RoundedBox
        args={[1.05, 1.45, 0.06]}
        radius={0.12}
        smoothness={4}
        onClick={disabled ? undefined : onClick}
      >
        <meshStandardMaterial color={base} emissive={emissive} emissiveIntensity={0.16} transparent opacity={opacity} />
      </RoundedBox>
      <RoundedBox args={[1.09, 1.49, 0.02]} radius={0.12} smoothness={4} position={[0, 0, -0.03]}>
        <meshStandardMaterial color={border} transparent opacity={0.85} />
      </RoundedBox>

      <Text
        position={[-0.38, 0.46, 0.05]}
        fontSize={0.22}
        color={suitColor(card.suit)}
        anchorX="left"
        anchorY="top"
      >
        {card.rank}
      </Text>
      <Text
        position={[-0.38, 0.2, 0.05]}
        fontSize={0.22}
        color={suitColor(card.suit)}
        anchorX="left"
        anchorY="top"
      >
        {card.suit}
      </Text>
      <Text position={[0, -0.08, 0.05]} fontSize={0.42} color={suitColor(card.suit)} anchorX="center" anchorY="middle">
        {card.suit}
      </Text>
    </group>
  );
}

function TableSurface() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[6.2, 64]} />
        <meshStandardMaterial color="#0f766e" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.049, 0]}>
        <ringGeometry args={[5.6, 6.1, 64]} />
        <meshStandardMaterial color="#0b4f4a" roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}

export default function SamTable3D({
  yourHand,
  pileCards,
  selectedIds,
  canPlayCard,
  onToggleSelect,
  opponents = [
    { label: "P2", count: 0 },
    { label: "P3", count: 0 },
    { label: "P4", count: 0 },
  ],
  className,
}: {
  yourHand: Sam3DCard[];
  pileCards: Sam3DCard[] | null;
  selectedIds: string[];
  canPlayCard: (card: Sam3DCard) => boolean;
  onToggleSelect: (cardId: string) => void;
  opponents?: { label: string; count: number }[];
  className?: string;
}) {
  const layout = useMemo(() => {
    const n = Math.max(yourHand.length, 1);
    const spread = Math.min(1.25, 0.35 + n * 0.06);
    const startX = -((n - 1) * spread) / 2;
    const angle = Math.min(0.32, 0.12 + n * 0.01);
    return { startX, spread, angle };
  }, [yourHand.length]);

  const pileLayout = useMemo(() => {
    const n = pileCards?.length ?? 0;
    const spread = Math.min(0.55, 0.2 + n * 0.04);
    const startX = -((Math.max(n, 1) - 1) * spread) / 2;
    const angle = Math.min(0.22, 0.08 + n * 0.01);
    return { startX, spread, angle };
  }, [pileCards?.length]);

  return (
    <div
      className={`relative h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-950 to-slate-900 shadow-sm ${
        className ?? ""
      }`}
    >
      <Canvas
        shadows
        camera={{ position: [0, 4.7, 6.6], fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 7, 2]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <pointLight position={[-5, 3.5, 2.5]} intensity={0.55} />

        <group position={[0, 0, 0]}>
          <TableSurface />

          <OpponentHand
            label={opponents[0]?.label ?? "P2"}
            count={opponents[0]?.count ?? 0}
            center={[0, 0.2, -3.05]}
            rotation={[0.35, Math.PI, 0]}
          />
          <OpponentHand
            label={opponents[1]?.label ?? "P3"}
            count={opponents[1]?.count ?? 0}
            center={[3.35, 0.2, 0]}
            rotation={[0.35, -Math.PI / 2, 0]}
          />
          <OpponentHand
            label={opponents[2]?.label ?? "P4"}
            count={opponents[2]?.count ?? 0}
            center={[-3.35, 0.2, 0]}
            rotation={[0.35, Math.PI / 2, 0]}
          />

          {pileCards?.length ? (
            <group position={[0, 0.02, 0]}>
              {pileCards.map((card, idx) => {
                const x = pileLayout.startX + idx * pileLayout.spread;
                const rot =
                  (idx - (pileCards.length - 1) / 2) * (pileLayout.angle / Math.max(1, pileCards.length - 1));
                return (
                  <CardMesh
                    key={card.id}
                    card={card}
                    position={[x, 0.02 + idx * 0.01, idx * -0.03]}
                    rotationX={-Math.PI / 2}
                    rotationZ={rot}
                    highlight
                  />
                );
              })}
            </group>
          ) : (
            <Text position={[0, 0.55, 0]} fontSize={0.22} color="#cbd5e1" anchorX="center" anchorY="middle">
              Bàn trống
            </Text>
          )}

          <group position={[0, 0.2, 3.05]} rotation={[-0.35, 0, 0]}>
            {yourHand.map((card, idx) => {
              const x = layout.startX + idx * layout.spread;
              const rot = (idx - (yourHand.length - 1) / 2) * (layout.angle / Math.max(1, yourHand.length - 1));
              const playable = canPlayCard(card);
              const selected = selectedIds.includes(card.id);
              return (
                <CardMesh
                  key={card.id}
                  card={card}
                  position={[x, 0, 0]}
                  rotationZ={rot}
                  disabled={!playable}
                  highlight={playable}
                  selected={selected}
                  onClick={() => onToggleSelect(card.id)}
                />
              );
            })}
          </group>
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={10}
          minPolarAngle={0.7}
          maxPolarAngle={1.25}
          target={[0, 0.25, 0.35]}
        />
      </Canvas>
    </div>
  );
}

