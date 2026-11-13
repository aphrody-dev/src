#!/bin/bash
set -u
log=~/fr1-r2.log
for p in /home/ubuntu/src/yolo-snapshots /home/ubuntu/src/yolo-work /home/ubuntu/src/yolo-jobs /home/ubuntu/src/yolo-current /home/ubuntu/re /home/ubuntu/.aphrody /home/ubuntu/apps /var/lib/yolo-cache; do
  n=$(basename $p); dst=r2:aphrody-archive/fr1/$n
  echo "== $(date -Is) copy $p" >>$log
  sudo nice -n 19 ionice -c3 rclone --config /home/ubuntu/.config/rclone/rclone.conf copy "$p" "$dst" --checksum --links --transfers 16 --checkers 32 --s3-chunk-size 64M --fast-list --log-level NOTICE >>$log 2>&1
  echo "== $(date -Is) check $p rc=$?" >>$log
  sudo nice -n 19 rclone --config /home/ubuntu/.config/rclone/rclone.conf check "$p" "$dst" --one-way --links --checkers 32 >>$log 2>&1; echo "CHECK $n rc=$?" >>$log
done
echo DONE >>$log
