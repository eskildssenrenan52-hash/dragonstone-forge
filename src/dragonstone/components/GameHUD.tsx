import { gameColor } from "../game/uiColor";
import { GameButton } from "@/components/GameButton";
import { useEffect, useRef } from "react";
import { BIOMES, CLASS_INFO } from "../game/biomes";
import { FIXED_WORLD_SIZE, TILE, type GameState, type PanelId } from "../game/types";
import { AnimatedSpritePreview, classIconName, PixelIcon } from "./PixelUI";

function drawMinimap(canvas: HTMLCanvasElement, g: GameState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = gameColor("var(--game-08060a)");
  ctx.fillRect(0, 0, W, H);

  const ptx = Math.floor(g.player.pos.x / TILE);
  const pty = Math.floor(g.player.pos.y / TILE);
  const viewRadius = g.activeMap.isCave ? 28 : 42;
  const step = (viewRadius * 2) / W;

  for (let py = 0; py < H; py += 2) {
    const ty = Math.floor(pty - viewRadius + py * step);
    for (let px = 0; px < W; px += 2) {
      const tx = Math.floor(ptx - viewRadius + px * step);
      if (tx < 0 || ty < 0 || tx >= g.activeMap.size || ty >= g.activeMap.size) continue;
      const t = g.activeMap.get(tx, ty);
      let col = "var(--game-19151c)";
      if (t.kind === 1) col = "var(--game-1e4b7a)";
      else if (t.kind === 2 || t.kind === 14 || t.kind === 11) col = "var(--game-4a434c)";
      else if (t.kind === 4) col = "var(--game-204e28)";
      else if (t.kind === 13) col = "var(--game-746552)";
      else if (t.kind === 17 || t.kind === 18) col = "var(--game-8c744c)";
      else if (t.kind === 3) col = "var(--game-b59660)";
      else if (t.kind === 5 || t.kind === 15) col = "var(--game-f4c85b)";
      else if (t.kind === 6 || t.kind === 7 || t.kind === 16) col = "var(--game-5ce8ff)";
      else {
        const b = BIOMES.find((bm) => bm.id === t.biome);
        col = b ? b.color : g.activeMap.isCave ? "var(--game-362b3d)" : "var(--game-4a7c45)";
      }
      ctx.fillStyle = gameColor(col);
      ctx.fillRect(px, py, 2, 2);
    }
  }

  // Nearby Stairs on minimap
  for (const st of g.activeMap.stairs) {
    const sx = Math.floor(st.x / TILE);
    const sy = Math.floor(st.y / TILE);
    if (Math.abs(sx - ptx) <= viewRadius && Math.abs(sy - pty) <= viewRadius) {
      const mx = ((sx - (ptx - viewRadius)) / (viewRadius * 2)) * W;
      const my = ((sy - (pty - viewRadius)) / (viewRadius * 2)) * H;
      ctx.fillStyle = gameColor(st.kind === "grand" ? "var(--game-ffe46b)" : "var(--game-5ce8ff)");
      ctx.fillRect(Math.round(mx) - 2, Math.round(my) - 2, 4, 4);
    }
  }

  // Nearby Enemies (red pixels)
  for (const e of g.enemies) {
    if (e.koTimer > 0) continue;
    const ex = Math.floor(e.pos.x / TILE);
    const ey = Math.floor(e.pos.y / TILE);
    if (Math.abs(ex - ptx) <= viewRadius && Math.abs(ey - pty) <= viewRadius) {
      const mx = ((ex - (ptx - viewRadius)) / (viewRadius * 2)) * W;
      const my = ((ey - (pty - viewRadius)) / (viewRadius * 2)) * H;
      ctx.fillStyle = gameColor(e.isBoss ? "var(--game-ffea40)" : "var(--game-ff4848)");
      ctx.fillRect(Math.round(mx) - (e.isBoss ? 2 : 1), Math.round(my) - (e.isBoss ? 2 : 1), e.isBoss ? 4 : 2, e.isBoss ? 4 : 2);
    }
  }

  // Player center reticle
  ctx.fillStyle = gameColor("var(--game-ffffff)");
  ctx.fillRect(W / 2 - 2, H / 2 - 2, 4, 4);
  ctx.fillStyle = gameColor("var(--game-080604)");
  ctx.strokeRect(W / 2 - 2.5, H / 2 - 2.5, 5, 5);
}

