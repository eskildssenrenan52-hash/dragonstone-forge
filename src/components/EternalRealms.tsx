import { useEffect, useRef, useState } from "react";
import { newGame, update, save, load, hasSave, wipeSave, logMsg, useInventoryItem, allocAttr, type GameState } from "@/game/game";
import { render } from "@/game/render";
import dragonBg from "@/assets/dragon-bg.jpg";

type Cls = "melee" | "magic" | "paladin" | "necro" | "archer";

export default function EternalRealms() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef({
    keys: new Set<string>(),
    mouse: { x: 0, y: 0, down: false, downOnce: false },
  });
  const [menu, setMenu] = useState<"main" | "class" | "playing">("main");
  const [selectedClass, setSelectedClass] = useState<Cls>("melee");
  const [savedExists, setSavedExists] = useState(false);


  useEffect(() => { setSavedExists(hasSave()); }, [menu]);

  useEffect(() => {
    if (menu !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      inputRef.current.keys.add(k);
      const g = stateRef.current!;
      if (k === "i") { g.panel = g.panel === "inventory" ? "none" : "inventory"; e.preventDefault(); }
      else if (k === "c") { g.panel = g.panel === "stats" ? "none" : "stats"; e.preventDefault(); }
      else if (k === "h") { g.panel = g.panel === "help" ? "none" : "help"; e.preventDefault(); }
      else if (k === "m") { g.panel = g.panel === "map" ? "none" : "map"; e.preventDefault(); }
      else if (k === "p") { g.paused = !g.paused; e.preventDefault(); }
      else if (k === "escape") { g.panel = "none"; }
      else if (e.key === "F5") { save(g); logMsg(g, "Jogo salvo.", "#5ea8ff"); e.preventDefault(); }
      else if (e.key === "F9") { const ng = load(); if (ng) { stateRef.current = ng; logMsg(ng, "Jogo carregado.", "#5ea8ff"); } e.preventDefault(); }
      else if (e.key === "F10") { wipeSave(); logMsg(g, "Save apagado.", "#ff8060"); e.preventDefault(); }
    };
    const ku = (e: KeyboardEvent) => inputRef.current.keys.delete(e.key.toLowerCase());
    const mm = (e: MouseEvent) => { inputRef.current.mouse.x = e.clientX; inputRef.current.mouse.y = e.clientY; };
    const md = (e: MouseEvent) => {
      inputRef.current.mouse.down = true;
      inputRef.current.mouse.downOnce = true;
      const g = stateRef.current!;
      // tab bar (present on every open panel)
      if (g.panel !== "none") {
        const tabs = (g as unknown as { _tabs?: Array<{ id: "inventory" | "stats" | "help" | "map"; rect: [number, number, number, number] }> })._tabs;
        if (tabs) {
          for (const t of tabs) {
            const [rx, ry, rw, rh] = t.rect;
            if (e.clientX >= rx && e.clientX <= rx + rw && e.clientY >= ry && e.clientY <= ry + rh) {
              g.panel = t.id;
              return;
            }
          }
        }
      }
      if (g.panel === "inventory") {
        const grid = (g as unknown as { _invGrid?: { x: number; y: number; cellW: number; cellH: number } })._invGrid;
        if (grid) {
          const col = Math.floor((e.clientX - grid.x) / grid.cellW);
          const row = Math.floor((e.clientY - grid.y) / grid.cellH);
          if (col >= 0 && col < 8 && row >= 0 && row < 4) {
            const idx = row * 8 + col;
            useInventoryItem(g, idx);
          }
        }
      } else if (g.panel === "stats") {
        const grid = (g as unknown as { _statsGrid?: { rows: Array<{ k: "str" | "agi" | "int" | "vit"; rect: [number, number, number, number] }> } })._statsGrid;
        if (grid) for (const r of grid.rows) {
          const [rx, ry, rw, rh] = r.rect;
          if (e.clientX >= rx && e.clientX <= rx + rw && e.clientY >= ry && e.clientY <= ry + rh) allocAttr(g, r.k);
        }
      }
    };
    const mu = () => { inputRef.current.mouse.down = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    canvas.addEventListener("mousemove", mm);
    canvas.addEventListener("mousedown", md);
    canvas.addEventListener("mouseup", mu);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = stateRef.current!;
      update(g, dt, inputRef.current, canvas.width, canvas.height);
      render(ctx, g, canvas.width, canvas.height);
      inputRef.current.mouse.downOnce = false;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // autosave every 30s
    const autosave = window.setInterval(() => { if (stateRef.current) save(stateRef.current); }, 30000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(autosave);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [menu]);

  if (menu === "main") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white font-mono relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${dragonBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.9) 100%)" }} />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-6xl md:text-7xl font-bold tracking-widest mb-2" style={{ color: "#f0b040", textShadow: "0 0 20px #f0b040cc, 0 4px 0 #000" }}>
            ETERNAL REALMS
          </h1>
          <p className="text-sm text-neutral-200 mb-10" style={{ textShadow: "0 2px 0 #000" }}>Continente de Asterion • Aventura offline</p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => setMenu("class")}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold tracking-widest w-64"
            >NOVO JOGO</button>
            <button
              disabled={!savedExists}
              onClick={() => { const g = load(); if (g) { stateRef.current = g; setMenu("playing"); } }}
              className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 tracking-widest w-64"
            >CONTINUAR</button>
            <button
              onClick={() => { wipeSave(); setSavedExists(false); }}
              className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 tracking-widest w-64 text-sm"
            >Apagar save</button>
          </div>
          <div className="mt-10 text-xs text-neutral-300 max-w-md mx-auto leading-relaxed" style={{ textShadow: "0 1px 0 #000" }}>
            WASD mover • mouse ataca (ou minera se houver veio próximo) • 1-4 skills • I inv • C atrib • H ajuda • M mapa • F5 salvar
          </div>
        </div>
      </div>
    );
  }


  if (menu === "class") {
    const classes: { id: Cls; name: string; slug: string; desc: string; stats: string }[] = [
      { id: "melee",   name: "Guerreiro",  slug: "guerreiro",  desc: "Combate corpo-a-corpo. Alto STR/VIT.",       stats: "STR 9 · VIT 8 · HP 130 · MP 30" },
      { id: "magic",   name: "Mago",       slug: "mago",       desc: "Magias arcanas devastadoras. Alto INT.",     stats: "INT 10 · HP 80 · MP 90" },
      { id: "paladin", name: "Paladino",   slug: "paladino",   desc: "Guerreiro sagrado equilibrado.",             stats: "STR 7 · INT 6 · HP 110 · MP 60" },
      { id: "necro",   name: "Necromante", slug: "necromante", desc: "Invoca aliados e drena vida. Alto INT.",     stats: "INT 11 · HP 90 · MP 100" },
      { id: "archer",  name: "Arqueiro",   slug: "arqueiro",   desc: "Flechas rápidas de longo alcance. Alto AGI.", stats: "AGI 11 · HP 95 · MP 45" },
    ];
    return (
      <div className="min-h-screen w-full flex items-center justify-center font-mono px-6 py-10"
        style={{ background: "radial-gradient(ellipse at center, #2a1810 0%, #050302 70%)" }}>
        <div className="max-w-6xl w-full">
          {/* pixel frame */}
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
                    <button key={c.id} onClick={() => setSelectedClass(c.id)}
                      className="p-5 text-left transition-transform hover:-translate-y-0.5"
                      style={{
                        background: active ? "#8a6438" : "#2a1c10",
                        boxShadow: active
                          ? "inset 0 2px 0 #b08858, inset 0 -2px 0 #3a2410, 0 0 0 2px #f0c040, 0 0 0 4px #0a0604"
                          : "inset 0 2px 0 #4a3420, inset 0 -2px 0 #0a0604, 0 0 0 2px #0a0604",
                      }}>
                      <div className="mx-auto mb-3 flex items-center justify-center" style={{ width: 112, height: 112, background: "#0f0906", boxShadow: "inset 0 0 0 2px #3a2410" }}>
                        <img src={`/sprites/${c.slug}.png`} alt={c.name} style={{ imageRendering: "pixelated", width: 96, height: 96 }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                      </div>
                      <div className="text-lg font-bold tracking-[0.25em] text-center" style={{ color: active ? "#fff0a0" : "#f0c040" }}>{c.name}</div>
                      <div className="text-[11px] mt-2 text-center leading-relaxed" style={{ color: active ? "#f0e0c0" : "#c8a878" }}>{c.desc}</div>
                      <div className="text-[10px] mt-2 text-center" style={{ color: active ? "#e8d8a8" : "#8a6438" }}>{c.stats}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 justify-center mt-8">
                <button onClick={() => setMenu("main")}
                  className="px-6 py-2 tracking-[0.3em] text-sm font-bold"
                  style={{ background: "#2a1c10", color: "#c8a878", boxShadow: "inset 0 2px 0 #4a3420, inset 0 -2px 0 #0a0604, 0 0 0 2px #0a0604" }}>VOLTAR</button>
                <button onClick={() => { stateRef.current = newGame(undefined, selectedClass); setMenu("playing"); }}
                  className="px-8 py-2 tracking-[0.3em] text-sm font-bold"
                  style={{ background: "#f0c040", color: "#1a0a04", boxShadow: "inset 0 2px 0 #fff0a0, inset 0 -2px 0 #8a5a1a, 0 0 0 2px #0a0604" }}>COMEÇAR</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block cursor-crosshair" />
      <button
        onClick={() => { if (stateRef.current) save(stateRef.current); setMenu("main"); }}
        className="fixed top-2 left-2 z-10 opacity-0 hover:opacity-100 text-xs bg-black/70 text-white px-2 py-1"
      >menu</button>
    </div>
  );
}
