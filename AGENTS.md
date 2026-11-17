<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the imported game in `src/dragonstone` and render its browser-only entry through the root content route; this preserves its internal modules without replacing TanStack routing or evaluating canvas code during SSR.
- Preserve the imported game's offline save format and procedural graphics/audio; they are part of the supplied standalone game rather than hosted account data.
