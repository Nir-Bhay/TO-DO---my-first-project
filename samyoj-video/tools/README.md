# tools/

`render.mjs`, `voice.mjs` and `lib/audio-synth.mjs` all need **ffmpeg**. They look for it in this
order:

1. `$FFMPEG` — an explicit path: `FFMPEG=/opt/homebrew/bin/ffmpeg node render.mjs`
2. `./tools/ffmpeg` — a static binary dropped here (this is what the sandbox render used)
3. `ffmpeg` on your `PATH`

The binary is **not committed** (it is ~50 MB). Get one any way you like:

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# no admin rights? a static build straight into this folder:
npx -y @ffmpeg-installer/ffmpeg --version   # or:
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
  | tar -xJ --strip-components=1 -C tools --wildcards 'ffmpeg-*/ffmpeg'
chmod +x tools/ffmpeg
```

Anything ≥ 5.0 works; the builds here were verified on 7.0.2.
