#!/bin/bash
# Render startup script for Sustainex Backend
cd /opt/render/project/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
