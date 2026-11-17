import { spawnVeinNear } from "./mining";
import { TILE, type EventKind, type GameState } from "./types";

export function initEvents(g: GameState) {
  g.activeEvent = null;
  g.eventCd = 95;
  g.meteors = [];
}

export function triggerEvent(g: GameState, kind: EventKind) {
  const totalLife = kind === "meteor" ? 180 : kind === "bloodMoon" ? 160 : 8;
  g.activeEvent = { kind, life: totalLife, totalLife, data: { meteorCd: 0 } };
  const msg =
    kind === "meteor"
      ? "Tempestade de Meteoros! Cristais estelares caem ao redor."
      : kind === "bloodMoon"
        ? "Lua Vermelha! Todos os recursos e ouro triplicados."
        : "Terremoto! Novas jazidas minerais se abrem na terra.";
  const color = kind === "meteor" ? "#ff9040" : kind === "bloodMoon" ? "#ff4060" : "#c8a060";
  g.log.unshift({ text: msg, color, life: 10 });
}

export function tickEvents(g: GameState, dt: number) {
  if (g.activeEvent) {
    g.activeEvent.life -= dt;
    if (g.activeEvent.kind === "meteor") {
      const d = g.activeEvent.data ?? (g.activeEvent.data = {});
      d.meteorCd = (d.meteorCd ?? 0) - dt;
      if (d.meteorCd <= 0) {
        d.meteorCd = 4 + Math.random() * 4;
        const ang = Math.random() * Math.PI * 2;
        const dist = 260 + Math.random() * 320;
        const tx = g.player.pos.x + Math.cos(ang) * dist;
        const ty = g.player.pos.y + Math.sin(ang) * dist;
        g.meteors.push({ x: tx, y: ty - 420, vx: 0, vy: 520, life: 0.85, targetY: ty });
      }
    }
    if (g.activeEvent.kind === "earthquake" && Math.random() < dt * 0.65) {
      spawnVeinNear(g, g.player.pos.x, g.player.pos.y);
    }
    if (g.activeEvent.life <= 0) {
      g.log.unshift({ text: "Evento mundial encerrado.", color: "#c0c0c0", life: 6 });
      g.activeEvent = null;
      g.eventCd = 180;
    }
  } else {
    g.eventCd -= dt;
    if (g.eventCd <= 0) {
      const r = Math.random();
      const kind: EventKind = r < 0.4 ? "meteor" : r < 0.8 ? "bloodMoon" : "earthquake";
      triggerEvent(g, kind);
    }
  }

  for (const m of [...g.meteors]) {
    m.life -= dt;
    m.y += m.vy * dt;
    if (m.life <= 0) {
      const tx = Math.floor(m.x / TILE);
      const ty = Math.floor(m.y / TILE);
      if (tx > 2 && ty > 2 && tx < g.activeMap.size - 2 && ty < g.activeMap.size - 2 && !g.activeMap.isBlocked(tx, ty)) {
        spawnVeinNear(g, m.x, m.y, Math.random() < 0.5 ? "cristal_meteorico" : "estelarium", "normal");
        g.shockwaves.push({ x: m.x, y: m.y, radius: 8, maxRadius: 72, color: "#ff9040", life: 0.45, maxLife: 0.45 });
        g.floaters.push({
          x: m.x, y: m.y - 10, text: "Meteoro!", color: "#ff9040",
          life: 1.5, maxLife: 1.5, vy: -22, scale: 1.15,
        });
      }
      g.meteors = g.meteors.filter(x => x !== m);
    }
  }
}

export function dropMultiplier(g: GameState): number {
  return g.activeEvent?.kind === "bloodMoon" ? 3 : 1;
}
