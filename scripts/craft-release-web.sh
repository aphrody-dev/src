#!/bin/bash
# Usage: bash scripts/craft-release-web.sh < scripts/craft-release-web.txt (id tag zip per line). Fetch the upstream release web zips and publish them to R2 aphrody-assets/craft/<id>/ (interim for apps whose fr1 build is not finished).
set -u
D=/srv/build/craft/release-web; mkdir -p $D
while read -r id tag zip; do
  [ -n "$id" ] || continue
  rm -rf $D/$id; mkdir -p $D/$id
  curl -sfL -o $D/$id.zip "https://github.com/storytold/$id/releases/download/$tag/$zip" || { echo "$id download failed"; continue; }
  unzip -q -o $D/$id.zip -d $D/$id && top=$(ls $D/$id | head -1)
  rclone copy $D/$id/$top r2:aphrody-assets/craft/$id --header-upload "Cache-Control: public, max-age=300" && echo "$id $tag uploaded: $(du -sh $D/$id/$top | cut -f1) icon:$(ls $D/$id/$top | rg -i 'icon|favicon' | tr '\n' ' ')"
done
