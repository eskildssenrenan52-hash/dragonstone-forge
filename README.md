# Dragonstone Forge

✅ Pronto e funcional agora

Fundo pixel art do dragão na tela inicial (src/assets/dragon-bg.jpg, gerado a partir da sua referência).

Necromante + Arqueiro aparecem na seleção de classe com sprites gerados por IA (public/sprites/necromante.png, arqueiro.png) e stats próprios em CLASS_INFO.

Sistema de mineração completo em código (src/game/mining.ts): 27 minérios por bioma (Floresta/Deserto/Gelo/Vulcão/Sombrio + meteóricos), veios com HP, drops 8-30, nível 1-999 com curva de speed/crit/duplo/triplo/gema/raro/mapa/baú, picaretas 1-10 (Madeira→Divina→Criador), veios vivos (normal/fugitivo/explosor/teleporte/invocador). Ligado ao clique: se tiver veio perto, mina em vez de atacar.

Sistema de crafting completo em código (src/game/crafting.ts): 8 profissões (ferreiro, alquimista, joalheiro, engenheiro, encantador, carpinteiro, cozinheiro, tecelão), 6 bancadas, 25+ receitas incluindo 3 secretas (Espada do Eclipse, Elixir Divino, Manto Abissal), qualidades Comum→Divino, sistema de falha/crítico, encantamento (12 elementos), soquete de gemas, evolução de itens (+, ++, Suprema, Mítica, Lendária, Divina), descoberta experimental de receitas secretas.

Eventos (src/game/events.ts): Tempestade de Meteoros (meteoros caem e viram veios raros), Lua Vermelha (drops x3), Terremoto (abre veios extras). Scheduler automático a cada 3-6 min. Já rodando no loop.

Jogador inicia com picareta de madeira equipada, 5 pedras, 3 madeiras antigas e 10 receitas básicas conhecidas.

Build TS limpo, jogo continua rodando.

❌ Ainda falta (não engano você)

Joysticks mobile + botões sprite 32x32: nada foi feito na UI mobile. Precisa do overlay HTML de joystick esq/dir + auto-fire ligando no input.mouse/movimento sintético.

Renderização visual dos veios/meteoros/lua vermelha/skeleton do necromante: os sistemas rodam mas render.ts não desenha nenhum deles ainda. Você não vai ver os veios no mapa, isso inclui o sprite do próprio

Painel de crafting e painel de mineração: as teclas B/N não abrem nada. As funções craft(), enchantItem(), socketGem(), evolveItem() existem mas não têm UI para chamar.

Ataques específicos por classe: Necromante e Arqueiro usam o ataque genérico. Falta invocar esqueleto + drenar HP (necro) e flecha rápida longa (arqueiro).

Cavernas expandidas (labirintos/NPCs/portais extras) e drops temáticos de monstros (Golem→Núcleo Rochoso etc.) não foram adicionados.

Fazer cada classe ter ataque e habilidades próprias

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7410084e-8a64-4494-ac53-d8364881ef57).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
