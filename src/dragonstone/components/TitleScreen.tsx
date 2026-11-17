import titleBg from "@/assets/dragonstone-citadel.jpg";
import { GameButton } from "@/components/GameButton";
import { useEffect } from "react";
import { CLASS_INFO } from "../game/biomes";
import type { PlayerClass } from "../game/types";
import { AnimatedSpritePreview, classIconName, PixelIcon } from "./PixelUI";

const CLASSES: PlayerClass[] = ["melee", "magic", "paladin", "necro", "archer"];

export function TitleScreen({
  selectedClass,
  onSelectClass,
  hasSaveData,
  onStartNew,
  onContinue,
}: {
  selectedClass: PlayerClass;
  onSelectClass: (cls: PlayerClass) => void;
  hasSaveData: boolean;
  onStartNew: () => void;
  onContinue: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        onStartNew();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onStartNew]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto px-scroll bg-[var(--game-0a0810)] text-[var(--game-f4e8cf)]">
      {/* Illustrated Key-Art Backdrop + Twilight Scrim */}
      <div className="fixed inset-0 pointer-events-none">
        <img
          src={titleBg} width={1536} height={1024}
          alt="Cidadela e Forja de Asterion"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-75"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, var(--game-overlay-0) 0%, var(--game-overlay-1) 48%, var(--game-overlay-2) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{
            background: "linear-gradient(180deg, transparent 0%, var(--game-overlay-3) 100%)",
          }}
        />
      </div>

      {/* Main Content Anchored cleanly with breathing room */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-8 pt-6 sm:pt-10 pb-6 flex-1 flex flex-col justify-between gap-6">
        {/* Title Lockup + Custom Crest */}
        <header className="max-w-2xl">
          <div className="flex items-center gap-3.5 mb-3">
            {/* Custom Dragonstone Forge Pixel Emblem */}
            <div className="px-slot p-2 shrink-0">
              <svg
                width="44"
                height="44"
                viewBox="0 0 16 16"
                fill="none"
                shapeRendering="crispEdges"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="12" height="12" fill="var(--game-211610)" />
                <rect x="5" y="2" width="6" height="2" fill="var(--game-f4c85b)" />
                <rect x="4" y="4" width="8" height="3" fill="var(--game-ff7040)" />
                <rect x="6" y="4" width="4" height="3" fill="var(--game-ffe89e)" />
                <rect x="2" y="7" width="12" height="3" fill="var(--game-9aa4b4)" />
                <rect x="1" y="8" width="3" height="2" fill="var(--game-d9e4f2)" />
                <rect x="5" y="10" width="6" height="2" fill="var(--game-636c7a)" />
                <rect x="3" y="12" width="10" height="2" fill="var(--game-464d58)" />
              </svg>
            </div>
            <div>
              <p className="font-pixel-mono text-[11px] uppercase tracking-[0.22em] text-[var(--game-f4c85b)]">
                Asterion · Continente Fixo · 40 Regiões · 100 Andares
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-wider text-[var(--game-fff2d2)] drop-shadow-[0_4px_0_var(--game-090605)]">
                DRAGONSTONE FORGE
              </h1>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[var(--game-d5c5a6)] leading-relaxed max-w-xl">
            Desperte na cidadela fortificada de Asterion, explore um continente inteiro moldado à mão,
            minere veios raros, forje relíquias encantadas e conquiste a Grande Masmorra.
          </p>
        </header>

        {/* Class Selector Grid */}
        <section aria-label="Escolha sua Classe">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[var(--game-f4c85b)]">
              Escolha sua Linhagem
            </h2>
            <span className="font-pixel-mono text-xs text-[var(--game-b8a586)]">
              5 Classes · Animação Kaetram
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CLASSES.map((cls) => {
              const info = CLASS_INFO[cls];
              const active = cls === selectedClass;
              return (
                <GameButton
                  key={cls}
                  type="button"
                  onClick={() => onSelectClass(cls)}
                  className={`px-btn text-left p-3 flex flex-col gap-2.5 ${
                    active ? "px-frame-gold" : "px-frame hover:brightness-110"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 shrink-0 ${active ? "px-slot-active" : "px-slot"}`}>
                      <AnimatedSpritePreview cls={cls} size={44} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <PixelIcon name={classIconName(cls)} size={13} color={info.accent} />
                        <span
                          className="font-display text-[13px] font-bold leading-tight"
                          style={{ color: active ? "var(--game-f4c85b)" : "var(--game-f7ebd3)" }}
                        >
                          {info.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--game-bba888)] truncate">{info.role}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--game-d6c7aa)] leading-snug line-clamp-2 min-h-[2.2rem]">
                    {info.desc}
                  </p>

                  <div className="px-inset px-2 py-1.5 grid grid-cols-3 gap-1 font-pixel-mono text-[10px] text-[var(--game-cfc0a2)]">
                    <span>HP {info.base.hp}</span>
                    <span>MP {info.base.mp}</span>
                    <span style={{ color: info.accent }}>
                      {cls === "magic" || cls === "necro"
                        ? `INT ${info.base.int}`
                        : cls === "archer"
                          ? `AGI ${info.base.agi}`
                          : `FOR ${info.base.str}`}
                    </span>
                  </div>
                </GameButton>
              );
            })}
          </div>
        </section>

        {/* Primary Action Bar + Flat Control Line */}
        <footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <GameButton
              type="button"
              data-start="true"
              onClick={onStartNew}
              className="px-btn px-btn-gold px-7 py-3.5 font-display text-base sm:text-lg font-extrabold tracking-wider uppercase flex items-center gap-2.5"
            >
              <PixelIcon name="sword" size={20} color="var(--game-1a0f05)" />
              <span>Entrar em Asterion</span>
            </GameButton>

            {hasSaveData && (
              <GameButton
                type="button"
                onClick={onContinue}
                className="px-btn px-btn-emerald px-5 py-3.5 font-display text-sm sm:text-base font-bold tracking-wide uppercase flex items-center gap-2"
              >
                <PixelIcon name="crown" size={18} color="var(--game-f4fff4)" />
                <span>Continuar Jornada</span>
              </GameButton>
            )}
          </div>

          <p className="font-pixel-mono text-[11px] text-[var(--game-bba88a)]">
            WASD Mover · Clique Atacar/Minerar · 1–4 Habilidades · B Forja · M Mapa · P Pausar
          </p>
        </footer>
      </div>
    </div>
  );
}
