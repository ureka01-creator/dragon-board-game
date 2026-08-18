# Dragon Board audio sources

V0.6.6.2 uses externally authored CC0 music and sound effects, vendored into `assets/audio/` so gameplay never depends on a runtime CDN request. No generated oscillator music is used in the release runtime.

## Background music

Source bundle: `tunasafa/medieaval-days` at commit `8ee84ce61b7e9034603301931629c53bab248da4`.

- `Lament_for_a_Warriors_Soul.mp3` — **Lament for a Warrior's Soul**, RandomMind — CC0. Vendored as `assets/audio/bgm/title.mp3` for title / party setup.
- `Exploration.mp3` — **Exploration**, RandomMind — CC0. Vendored as `assets/audio/bgm/field.mp3` for field exploration.

Source bundle: `tegnike/aozora-islands` at commit `6dc06266c3263e93d8b8efd3d7e9a31b7db141f8`.

- `battle_music_01-loop.ogg` — **Action Time**, SketchyLogic — CC0. Vendored as `assets/audio/bgm/combat.ogg` for normal combat.
- `battle_music_final_loop.mp3` — **Battle Theme A**, cynicmusic — CC0. Vendored as `assets/audio/bgm/boss.mp3` for boss / Ancient Dragon combat.

The source READMEs retain the original OpenGameArt provenance and license information.

## Sound effects

Source bundle: `tegnike/aozora-islands` at commit `6dc06266c3263e93d8b8efd3d7e9a31b7db141f8`.

- `sfx-attack.ogg`, `sfx-block.ogg`, `sfx-damage.ogg` — edited from **Kenney Impact Sounds** — CC0.
- `sfx-command.ogg` — **Kenney Interface Sounds** — CC0.
- `sfx-card-draw.ogg` — edited from **Kenney Casino Audio** — CC0.

Source bundle: `ash4rk/food-pusher` at commit `48de332dd9a6c896e6faa6dba4c15676f69c9c84`, containing the Kenney Casino Audio pack.

- `dice-throw-1.ogg`, `dice-shake-1.ogg` — **Kenney Casino Audio** — CC0.
- `chips-collide-1.ogg` — **Kenney Casino Audio** — CC0.

Source bundle: `jarlah/dungeon-haskell` at commit `8a443d355b99dc3aa09b5c5cd8bf02b55b2fe2c4`.

- `sfx/crit.ogg`, `sfx/levelup.ogg` — **Kenney Music Jingles** — CC0.
- `sfx/miss.ogg` — **Kenney RPG Audio** — CC0.

Vendored SFX are renamed by purpose under `assets/audio/sfx/`.

## Delivery policy

- Every source was fetched from an exact Git commit, then committed into this repository. Upstream branch/CDN changes cannot silently change the game's sound.
- Runtime playback is same-origin from `assets/audio/`; there is no remote audio request during play.
- BGM uses `preload="none"` and starts only after a real user gesture.
- iOS/Safari playback is unlocked from the first real pointer/touch gesture while game handlers remain first on the critical click path.
- Automated browsers skip physical media decoding while still validating asset existence and audio orchestration; real-device playback is verified separately.
- The game keeps a persistent SOUND toggle in `localStorage`.
- CC0 attribution is not legally required, but sources are retained here for traceability and future asset replacement.
