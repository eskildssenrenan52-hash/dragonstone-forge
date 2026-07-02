import { useEffect, useRef, useState } from "react";
import { newGame, update, save, load, hasSave, wipeSave, logMsg, useInventoryItem, allocAttr, type GameState } from "@/game/game";
import { render } from "@/game/render";
import { craft } from "@/game/crafting";
import { makePickaxe, PICKAXE_TIERS } from "@/game/mining";
import { PROFESSION_LIST } from "@/game/engine";
import dragonBg from "@/assets/dragon-bg.jpg";

type Cls = "melee" | "magic" | "paladin" | "necro" | "archer";

export default function EternalRealms() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef({
    keys: new Set<string>(),
    mouse: { x: 0, y: 0, down: false, downOnce: false },
  });
  // Mobile joystick state
  const moveJoyRef = useRef<{ active: boolean; cx: number; cy: number; dx: number; dy: number }>({ active: false, cx: 0, cy: 0, dx: 0, dy: 0 });
  const aimJoyRef = useRef<{ active: boolean; cx: number; cy: number; dx: number; dy: number }>({ active: false, cx: 0, cy: 0, dx: 0, dy: 0 });
  const [menu, setMenu] = useState<"main" | "class" | "playing">("main");
  const [selectedClass, setSelectedClass] = useState<Cls>("melee");
  const [savedExists, setSavedExists] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoFireUi, setAutoFireUi] = useState(false);

  useEffect(() => { setSavedExists(hasSave()); }, [menu]);
  useEffect(() => {
    setIsMobile(typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth < 900));
  }, [menu]);

  useEffect(() => {
    if (menu !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const openPanel = (which: GameState["panel"]) => {
      const g = stateRef.current!;
      g.panel = g.panel === which ? "none" : which;
    };

    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      inputRef.current.keys.add(k);
      const g = stateRef.current!;
      if (k === "i") { openPanel("inventory"); e.preventDefault(); }
      else if (k === "c") { openPanel("stats"); e.preventDefault(); }
      else if (k === "h") { openPanel("help"); e.preventDefault(); }
      else if (k === "m") { openPanel("map"); e.preventDefault(); }
      else if (k === "b") { openPanel("crafting"); e.preventDefault(); }
      else if (k === "n") { openPanel("mining"); e.preventDefault(); }
      else if (k === "p") { g.paused = !g.paused; e.preventDefault(); }
      else if (k === "escape") { g.panel = "none"; }
      else if (e.key === "F5") { save(g); logMsg(g, "Jogo salvo.", "#5ea8ff"); e.preventDefault(); }
      else if (e.key === "F9") { const ng = load(); if (ng) { stateRef.current = ng; logMsg(ng, "Jogo carregado.", "#5ea8ff"); } e.preventDefault(); }
      else if (e.key === "F10") { wipeSave(); logMsg(g, "Save apagado.", "#ff8060"); e.preventDefault(); }
    };
    const ku = (e: KeyboardEvent) => inputRef.current.keys.delete(e.key.toLowerCase());
    const mm = (e: MouseEvent) => { inputRef.current.mouse.x = e.clientX; inputRef.current.mouse.y = e.clientY; };

    const hitRect = (cx: number, cy: number, r: [number, number, number, number]) =>
      cx >= r[0] && cx <= r[0] + r[2] && cy >= r[1] && cy <= r[1] + r[3];

    const handleClick = (cx: number, cy: number): boolean => {
      const g = stateRef.current!;
      if (g.panel === "none") return false;
      // Tab bar (present on every open panel)
      const tabs = (g as unknown as { _tabs?: Array<{ id: GameState["panel"]; rect: [number, number, number, number] }> })._tabs;
      if (tabs) for (const t of tabs) if (hitRect(cx, cy, t.rect)) { g.panel = t.id; return true; }
      if (g.panel === "inventory") {
        const grid = (g as unknown as { _invGrid?: { x: number; y: number; cellW: number; cellH: number } })._invGrid;
        if (grid) {
          const col = Math.floor((cx - grid.x) / grid.cellW);
          const row = Math.floor((cy - grid.y) / grid.cellH);
          if (col >= 0 && col < 8 && row >= 0 && row < 4) { useInventoryItem(g, row * 8 + col); return true; }
        }
      } else if (g.panel === "stats") {
        const grid = (g as unknown as { _statsGrid?: { rows: Array<{ k: "str" | "agi" | "int" | "vit"; rect: [number, number, number, number] }> } })._statsGrid;
        if (grid) for (const r of grid.rows) if (hitRect(cx, cy, r.rect)) { allocAttr(g, r.k); return true; }
      } else if (g.panel === "mining") {
        const grid = (g as unknown as { _mineGrid?: Array<{ tier: number; rect: [number, number, number, number] }> })._mineGrid;
        if (grid) for (const r of grid) if (hitRect(cx, cy, r.rect)) {
          const cur = g.player.equipped.pickaxe;
          g.player.equipped.pickaxe = makePickaxe(r.tier);
          if (cur) g.player.inventory.push(cur);
          const t = PICKAXE_TIERS.find(p => p.tier === r.tier);
          if (t) logMsg(g, `Equipou ${t.name}.`, "#8fcfff");
          return true;
        }
      } else if (g.panel === "crafting") {
        const profs = (g as unknown as { _craftProfs?: Array<{ id: string; rect: [number, number, number, number] }> })._craftProfs;
        if (profs) for (const r of profs) if (hitRect(cx, cy, r.rect)) { g.craftingTab = r.id; return true; }
        const recs = (g as unknown as { _craftHits?: Array<{ id: string; rect: [number, number, number, number] }> })._craftHits;
        if (recs) for (const r of recs) if (hitRect(cx, cy, r.rect)) {
          craft(g, r.id, (m, c) => logMsg(g, m, c ?? "#fff"));
          return true;
        }
      }
      return false;
    };

    const md = (e: MouseEvent) => {
      inputRef.current.mouse.down = true;
      inputRef.current.mouse.downOnce = true;
      handleClick(e.clientX, e.clientY);
    };
    const mu = () => { inputRef.current.mouse.down = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    canvas.addEventListener("mousemove", mm);
    canvas.addEventListener("mousedown", md);
    canvas.addEventListener("mouseup", mu);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Touch handling: 2 joysticks on left/right halves
    const activeTouch = { move: -1, aim: -1 };
    const onTouchStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < window.innerWidth / 2 && !moveJoyRef.current.active) {
          moveJoyRef.current = { active: true, cx: t.clientX, cy: t.clientY, dx: 0, dy: 0 };
          activeTouch.move = t.identifier;
        } else if (!aimJoyRef.current.active) {
          aimJoyRef.current = { active: true, cx: t.clientX, cy: t.clientY, dx: 0, dy: 0 };
          activeTouch.aim = t.identifier;
          // If panel is open, treat as click
          if (stateRef.current?.panel !== "none") handleClick(t.clientX, t.clientY);
        }
      }
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === activeTouch.move) {
          const dx = t.clientX - moveJoyRef.current.cx;
          const dy = t.clientY - moveJoyRef.current.cy;
          const m = Math.min(50, Math.hypot(dx, dy));
          const nrm = Math.hypot(dx, dy) || 1;
          moveJoyRef.current.dx = (dx / nrm) * m;
          moveJoyRef.current.dy = (dy / nrm) * m;
        } else if (t.identifier === activeTouch.aim) {
          const dx = t.clientX - aimJoyRef.current.cx;
          const dy = t.clientY - aimJoyRef.current.cy;
          aimJoyRef.current.dx = dx;
          aimJoyRef.current.dy = dy;
        }
      }
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === activeTouch.move) { moveJoyRef.current.active = false; moveJoyRef.current.dx = 0; moveJoyRef.current.dy = 0; activeTouch.move = -1; }
        if (t.identifier === activeTouch.aim) { aimJoyRef.current.active = false; aimJoyRef.current.dx = 0; aimJoyRef.current.dy = 0; activeTouch.aim = -1; }
      }
      e.preventDefault();
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = stateRef.current!;
      // Inject virtual keys/mouse from joysticks
      const mj = moveJoyRef.current;
      const inp = inputRef.current;
      // Clear directional keys first
      inp.keys.delete("w"); inp.keys.delete("a"); inp.keys.delete("s"); inp.keys.delete("d");
      if (mj.active) {
        if (mj.dy < -12) inp.keys.add("w");
        if (mj.dy > 12) inp.keys.add("s");
        if (mj.dx < -12) inp.keys.add("a");
        if (mj.dx > 12) inp.keys.add("d");
      }
      const aj = aimJoyRef.current;
      if (aj.active) {
        // Point mouse in aim-joystick direction relative to player center on screen
        inp.mouse.x = canvas.width / 2 + aj.dx;
        inp.mouse.y = canvas.height / 2 + aj.dy;
        if (Math.hypot(aj.dx, aj.dy) > 20) inp.mouse.down = true;
      } else if (autoFireUi) {
        inp.mouse.down = true;
      } else if (g.panel !== "none") {
        // don't auto-attack while panel open
        inp.mouse.down = false;
      }
      update(g, dt, inp, canvas.width, canvas.height);
      render(ctx, g, canvas.width, canvas.height);
      inp.mouse.downOnce = false;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const autosave = window.setInterval(() => { if (stateRef.current) save(stateRef.current); }, 30000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(autosave);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [menu, autoFireUi]);

  if (menu === "main") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white font-mono relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${dragonBg})`, backgroundSize: "cover", backgroundPosition: "center", imageRendering: "pixelated" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.9) 100%)" }} />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-7xl font-bold tracking-widest mb-2" style={{ color: "#f0b040", textShadow: "0 0 20px #f0b040cc, 0 4px 0 #000" }}>ETERNAL REALMS</h1>
          <p className="text-sm text-neutral-200 mb-10" style={{ textShadow: "0 2px 0 #000" }}>Continente de Asterion • Aventura offline</p>
          <div className="flex flex-col gap-3 items-center">
            <button onClick={() => setMenu("class")} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold tracking-widest w-64">NOVO JOGO</button>
            <button disabled={!savedExists} onClick={() => { const g = load(); if (g) { stateRef.current = g; setMenu("playing"); } }} className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 tracking-widest w-64">CONTINUAR</button>
            <button onClick={() => { wipeSave(); setSavedExists(false); }} className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 tracking-widest w-64 text-sm">Apagar save</button>
          </div>
          <div className="mt-10 text-xs text-neutral-300 max-w-md mx-auto leading-relaxed" style={{ textShadow: "0 1px 0 #000" }}>
            WASD mover • mouse ataca (ou minera se houver veio) • 1-4 skills • I inv • C atrib • B craft • N miner. • M mapa • F5 salvar
          </div>
        </div>
      </div>
    );
  }

  if (menu === "class") {
    const classes: { id: Cls; name: string; slug: string; desc: string; stats: string }[] = [
      { id: "melee",   name: "Guerreiro",  slug: "guerreiro",  desc: "Corte amplo, guarda de ferro. Alto STR/VIT.",     stats: "STR 9 · VIT 8 · HP 130 · MP 30" },
      { id: "magic",   name: "Mago",       slug: "mago",       desc: "Raio Arcano, Bola de Fogo. Alto INT.",            stats: "INT 10 · HP 80 · MP 90" },
      { id: "paladin", name: "Paladino",   slug: "paladino",   desc: "Golpe Sagrado cura ao acertar. Equilibrado.",     stats: "STR 7 · INT 6 · HP 110 · MP 60" },
      { id: "necro",   name: "Necromante", slug: "necromante", desc: "Dreno de Vida + Invocar Esqueleto. Alto INT.",    stats: "INT 11 · HP 90 · MP 100" },
      { id: "archer",  name: "Arqueiro",   slug: "arqueiro",   desc: "Flechas longas rápidas + Chuva de Flechas.",      stats: "AGI 11 · HP 95 · MP 45" },
    ];
    return (
      <div className="min-h-screen w-full flex items-center justify-center font-mono px-6 py-10" style={{ background: "radial-gradient(ellipse at center, #2a1810 0%, #050302 70%)" }}>
        <div className="max-w-6xl w-full">
          <div className="relative p-[3px]" style={{ background: "#f0c040", boxShadow: "0 0 0 3px #8a5a1a, 0 0 0 6px #0a0604, 8px 8px 0 6px rgba(0,0,0,0.6)" }}>
            <div className="p-6" style={{ background: "#1a120a" }}>
              <div className="text-center mb-6">
                <div className="inline-block px-6 py-2" style={{ background: "#f0c040", color: "#1a0a04", boxShadow: "0 3px 0 #8a5a1a, 0 -2px 0 inset #fff0a0" }}>
                  <h2 className="text-2xl font-bold tracking-[0.3em]">ESCOLHA SUA CLASSE</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {classes.map(c => {
                  const active = selectedClass === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelectedClass(c.id)} className="p-5 text-left transition-transform hover:-translate-y-0.5" style={{ background: active ? "#8a6438" : "#2a1c10", boxShadow: active ? "inset 0 2px 0 #b08858, inset 0 -2px 0 #3a2410, 0 0 0 2px #f0c040, 0 0 0 4px #0a0604" : "inset 0 2px 0 #4a3420, inset 0 -2px 0 #0a0604, 0 0 0 2px #0a0604" }}>
                      <div className="mx-auto mb-3 flex items-center justify-center" style={{ width: 112, height: 112, background: "#0f0906", boxShadow: "inset 0 0 0 2px #3a2410" }}>
                        <img src={`/sprites/${c.slug}.png`} alt={c.name} style={{ imageRendering: "pixelated", width: 96, height: 96 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                      </div>
                      <div className="text-lg font-bold tracking-[0.25em] text-center" style={{ color: active ? "#fff0a0" : "#f0c040" }}>{c.name}</div>
                      <div className="text-[11px] mt-2 text-center leading-relaxed" style={{ color: active ? "#f0e0c0" : "#c8a878" }}>{c.desc}</div>
                      <div className="text-[10px] mt-2 text-center" style={{ color: active ? "#e8d8a8" : "#8a6438" }}>{c.stats}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 justify-center mt-8">
                <button onClick={() => setMenu("main")} className="px-6 py-2 tracking-[0.3em] text-sm font-bold" style={{ background: "#2a1c10", color: "#c8a878", boxShadow: "inset 0 2px 0 #4a3420, inset 0 -2px 0 #0a0604, 0 0 0 2px #0a0604" }}>VOLTAR</button>
                <button onClick={() => { stateRef.current = newGame(undefined, selectedClass); setMenu("playing"); }} className="px-8 py-2 tracking-[0.3em] text-sm font-bold" style={{ background: "#f0c040", color: "#1a0a04", boxShadow: "inset 0 2px 0 #fff0a0, inset 0 -2px 0 #8a5a1a, 0 0 0 2px #0a0604" }}>COMEÇAR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      <canvas ref={canvasRef} className="block cursor-crosshair" />
      <button onClick={() => { if (stateRef.current) save(stateRef.current); setMenu("main"); }} className="fixed top-2 left-2 z-10 opacity-40 hover:opacity-100 text-xs bg-black/70 text-white px-2 py-1">menu</button>

      {/* Mobile panel buttons + auto-fire */}
      {isMobile && (
        <>
          <div className="fixed top-2 right-2 z-20 flex gap-1 flex-wrap max-w-[60vw] justify-end">
            {[
              { k: "inventory", label: "I" },
              { k: "stats", label: "C" },
              { k: "mining", label: "N" },
              { k: "crafting", label: "B" },
              { k: "map", label: "M" },
              { k: "help", label: "H" },
            ].map(b => (
              <button
                key={b.k}
                onClick={() => { const g = stateRef.current!; g.panel = g.panel === b.k ? "none" : (b.k as GameState["panel"]); }}
                className="w-10 h-10 bg-black/70 border border-amber-500/60 text-amber-200 text-sm font-mono font-bold"
                style={{ imageRendering: "pixelated" }}
              >{b.label}</button>
            ))}
          </div>
          <button
            onClick={() => setAutoFireUi(v => !v)}
            className={`fixed z-20 w-16 h-16 rounded-full font-mono font-bold text-xs border-2 ${autoFireUi ? "bg-red-600/80 border-red-300 text-white" : "bg-black/70 border-amber-500/60 text-amber-200"}`}
            style={{ right: 24, bottom: 140 }}
          >{autoFireUi ? "AUTO" : "FIRE"}</button>
          {/* skill hotkeys 1-4 */}
          <div className="fixed z-20 flex flex-col gap-1" style={{ right: 24, bottom: 216 }}>
            {["1", "2", "3", "4"].map(n => (
              <button
                key={n}
                onTouchStart={() => inputRef.current.keys.add(n)}
                onTouchEnd={() => inputRef.current.keys.delete(n)}
                onMouseDown={() => inputRef.current.keys.add(n)}
                onMouseUp={() => inputRef.current.keys.delete(n)}
                className="w-12 h-12 bg-black/70 border border-amber-500/60 text-amber-200 font-mono font-bold"
              >{n}</button>
            ))}
          </div>
          {/* Joystick indicators */}
          <JoystickHUD moveRef={moveJoyRef} aimRef={aimJoyRef} />
        </>
      )}
    </div>
  );
}

// tiny overlay that shows the joysticks where the user is touching
function JoystickHUD({ moveRef, aimRef }: {
  moveRef: React.MutableRefObject<{ active: boolean; cx: number; cy: number; dx: number; dy: number }>;
  aimRef: React.MutableRefObject<{ active: boolean; cx: number; cy: number; dx: number; dy: number }>;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    let r = 0;
    const tick = () => { force(x => (x + 1) & 0xff); r = requestAnimationFrame(tick); };
    r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
  }, []);
  const dot = (cx: number, cy: number, dx: number, dy: number, key: string) => (
    <div key={key} className="pointer-events-none fixed z-10" style={{ left: cx - 60, top: cy - 60, width: 120, height: 120 }}>
      <div className="w-full h-full rounded-full border-2 border-amber-300/60 bg-black/30" />
      <div className="absolute rounded-full bg-amber-300/70 border-2 border-amber-100" style={{ width: 44, height: 44, left: 60 - 22 + Math.max(-40, Math.min(40, dx)), top: 60 - 22 + Math.max(-40, Math.min(40, dy)) }} />
    </div>
  );
  return (
    <>
      {moveRef.current.active && dot(moveRef.current.cx, moveRef.current.cy, moveRef.current.dx, moveRef.current.dy, "m")}
      {aimRef.current.active && dot(aimRef.current.cx, aimRef.current.cy, Math.max(-40, Math.min(40, aimRef.current.dx * 0.4)), Math.max(-40, Math.min(40, aimRef.current.dy * 0.4)), "a")}
    </>
  );
}

// re-export types to silence unused import warnings in prod bundles
export type { GameState };
// suppress unused import lint
void PROFESSION_LIST;
