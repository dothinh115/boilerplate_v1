#!/bin/bash

git fetch origin
CHANGES=$(git log HEAD..origin/main --oneline)
if [ "$CHANGES" ];then
    git pull origin main
    echo "Có thay đổi"
else echo "Không có thay đổi"
fi
