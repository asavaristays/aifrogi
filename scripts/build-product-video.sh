#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_DIR="${ROOT_DIR}/public/media/product-video"
SCREEN_DIR="${ASSET_DIR}/screens"
OUTPUT="${ASSET_DIR}/aifrogi-product-tour.mp4"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

for image in dashboard inbox knowledge analytics team; do
  [[ -f "${SCREEN_DIR}/${image}.jpg" ]] || { echo "Missing screen: ${image}.jpg" >&2; exit 2; }
done

node "${ROOT_DIR}/scripts/render-product-video-overlays.mjs" "$WORK_DIR/overlays" "$ROOT_DIR"

make_solid_scene() {
  local card="$1" output="$2" duration="$3"
  local fade_start=$((duration - 1))
  ffmpeg -y -hide_banner -loglevel error \
    -loop 1 -i "$card" \
    -filter_complex "[0:v]scale=1920:1080,fade=t=in:st=0:d=0.5,fade=t=out:st=${fade_start}.5:d=0.5,format=yuv420p[v]" \
    -map "[v]" -t "$duration" -an -c:v libx264 -preset medium -crf 19 -r 30 "$output"
}

make_screen_scene() {
  local image="$1" overlay="$2" output="$3" duration="$4"
  local frames=$((duration * 30))
  local fade_start=$((duration - 1))
  ffmpeg -y -hide_banner -loglevel error \
    -loop 1 -i "$image" \
    -loop 1 -i "$overlay" \
    -filter_complex "[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(zoom+0.00012,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=30[screen];[1:v]scale=1920:1080[overlay];[screen][overlay]overlay=0:0,fade=t=in:st=0:d=0.45,fade=t=out:st=${fade_start}.55:d=0.45,format=yuv420p[v]" \
    -map "[v]" -t "$duration" -an -c:v libx264 -preset medium -crf 19 -r 30 "$output"
}

make_solid_scene "$WORK_DIR/overlays/intro.png" "$WORK_DIR/01.mp4" 7
make_screen_scene "$SCREEN_DIR/dashboard.jpg" "$WORK_DIR/overlays/dashboard.png" "$WORK_DIR/02.mp4" 11
make_screen_scene "$SCREEN_DIR/inbox.jpg" "$WORK_DIR/overlays/inbox.png" "$WORK_DIR/03.mp4" 11
make_screen_scene "$SCREEN_DIR/knowledge.jpg" "$WORK_DIR/overlays/knowledge.png" "$WORK_DIR/04.mp4" 11
make_screen_scene "$SCREEN_DIR/analytics.jpg" "$WORK_DIR/overlays/analytics.png" "$WORK_DIR/05.mp4" 11
make_screen_scene "$SCREEN_DIR/team.jpg" "$WORK_DIR/overlays/team.png" "$WORK_DIR/06.mp4" 11
make_solid_scene "$WORK_DIR/overlays/outro.png" "$WORK_DIR/07.mp4" 9

for scene in "$WORK_DIR"/0*.mp4; do printf "file '%s'\n" "$scene" >> "$WORK_DIR/scenes.txt"; done
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i "$WORK_DIR/scenes.txt" -c copy "$WORK_DIR/video.mp4"

# Original ambient score generated from layered tones; no third-party music is embedded.
ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "aevalsrc=0.032*sin(2*PI*220*t)+0.020*sin(2*PI*277.18*t)+0.016*sin(2*PI*329.63*t)+0.012*sin(2*PI*110*t):s=44100:d=71" \
  -f lavfi -i "anoisesrc=color=pink:amplitude=0.004:sample_rate=44100:d=71" \
  -filter_complex "[0:a]lowpass=f=1400,afade=t=in:st=0:d=2,afade=t=out:st=67:d=4[pad];[1:a]lowpass=f=500,highpass=f=80[air];[pad][air]amix=inputs=2:weights='1 0.35',volume=0.72[a]" \
  -map "[a]" -c:a aac -b:a 160k "$WORK_DIR/music.m4a"

ffmpeg -y -hide_banner -loglevel error -i "$WORK_DIR/video.mp4" -i "$WORK_DIR/music.m4a" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 160k -movflags +faststart -shortest "$OUTPUT"

printf 'Built %s\n' "$OUTPUT"
