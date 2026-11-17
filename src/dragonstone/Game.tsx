import { useCallback, useEffect, useRef, useState } from "react";
import { GameHUD } from "./components/GameHUD";
import { GameModals } from "./components/Modals";
import { TitleScreen } from "./components/TitleScreen";
import { sfx } from "./game/audio";
import {
  hasSave,
  loadGame,
  newGame,
  resurrectInCity,
  saveGame,
  updateGame,
} from "./game/engine";
import { renderGame } from "./game/renderer";
import {
  TILE,
  type GameState,
  type InputState,
  type PanelId,
  type PlayerClass,
} from "./game/types";

type ScreenPhase = "title" | "playing" | "paused" | "gameover";

function computePhase(screen: "title" | "game", g: GameState | null): ScreenPhase {
  if (screen === "title" || !g) return "title";
  if (g.defeatSnapshot) return "gameover";
  if (g.paused) return "paused";
  return "playing";
}

export default function DragonstoneGame() {
  const autostart =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("autostart") === "1";

  const [selectedClass, setSelectedClass] = useState<PlayerClass>("melee");
  const [screen, setScreen] = useState<"title" | "game">(autostart ? "game" : "title");
  const [muted, setMuted] = useState<boolean>(sfx.muted);
  const [saveExists, setSaveExists] = useState<boolean>(() => hasSave());
  const [, setHudTick] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState | null>(autostart ? newGame("melee") : null);
  const inputRef = useRef<InputState>({
    keys: new Set<string>(),
    justPressed: new Set<string>(),
    mouse: { x: 0, y: 0, down: false, downOnce: false },
  });
  const virtualKeysRef = useRef<Set<string>>(new Set());

  const forceSync = useCallback(() => {
    setHudTick((t) => (t + 1) & 0xffff);
  }, []);

  const blurActive = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const clearInputs = useCallback(() => {
    inputRef.current.keys.clear();
    inputRef.current.justPressed.clear();
    inputRef.current.mouse.down = false;
    inputRef.current.mouse.downOnce = false;
    virtualKeysRef.current.clear();
  }, []);

  // Mirror body[data-state] for screen phase
  const phase = computePhase(screen, gameRef.current);
  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  const startNewGame = useCallback(
    (clsOverride?: PlayerClass) => {
      const cls = clsOverride ?? selectedClass;
      sfx.playClick();
      clearInputs();
      gameRef.current = newGame(cls);
      setScreen("game");
      blurActive();
      forceSync();
    },
    [clearInputs, forceSync, selectedClass],
  );

  const continueSavedGame = useCallback(() => {
    const loaded = loadGame();
    if (!loaded) {
      startNewGame();
      return;
    }
    sfx.playClick();
    clearInputs();
    gameRef.current = loaded;
    setScreen("game");
    blurActive();
    forceSync();
  }, [clearInputs, forceSync, startNewGame]);

  const togglePanel = useCallback(
    (target: PanelId) => {
      const g = gameRef.current;
      if (!g || g.defeatSnapshot || g.paused) return;
      g.panel = target;
      sfx.playClick();
      clearInputs();
      blurActive();
      forceSync();
    },
    [clearInputs, forceSync],
  );

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.defeatSnapshot) return;
    if (g.panel !== "none") {
      g.panel = "none";
      sfx.playClick();
      forceSync();
      return;
    }
    g.paused = !g.paused;
    sfx.playClick();
    clearInputs();
    blurActive();
    forceSync();
  }, [clearInputs, forceSync]);

  const handleToggleMute = useCallback(() => {
    sfx.muted = !sfx.muted;
    setMuted(sfx.muted);
    if (!sfx.muted) sfx.playClick();
  }, []);

  const handleSaveNow = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    saveGame(g);
    setSaveExists(true);
    g.log.unshift({ text: "Progresso salvo em Asterion!", color: "var(--game-5ed86a)", life: 6 });
    sfx.playPickup();
    forceSync();
  }, [forceSync]);

  const handleResurrect = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    resurrectInCity(g);
    clearInputs();
    blurActive();
    forceSync();
  }, [clearInputs, forceSync]);

  // Global keyboard & focus hygiene when in game screen
  useEffect(() => {
    if (screen !== "game") return;

    const onKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g) return;
      const k = e.key.toLowerCase();

      if (e.code === "F5") {
        e.preventDefault();
        handleSaveNow();
        return;
      }
      if (e.code === "F9") {
        e.preventDefault();
        const loaded = loadGame();
        if (loaded) {
          gameRef.current = loaded;
          loaded.log.unshift({ text: "Jogo carregado!", color: "var(--game-8fcfff)", life: 5 });
          sfx.playPickup();
          forceSync();
        }
        return;
      }

      if (k === "u") {
        handleToggleMute();
        return;
      }

      if (g.defeatSnapshot) {
        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          handleResurrect();
        }
        return;
      }

      if (k === "escape" || k === "p") {
        e.preventDefault();
        togglePause();
        return;
      }

      const panelMap: Record<string, Exclude<PanelId, "none">> = {
        i: "inventory",
        c: "stats",
        n: "mining",
        b: "crafting",
        m: "map",
        h: "help",
      };
      if (panelMap[k] && !g.paused) {
        e.preventDefault();
        const next = panelMap[k];
        togglePanel(g.panel === next ? "none" : next);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }

      if (!inputRef.current.keys.has(k)) {
        inputRef.current.justPressed.add(k);
      }
      inputRef.current.keys.add(k);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      inputRef.current.keys.delete(e.key.toLowerCase());
    };

    const onBlurOrHide = () => {
      clearInputs();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlurOrHide);
    document.addEventListener("visibilitychange", onBlurOrHide);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlurOrHide);
      document.removeEventListener("visibilitychange", onBlurOrHide);
    };
  }, [
    clearInputs,
    forceSync,
    handleResurrect,
    handleSaveNow,
    handleToggleMute,
    screen,
    togglePanel,
    togglePause,
  ]);

  // Isolated 60 FPS Canvas Simulation + Render Loop
  useEffect(() => {
    if (screen !== "game") return;

    let raf = 0;
    let last = performance.now();
    let hudAccum = 0;
    let autosaveAccum = 0;

    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const frame = (now: number) => {
      const rawDt = (now - last) / 1000;
      last = now;
      const c = canvasRef.current;
      const g = gameRef.current;

      if (c && g) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cssW = window.innerWidth;
        const cssH = window.innerHeight;
        if (c.width !== Math.floor(cssW * dpr) || c.height !== Math.floor(cssH * dpr)) {
          c.width = Math.floor(cssW * dpr);
          c.height = Math.floor(cssH * dpr);
        }

        // Merge virtual mobile keys if active
        for (const vk of virtualKeysRef.current) {
          inputRef.current.keys.add(vk);
        }

        const wasDefeated = !!g.defeatSnapshot;
        updateGame(g, rawDt, inputRef.current, cssW, cssH);
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderGame(ctx, g, cssW, cssH);
          ctx.restore();
        }

        c.dataset.x = String(Math.floor(g.player.pos.x / TILE));
        c.dataset.y = String(Math.floor(g.player.pos.y / TILE));
        c.dataset.hp = String(Math.ceil(g.player.hp));

        if (!wasDefeated && g.defeatSnapshot) {
          setHudTick((t) => (t + 1) & 0xffff);
        }

        hudAccum += Math.min(0.05, rawDt);
        if (hudAccum >= 0.085) {
          hudAccum = 0;
          setHudTick((t) => (t + 1) & 0xffff);
        }

        autosaveAccum += Math.min(0.05, rawDt);
        if (autosaveAccum >= 30 && !g.defeatSnapshot) {
          autosaveAccum = 0;
          saveGame(g);
          setSaveExists(true);
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [screen]);

  const handleVirtualMove = useCallback((dx: number, dy: number) => {
    const vk = virtualKeysRef.current;
    for (const k of ["w", "s", "a", "d"]) {
      vk.delete(k);
      inputRef.current.keys.delete(k);
    }
    if (dy < 0) vk.add("w");
    if (dy > 0) vk.add("s");
    if (dx < 0) vk.add("a");
    if (dx > 0) vk.add("d");
  }, []);

  if (screen === "title" || !gameRef.current) {
    return (
      <TitleScreen
        selectedClass={selectedClass}
        onSelectClass={(cls) => {
          sfx.playClick();
          setSelectedClass(cls);
        }}
        hasSaveData={saveExists}
        onStartNew={() => startNewGame()}
        onContinue={continueSavedGame}
      />
    );
  }

  const g = gameRef.current;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--game-09070a)]">
      {/* Isolated Full-Viewport Game Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onPointerMove={(e) => {
          inputRef.current.mouse.x = e.clientX;
          inputRef.current.mouse.y = e.clientY;
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          blurActive();
          inputRef.current.mouse.x = e.clientX;
          inputRef.current.mouse.y = e.clientY;
          inputRef.current.mouse.down = true;
          inputRef.current.mouse.downOnce = true;
        }}
        onPointerUp={() => {
          inputRef.current.mouse.down = false;
        }}
        onPointerLeave={() => {
          inputRef.current.mouse.down = false;
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Perimeter Pixel-Art HUD */}
      <GameHUD
        g={g}
        muted={muted}
        onToggleMute={handleToggleMute}
        onOpenPanel={togglePanel}
        onTogglePause={togglePause}
        onUseSkill={(idx) => {
          inputRef.current.justPressed.add(String(idx + 1));
        }}
        onToggleAutoFire={() => {
          g.autoFire = !g.autoFire;
          forceSync();
        }}
        onVirtualMove={handleVirtualMove}
      />

      {/* Ornate Pixel-Art Modals */}
      <GameModals
        g={g}
        onClose={() => togglePanel("none")}
        onSelectTab={(tab) => togglePanel(tab)}
        onRefresh={forceSync}
        onResume={togglePause}
        onSaveNow={handleSaveNow}
        onRestart={() => startNewGame(g.player.cls)}
        onExitToTitle={() => {
          saveGame(g);
          setSaveExists(true);
          clearInputs();
          setScreen("title");
        }}
        onResurrect={handleResurrect}
      />
    </div>
  );
}
