#!/usr/bin/env bash
# Tile a video's still_*.png renders into one labelled contact sheet (7 per row).
#   bash engine/contact-sheet.sh <type>/<video> [out.png]
set -euo pipefail
dir="$1/renders"; out="${2:-$1/renders/contact_sheet.png}"
mapfile -t files < <(ls "$dir"/still_*.png | sort -V)
n=${#files[@]}; per=7; rows=$(( (n + per - 1) / per )); total=$((rows * per))
args=(); filt=""
for i in "${!files[@]}"; do
  f="${files[$i]}"; lbl=$(basename "$f" .png | sed -E 's/still_//; s/_([0-9]{2})s$/.\1s/; s/\.00s$/s/')
  args+=(-i "$f"); filt+="[$i]scale=300:534,drawtext=text='$lbl':x=8:y=8:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.6[v$i];"
done
for ((i=n; i<total; i++)); do args+=(-f lavfi -i color=black:s=300x534); filt+="[$i]null[v$i];"; done
rowsf=""
for ((r=0; r<rows; r++)); do
  ins=""; for ((c=0; c<per; c++)); do ins+="[v$((r*per+c))]"; done
  filt+="${ins}hstack=$per[r$r];"; rowsf+="[r$r]"
done
if ((rows > 1)); then filt+="${rowsf}vstack=$rows"; else filt="${filt%;}"; filt="${filt%\[r0\]}"; filt+=""; fi
ffmpeg -y -loglevel error "${args[@]}" -filter_complex "$filt" -frames:v 1 "$out"
echo "wrote $out"
