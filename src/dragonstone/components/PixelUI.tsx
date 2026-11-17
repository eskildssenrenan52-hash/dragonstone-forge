import { GameButton } from "@/components/GameButton";
import React, { useEffect, useRef } from "react";
import { renderClassPreview } from "../game/pixelSprites";
import type { PanelId, PlayerClass } from "../game/types";

export type PixelIconName =
  | "sword"
  | "staff"
  | "shield"
  | "skull"
  | "bow"
  | "pickaxe"
  | "potion"
  | "gem"
  | "anvil"
  | "backpack"
  | "stats"
  | "map"
  | "help"
  | "pause"
  | "soundOn"
  | "soundOff"
  | "coin"
  | "heart"
  | "mana"
  | "spark"
  | "crown"
  | "close";

export function PixelIcon({
  name,
  size = 18,
  color = "currentColor",
  className = "",
}: {
  name: PixelIconName;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {name === "sword" && (
        <>
          <rect x="11" y="2" width="3" height="3" fill={color} />
          <rect x="9" y="4" width="3" height="3" fill={color} />
          <rect x="7" y="6" width="3" height="3" fill={color} />
          <rect x="5" y="8" width="3" height="3" fill={color} />
          <rect x="3" y="7" width="2" height="2" fill="var(--game-f4c85b)" />
          <rect x="7" y="11" width="2" height="2" fill="var(--game-f4c85b)" />
          <rect x="4" y="10" width="2" height="2" fill="var(--game-8b5a2b)" />
          <rect x="2" y="12" width="2" height="2" fill="var(--game-f4c85b)" />
        </>
      )}
      {name === "staff" && (
        <>
          <rect x="10" y="2" width="4" height="4" fill="var(--game-5ce8ff)" />
          <rect x="11" y="3" width="2" height="2" fill="var(--game-ffffff)" />
          <rect x="8" y="6" width="2" height="2" fill="var(--game-9a6432)" />
          <rect x="6" y="8" width="2" height="2" fill="var(--game-9a6432)" />
          <rect x="4" y="10" width="2" height="2" fill="var(--game-70441e)" />
          <rect x="2" y="12" width="2" height="2" fill="var(--game-70441e)" />
        </>
      )}
      {name === "shield" && (
        <>
          <rect x="3" y="2" width="10" height="8" fill={color} />
          <rect x="4" y="3" width="8" height="6" fill="var(--game-2b384c)" />
          <rect x="7" y="3" width="2" height="8" fill="var(--game-f4c85b)" />
          <rect x="5" y="5" width="6" height="2" fill="var(--game-f4c85b)" />
          <rect x="5" y="10" width="6" height="2" fill={color} />
          <rect x="7" y="12" width="2" height="2" fill={color} />
        </>
      )}
      {name === "skull" && (
        <>
          <rect x="4" y="2" width="8" height="7" fill="var(--game-e6e1f2)" />
          <rect x="3" y="4" width="10" height="4" fill="var(--game-e6e1f2)" />
          <rect x="5" y="5" width="2" height="2" fill="var(--game-1b1124)" />
          <rect x="9" y="5" width="2" height="2" fill="var(--game-1b1124)" />
          <rect x="7" y="7" width="2" height="2" fill="var(--game-1b1124)" />
          <rect x="5" y="10" width="2" height="3" fill="var(--game-c7bed8)" />
          <rect x="9" y="10" width="2" height="3" fill="var(--game-c7bed8)" />
          <rect x="7" y="10" width="2" height="2" fill="var(--game-e6e1f2)" />
        </>
      )}
      {name === "bow" && (
        <>
          <rect x="4" y="2" width="3" height="2" fill="var(--game-9a6432)" />
          <rect x="6" y="4" width="2" height="8" fill="var(--game-c88d42)" />
          <rect x="4" y="12" width="3" height="2" fill="var(--game-9a6432)" />
          <rect x="3" y="3" width="1" height="10" fill="var(--game-d8e4f0)" />
          <rect x="3" y="7" width="9" height="2" fill="var(--game-e8eef5)" />
          <rect x="11" y="6" width="2" height="4" fill="var(--game-5ed86a)" />
        </>
      )}
      {name === "pickaxe" && (
        <>
          <rect x="4" y="2" width="8" height="2" fill={color} />
          <rect x="2" y="4" width="3" height="2" fill={color} />
          <rect x="11" y="4" width="3" height="2" fill={color} />
          <rect x="7" y="4" width="2" height="10" fill="var(--game-9a6432)" />
          <rect x="6" y="12" width="4" height="2" fill="var(--game-5e3a1a)" />
        </>
      )}
      {name === "potion" && (
        <>
          <rect x="6" y="1" width="4" height="2" fill="var(--game-b8844c)" />
          <rect x="5" y="3" width="6" height="2" fill="var(--game-9ec5d8)" />
          <rect x="4" y="5" width="8" height="8" fill={color} />
          <rect x="3" y="7" width="10" height="5" fill={color} />
          <rect x="5" y="6" width="2" height="3" fill="var(--game-ffffff)" fillOpacity="0.65" />
          <rect x="5" y="13" width="6" height="1" fill="var(--game-2c1d18)" />
        </>
      )}
      {name === "gem" && (
        <>
          <rect x="5" y="2" width="6" height="2" fill={color} />
          <rect x="3" y="4" width="10" height="5" fill={color} />
          <rect x="5" y="9" width="6" height="3" fill={color} />
          <rect x="7" y="12" width="2" height="2" fill={color} />
          <rect x="5" y="4" width="3" height="3" fill="var(--game-ffffff)" fillOpacity="0.6" />
        </>
      )}
      {name === "anvil" && (
        <>
          <rect x="2" y="4" width="12" height="3" fill="var(--game-9aa4b4)" />
          <rect x="1" y="5" width="3" height="2" fill="var(--game-cbd4e2)" />
          <rect x="5" y="7" width="6" height="3" fill="var(--game-636c7a)" />
          <rect x="3" y="10" width="10" height="3" fill="var(--game-464d58)" />
          <rect x="4" y="4" width="8" height="1" fill="var(--game-e5edf7)" />
        </>
      )}
      {name === "backpack" && (
        <>
          <rect x="5" y="2" width="6" height="2" fill="var(--game-70441e)" />
          <rect x="3" y="4" width="10" height="9" fill="var(--game-9e642d)" />
          <rect x="4" y="5" width="8" height="4" fill="var(--game-c4833f)" />
          <rect x="7" y="8" width="2" height="2" fill="var(--game-f4c85b)" />
          <rect x="4" y="10" width="8" height="3" fill="var(--game-78491f)" />
        </>
      )}
      {name === "stats" && (
        <>
          <rect x="2" y="10" width="3" height="4" fill="var(--game-5ea8ff)" />
          <rect x="6" y="6" width="3" height="8" fill="var(--game-5ed86a)" />
          <rect x="10" y="3" width="3" height="11" fill="var(--game-f4c85b)" />
          <rect x="2" y="2" width="4" height="2" fill="var(--game-f4c85b)" />
        </>
      )}
      {name === "map" && (
        <>
          <rect x="2" y="3" width="4" height="10" fill="var(--game-d9be8b)" />
          <rect x="6" y="2" width="4" height="10" fill="var(--game-ebd5a7)" />
          <rect x="10" y="3" width="4" height="10" fill="var(--game-bfa16d)" />
          <rect x="4" y="6" width="2" height="2" fill="var(--game-d94545)" />
          <rect x="7" y="7" width="3" height="2" fill="var(--game-4e7840)" />
        </>
      )}
      {name === "help" && (
        <>
          <rect x="5" y="2" width="6" height="2" fill={color} />
          <rect x="9" y="4" width="3" height="3" fill={color} />
          <rect x="7" y="7" width="3" height="3" fill={color} />
          <rect x="7" y="12" width="2" height="2" fill={color} />
        </>
      )}
      {name === "pause" && (
        <>
          <rect x="4" y="3" width="3" height="10" fill={color} />
          <rect x="9" y="3" width="3" height="10" fill={color} />
        </>
      )}
      {name === "soundOn" && (
        <>
          <rect x="2" y="6" width="3" height="4" fill={color} />
          <rect x="5" y="4" width="2" height="8" fill={color} />
          <rect x="7" y="2" width="2" height="12" fill={color} />
          <rect x="11" y="5" width="1" height="6" fill="var(--game-f4c85b)" />
          <rect x="13" y="3" width="1" height="10" fill="var(--game-f4c85b)" />
        </>
      )}
      {name === "soundOff" && (
        <>
          <rect x="2" y="6" width="3" height="4" fill="var(--game-8b7d70)" />
          <rect x="5" y="4" width="2" height="8" fill="var(--game-8b7d70)" />
          <rect x="7" y="2" width="2" height="12" fill="var(--game-8b7d70)" />
          <rect x="11" y="5" width="2" height="2" fill="var(--game-e85040)" />
          <rect x="13" y="7" width="2" height="2" fill="var(--game-e85040)" />
          <rect x="11" y="9" width="2" height="2" fill="var(--game-e85040)" />
          <rect x="13" y="5" width="2" height="2" fill="var(--game-e85040)" />
          <rect x="13" y="9" width="2" height="2" fill="var(--game-e85040)" />
        </>
      )}
      {name === "coin" && (
        <>
          <rect x="5" y="2" width="6" height="12" fill="var(--game-f4c85b)" />
          <rect x="3" y="4" width="10" height="8" fill="var(--game-f4c85b)" />
          <rect x="5" y="4" width="6" height="8" fill="var(--game-d49526)" />
          <rect x="7" y="5" width="2" height="6" fill="var(--game-fff099)" />
        </>
      )}
      {name === "heart" && (
        <>
          <rect x="3" y="3" width="4" height="4" fill="var(--game-e84050)" />
          <rect x="9" y="3" width="4" height="4" fill="var(--game-e84050)" />
          <rect x="2" y="5" width="12" height="4" fill="var(--game-e84050)" />
          <rect x="4" y="9" width="8" height="2" fill="var(--game-c02030)" />
          <rect x="6" y="11" width="4" height="2" fill="var(--game-c02030)" />
          <rect x="4" y="4" width="2" height="2" fill="var(--game-ff98a4)" />
        </>
      )}
      {name === "mana" && (
        <>
          <rect x="7" y="2" width="2" height="3" fill="var(--game-8fe0ff)" />
          <rect x="5" y="5" width="6" height="4" fill="var(--game-469cff)" />
          <rect x="4" y="8" width="8" height="4" fill="var(--game-2c72d8)" />
          <rect x="6" y="12" width="4" height="2" fill="var(--game-1e54aa)" />
          <rect x="6" y="6" width="2" height="3" fill="var(--game-d9f6ff)" />
        </>
      )}
      {name === "spark" && (
        <>
          <rect x="7" y="1" width="2" height="14" fill={color} />
          <rect x="1" y="7" width="14" height="2" fill={color} />
          <rect x="5" y="5" width="6" height="6" fill="var(--game-ffffff)" />
        </>
      )}
      {name === "crown" && (
        <>
          <rect x="2" y="5" width="2" height="6" fill="var(--game-f4c85b)" />
          <rect x="7" y="3" width="2" height="8" fill="var(--game-f4c85b)" />
          <rect x="12" y="5" width="2" height="6" fill="var(--game-f4c85b)" />
          <rect x="2" y="9" width="12" height="4" fill="var(--game-d49526)" />
          <rect x="7" y="10" width="2" height="2" fill="var(--game-ff4868)" />
        </>
      )}
      {name === "close" && (
        <>
          <rect x="3" y="3" width="3" height="3" fill={color} />
          <rect x="10" y="3" width="3" height="3" fill={color} />
          <rect x="6" y="6" width="4" height="4" fill={color} />
          <rect x="3" y="10" width="3" height="3" fill={color} />
          <rect x="10" y="10" width="3" height="3" fill={color} />
        </>
      )}
    </svg>
  );
}

