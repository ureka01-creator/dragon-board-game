# Dragon Board audio sources

V0.6.6.2 streams authored audio from immutable, commit-pinned jsDelivr GitHub URLs. No generated oscillator music is used in the release runtime.

## Background music

Source bundle: `tunasafa/medieaval-days` at commit `8ee84ce61b7e9034603301931629c53bab248da4`.

- `Lament_for_a_Warriors_Soul.mp3` — **Lament for a Warrior's Soul**, RandomMind — CC0. Used for title / party setup.
- `Exploration.mp3` — **Exploration**, RandomMind — CC0. Used for field exploration.
- `Battle.mp3` — **Battle Theme**, Wolfgang_ — CC0. Used for normal combat.

Boss music source: `jarlah/dungeon-haskell` at commit `8a443d355b99dc3aa09b5c5cd8bf02b55b2fe2c4`.

- `assets/music/boss.ogg` — **Epic Boss Battle**, Juhani Junkala — CC0. Used for the Ancient Dragon / boss scene.

The Medieval Days source README documents the above licenses and original OpenGameArt provenance. The Dungeon Haskell `assets/CREDITS.md` documents the boss track as CC0 and its original OpenGameArt source.

## Sound effects

Source bundle: `tegnike/aozora-islands` at commit `6dc06266c3263e93d8b8efd3d7e9a31b7db141f8`.

- `sfx-attack.ogg`, `sfx-block.ogg`, `sfx-damage.ogg` — edited from **Kenney Impact Sounds** — CC0.
- `sfx-command.ogg` — **Kenney Interface Sounds** — CC0.
- `sfx-card-draw.ogg` — edited from **Kenney Casino Audio** — CC0.

Source bundle: `ash4rk/food-pusher` at commit `48de332dd9a6c896e6faa6dba4c15676f69c9c84`, containing the Kenney Casino Audio pack.

- `dice-throw-1.ogg`, `dice-shake-1.ogg` — **Kenney Casino Audio** — CC0. Used for D6 / D20 feedback.
- `chips-collide-1.ogg` — **Kenney Casino Audio** — CC0. Used for shop transaction feedback.

Source bundle: `jarlah/dungeon-haskell` at commit `8a443d355b99dc3aa09b5c5cd8bf02b55b2fe2c4`.

- `sfx/crit.ogg`, `sfx/levelup.ogg` — **Kenney Music Jingles** — CC0.
- `sfx/miss.ogg` — **Kenney RPG Audio** — CC0.

## Delivery policy

- URLs are pinned to exact Git commit hashes so upstream branch changes cannot silently change the game's sound.
- BGM uses `preload="none"`; the browser loads only the active scene's track after a user gesture.
- iOS/Safari playback is unlocked from the first real pointer/touch/click gesture.
- The game keeps a persistent SOUND toggle in `localStorage`.
- CC0 attribution is not legally required, but sources are retained here for traceability and future asset replacement.