export function GameHUD({
  g,
  muted,
  onToggleMute,
  onOpenPanel,
  onTogglePause,
  onUseSkill,
  onToggleAutoFire,
  onVirtualMove,
}: {
  g: GameState;
  muted: boolean;
  onToggleMute: () => void;
  onOpenPanel: (panel: PanelId) => void;
  onTogglePause: () => void;
  onUseSkill: (idx: number) => void;
  onToggleAutoFire: () => void;
  onVirtualMove: (dx: number, dy: number) => void;
}) {
  const miniRef = useRef<HTMLCanvasElement | null>(null);
  const p = g.player;
  const clsInfo = CLASS_INFO[p.cls];

  const tx = Math.max(0, Math.min(FIXED_WORLD_SIZE - 1, Math.floor(p.pos.x / TILE)));
  const ty = Math.max(0, Math.min(FIXED_WORLD_SIZE - 1, Math.floor(p.pos.y / TILE)));
  const tileBiomeId = g.activeMap.get(tx, ty).biome;
  const biomeObj = BIOMES.find((b) => b.id === (g.activeCaveBiome ?? tileBiomeId));

  let locationTitle = biomeObj ? biomeObj.name : "Planícies de Aurora";
  if (g.activeGrandFloor > 0) {
    locationTitle = `Grande Masmorra · Andar ${g.activeGrandFloor}/100`;
  } else if (g.activeCaveBiome !== null) {
    locationTitle = `${biomeObj?.caveTheme.label ?? "Caverna"} · Piso ${g.activeFloor}`;
  } else if (Math.abs(tx - 160) <= 18 && Math.abs(ty - 160) <= 18) {
    locationTitle = "Cidade Central de Asterion";
  }

  const hpPct = Math.max(0, Math.min(100, (p.hp / Math.max(1, p.maxHp)) * 100));
  const ghostHpPct = Math.max(hpPct, Math.min(100, (p.ghostHp / Math.max(1, p.maxHp)) * 100));
  const mpPct = Math.max(0, Math.min(100, (p.mp / Math.max(1, p.maxMp)) * 100));
  const xpPct = Math.max(0, Math.min(100, (p.xp / Math.max(1, p.xpNext)) * 100));

  const lastMiniDrawRef = useRef<number>(0);

  useEffect(() => {
    const now = performance.now();
    if (miniRef.current && now - lastMiniDrawRef.current >= 280) {
      lastMiniDrawRef.current = now;
      drawMinimap(miniRef.current, g);
    }
  });

  const activeEvName =
    g.activeEvent?.kind === "meteor"
      ? "Tempestade de Meteoros"
      : g.activeEvent?.kind === "bloodMoon"
        ? "Lua Vermelha (3x)"
        : g.activeEvent?.kind === "earthquake"
          ? "Terremoto"
          : null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4">
      {/* Top Row: Left Hero Plaque + Right Minimap & Controls */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left Hero Status Cluster */}
        <div className="pointer-events-auto px-frame p-2.5 flex items-center gap-3 min-w-0 w-[calc(100%-60px)] sm:w-auto sm:min-w-[260px] max-w-[330px]">
          <div className="relative px-slot p-1 shrink-0">
            <AnimatedSpritePreview cls={p.cls} size={44} />
            <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-[var(--game-f4c85b)] text-[var(--game-1a0f05)] border border-[var(--game-080503)] font-pixel-mono text-[10px] font-extrabold leading-none">
              NV {p.level}
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <PixelIcon name={classIconName(p.cls)} size={13} color={clsInfo.accent} />
                <span className="font-display text-xs font-bold text-[var(--game-fff1d0)] truncate">
                  {clsInfo.name}
                </span>
              </div>
              <div className="flex items-center gap-1 font-pixel-mono text-xs font-bold text-[var(--game-f4c85b)] shrink-0">
                <PixelIcon name="coin" size={13} />
                <span>{p.gold}</span>
              </div>
            </div>

            {/* HP Bar with delayed ghostHp drain */}
            <div className="relative h-3.5 px-inset overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--game-fff3a8)]/70 transition-[width] duration-150"
                style={{ width: `${ghostHpPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-b from-[var(--game-e84a56)] to-[var(--game-9c1d28)]"
                style={{ width: `${hpPct}%` }}
              />
              <div className="relative z-10 h-full flex items-center justify-between px-1.5 font-pixel-mono text-[10px] font-bold text-[var(--game-ffffff)] drop-shadow-[0_1px_0_var(--game-000)]">
                <span>HP</span>
                <span>
                  {Math.ceil(p.hp)}/{p.maxHp}
                </span>
              </div>
            </div>

            {/* MP Bar */}
            <div className="relative h-2.5 px-inset overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-b from-[var(--game-4da4ff)] to-[var(--game-1e5bc0)]"
                style={{ width: `${mpPct}%` }}
              />
              <div className="relative z-10 h-full flex items-center justify-between px-1.5 font-pixel-mono text-[9px] font-bold text-[var(--game-e7f4ff)] drop-shadow-[0_1px_0_var(--game-000)]">
                <span>MP</span>
                <span>
                  {Math.floor(p.mp)}/{p.maxMp}
                </span>
              </div>
            </div>

            {/* XP Slim Bar */}
            <div className="relative h-1.5 px-inset overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--game-f4c85b)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--game-cbb899)] font-pixel-mono truncate">
              <span className="truncate">{locationTitle}</span>
              {p.attrPoints > 0 && (
                <GameButton
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onOpenPanel("stats");
                  }}
                  className="px-btn px-btn-gold px-1.5 py-0.5 text-[9px] font-extrabold shrink-0"
                >
                  +{p.attrPoints} PTS
                </GameButton>
              )}
            </div>
          </div>
        </div>

        {/* Top-Center Active World Event Banner (only when active) */}
        {activeEvName && g.activeEvent && (
          <div className="hidden md:flex px-frame-gold px-3.5 py-1.5 items-center gap-2 text-xs font-display font-bold text-[var(--game-f4c85b)]">
            <PixelIcon name="spark" size={14} color="var(--game-ff8a48)" />
            <span>{activeEvName}</span>
            <span className="font-pixel-mono text-[11px] text-[var(--game-fff1d0)]">
              {Math.ceil(g.activeEvent.life)}s
            </span>
          </div>
        )}

        {/* Top-Right Minimap & Compact Utility Buttons */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="sm:px-frame sm:p-1.5 flex items-center gap-2">
            <canvas
              ref={miniRef}
              width={96}
              height={96}
              onClick={() => onOpenPanel("map")}
              title="Abrir Mapa Mundi [M]"
              className="hidden sm:block pixelated cursor-pointer border-2 border-[var(--game-080503)] bg-[var(--game-08060a)]"
            />
            <div className="flex flex-col gap-1.5">
              <GameButton
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                title={muted ? "Ativar Som [U]" : "Silenciar [U]"}
                aria-label={muted ? "Ativar Som" : "Silenciar"}
                className="px-btn px-btn-wood p-1.5 flex items-center justify-center"
              >
                <PixelIcon name={muted ? "soundOff" : "soundOn"} size={15} />
              </GameButton>
              <GameButton
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenPanel(g.panel === "map" ? "none" : "map");
                }}
                title="Mapa Mundi [M]"
                aria-label="Mapa Mundi"
                className="px-btn px-btn-wood p-1.5 flex items-center justify-center"
              >
                <PixelIcon name="map" size={15} />
              </GameButton>
              <GameButton
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenPanel(g.panel === "help" ? "none" : "help");
                }}
                title="Ajuda [H]"
                aria-label="Ajuda"
                className="px-btn px-btn-wood p-1.5 flex items-center justify-center"
              >
                <PixelIcon name="help" size={15} color="var(--game-f4c85b)" />
              </GameButton>
              <GameButton
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTogglePause();
                }}
                title="Pausar [P / Esc]"
                aria-label="Pausar jogo"
                className="px-btn px-btn-wood p-1.5 flex items-center justify-center"
              >
                <PixelIcon name="pause" size={15} color="var(--game-f4c85b)" />
              </GameButton>
            </div>
          </div>

          <span className="hidden sm:block font-pixel-mono text-[10px] text-[var(--game-d5c5a6)] bg-[var(--game-140e0a)]/90 px-2 py-0.5 border border-[var(--game-080503)]">
            ({tx}, {ty})
          </span>
        </div>
      </div>

      {/* Bottom Row: Ephemeral Log + Skill Hotbar + Quick Panel Buttons */}
      <div className="flex flex-col items-center gap-2">
        {/* Ephemeral Event Log (max 2 recent lines) */}
        {g.log.length > 0 && (
          <div className="flex flex-col items-center gap-1 max-w-md">
            {g.log.slice(0, 2).map((entry, i) => (
              <div
                key={`${entry.text}-${i}`}
                className="px-2.5 py-0.5 bg-[var(--game-120d09)]/90 border border-[var(--game-080503)] text-xs font-medium shadow"
                style={{ color: entry.color }}
              >
                {entry.text}
              </div>
            ))}
          </div>
        )}

        <div className="w-full grid grid-cols-[96px_1fr] sm:flex items-end justify-between sm:justify-center gap-3">
          {/* Mobile Left Virtual Pad (only visible on < md screens) */}
          <div className="pointer-events-auto md:hidden grid grid-cols-3 gap-1 w-24">
            <div />
            <GameButton
              type="button"
              tabIndex={-1}
              onPointerDown={() => onVirtualMove(0, -1)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="px-btn px-btn-wood h-7 text-xs font-bold"
            >
              ▲
            </GameButton>
            <div />
            <GameButton
              type="button"
              tabIndex={-1}
              onPointerDown={() => onVirtualMove(-1, 0)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="px-btn px-btn-wood h-7 text-xs font-bold"
            >
              ◀
            </GameButton>
            <GameButton
              type="button"
              tabIndex={-1}
              onPointerDown={() => onVirtualMove(0, 1)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="px-btn px-btn-wood h-7 text-xs font-bold"
            >
              ▼
            </GameButton>
            <GameButton
              type="button"
              tabIndex={-1}
              onPointerDown={() => onVirtualMove(1, 0)}
              onPointerUp={() => onVirtualMove(0, 0)}
              onPointerLeave={() => onVirtualMove(0, 0)}
              className="px-btn px-btn-wood h-7 text-xs font-bold"
            >
              ▶
            </GameButton>
          </div>

          {/* Center Hotbar */}
          <div className="pointer-events-auto px-frame px-2.5 py-2 flex flex-wrap items-center justify-center gap-2 col-span-2 row-start-1 sm:row-auto">
            {/* 4 Skill Buttons */}
            <div className="flex items-center gap-1.5">
              {p.skills.map((sk, idx) => {
                const onCd = sk.cur > 0;
                const noMana = p.mp < sk.cost;
                return (
                  <GameButton
                    key={sk.id}
                    type="button"
                    tabIndex={-1}
                    title={`${sk.name} (${sk.cost} MP) — ${sk.desc}`}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onUseSkill(idx);
                    }}
                    className={`px-btn relative w-14 sm:w-16 h-12 px-1.5 py-1 flex flex-col justify-between text-left ${
                      onCd || noMana ? "px-btn-wood opacity-65" : "px-btn-wood hover:brightness-115"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-pixel-mono text-[10px] font-extrabold text-[var(--game-f4c85b)]">
                        [{sk.key}]
                      </span>
                      <span className="font-pixel-mono text-[9px] text-[var(--game-7cc2ff)]">
                        {sk.cost}MP
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--game-f7ebd3)] truncate w-full leading-tight">
                      {sk.name}
                    </span>
                    {onCd && (
                      <div className="absolute inset-0 bg-[var(--game-090605)]/80 flex items-center justify-center font-pixel-mono text-xs font-extrabold text-[var(--game-f4c85b)]">
                        {sk.cur.toFixed(1)}s
                      </div>
                    )}
                  </GameButton>
                );
              })}
            </div>

            <div className="hidden sm:block w-[2px] h-9 bg-[var(--game-3a2a1d)]" />

            {/* 4 Primary Menu Buttons */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "inventory", label: "Mochila", key: "I", icon: "backpack" },
                  { id: "stats",     label: "Status",  key: "C", icon: "stats" },
                  { id: "mining",    label: "Minas",   key: "N", icon: "pickaxe" },
                  { id: "crafting",  label: "Forja",   key: "B", icon: "anvil" },
                ] as const
              ).map((btn) => {
                const open = g.panel === btn.id;
                return (
                  <GameButton
                    key={btn.id}
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onOpenPanel(open ? "none" : btn.id);
                    }}
                    className={`px-btn px-2.5 h-12 flex flex-col items-center justify-center gap-0.5 ${
                      open ? "px-btn-gold" : "px-btn-wood"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <PixelIcon
                        name={btn.icon}
                        size={14}
                        color={open ? "var(--game-1a0f05)" : "var(--game-f4c85b)"}
                      />
                      <span className="font-pixel-mono text-[10px] font-bold">[{btn.key}]</span>
                    </div>
                    <span className="text-[10px] font-bold leading-none">{btn.label}</span>
                  </GameButton>
                );
              })}
            </div>
          </div>

          {/* Mobile Auto-Attack toggle */}
          <GameButton
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleAutoFire();
            }}
            className={`pointer-events-auto md:hidden px-btn px-2.5 py-2 text-[10px] font-bold ${
              g.autoFire ? "px-btn-emerald" : "px-btn-wood"
            }`}
          >
            AUTO
          </GameButton>
        </div>
      </div>
    </div>
  );
}
