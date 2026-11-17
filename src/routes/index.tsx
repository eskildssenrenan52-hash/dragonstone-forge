import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const DragonstoneGame = lazy(() => import("@/dragonstone/Game"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dragonstone Forge — Asterion" },
      { name: "description", content: "Explore Asterion em Dragonstone Forge: cinco classes, mineração, forja e a Grande Masmorra." },
      { property: "og:title", content: "Dragonstone Forge — Asterion" },
      { property: "og:description", content: "Um RPG pixel art com cinco classes, um continente fixo, mineração e forja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return <ClientOnly><Suspense fallback={<div className="min-h-screen bg-background" />}><DragonstoneGame /></Suspense></ClientOnly>;
}
