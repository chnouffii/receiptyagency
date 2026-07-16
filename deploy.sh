#!/bin/bash
cd /opt/receipty
git pull
docker compose up -d --build
docker image prune -f
