# Media assets (optional)

Drop files here. The game **never crashes** if a file is missing — it simply stays silent / shows a placeholder.

## Layout

```
public/assets/
  music/     → BGM tracks  (*.mp3)   e.g. descent.mp3
  audio/     → SFX         (*.mp3)   e.g. ui_select.mp3, alarm.mp3
  images/    → CG / art    (*.jpg, *.png, *.webp)
```

## Story JSON hooks

On any node (or choice for `sfx`):

```json
{
  "text": "...",
  "speaker": "Miller",
  "bgm": "descent",
  "sfx": "airlock",
  "cg": "hangar_arrival",
  "cgCaption": "Main Hangar — Nereus Station",
  "choices": [...]
}
```

| Field | Meaning |
|-------|---------|
| `bgm` | Loop music id (`music/{id}.mp3`). Set `null` or `""` to stop. |
| `sfx` | One-shot sound (`audio/{id}.mp3`) |
| `cg` | Image id (`images/{id}.jpg`) or path like `portraits/aris.png` |
| `cgCaption` | Optional label under / instead of art |

Players can mute from the title screen or HUD.