export function classIconName(cls: PlayerClass): PixelIconName {
  if (cls === "melee") return "sword";
  if (cls === "magic") return "staff";
  if (cls === "paladin") return "shield";
  if (cls === "necro") return "skull";
  return "bow";
}

export function AnimatedSpritePreview({
  cls,
  size = 72,
  className = "",
}: {
  cls: PlayerClass;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const c = canvasRef.current;
      if (c) {
        renderClassPreview(c, cls, (now - start) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cls]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      style={{ width: size, height: size }}
      className={`pixelated shrink-0 ${className}`}
    />
  );
}

const MODAL_TABS: Array<{ id: Exclude<PanelId, "none">; label: string; keyHint: string; icon: PixelIconName }> = [
  { id: "inventory", label: "Mochila", keyHint: "I", icon: "backpack" },
  { id: "stats",     label: "Status",  keyHint: "C", icon: "stats" },
  { id: "mining",    label: "Minas",   keyHint: "N", icon: "pickaxe" },
  { id: "crafting",  label: "Forja",   keyHint: "B", icon: "anvil" },
  { id: "map",       label: "Mapa",    keyHint: "M", icon: "map" },
  { id: "help",      label: "Ajuda",   keyHint: "H", icon: "help" },
];

export function PixelModalShell({
  title,
  subtitle,
  activeTab,
  onSelectTab,
  onClose,
  maxWidthClass = "max-w-5xl",
  children,
}: {
  title: string;
  subtitle?: string;
  activeTab?: Exclude<PanelId, "none">;
  onSelectTab?: (tab: Exclude<PanelId, "none">) => void;
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-[var(--game-070506)]/80 pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`px-frame-gold w-full ${maxWidthClass} max-h-[90vh] flex flex-col text-[var(--game-f4e8cf)]`}
      >
        {/* Corner Pixel Rivets */}
        <span className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 bg-[var(--game-f4c85b)] border border-[var(--game-080503)]" />
        <span className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--game-f4c85b)] border border-[var(--game-080503)]" />
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 bg-[var(--game-f4c85b)] border border-[var(--game-080503)]" />
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 bg-[var(--game-f4c85b)] border border-[var(--game-080503)]" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--game-1d140e)] border-b-2 border-[var(--game-090605)]">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-wide text-[var(--game-f4c85b)] uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--game-bba88a)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <GameButton
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            aria-label="Fechar janela"
            className="px-btn px-btn-crimson px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold"
          >
            <PixelIcon name="close" size={14} color="var(--game-fff2f2)" />
            <span className="hidden sm:inline font-pixel-mono">ESC</span>
          </GameButton>
        </div>

        {/* Optional Tab Strip */}
        {activeTab && onSelectTab && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-[var(--game-140e0a)] border-b-2 border-[var(--game-090605)]">
            {MODAL_TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <GameButton
                  key={t.id}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectTab(t.id);
                  }}
                  className={`px-btn px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold ${
                    active ? "px-btn-gold" : "px-btn-wood"
                  }`}
                >
                  <PixelIcon name={t.icon} size={14} color={active ? "var(--game-1a0f05)" : "var(--game-f4c85b)"} />
                  <span>{t.label}</span>
                  <span className="font-pixel-mono text-[10px] opacity-75">[{t.keyHint}]</span>
                </GameButton>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto px-scroll flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
