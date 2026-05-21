#!/bin/bash
# Paperclip 开发环境启动脚本
# 使用方法: bash dev.sh [server|ui|all]

set -e

# 数据库连接 (Docker 映射到 localhost:5433)
export DATABASE_URL="postgres://paperclip:paperclip@localhost:5433/paperclip"
export PORT=3100
export SERVE_UI=false
export PAPERCLIP_DEPLOYMENT_EXPOSURE=private
export PAPERCLIP_PUBLIC_URL="http://100.64.0.4:5173"
export PAPERCLIP_ALLOWED_HOSTNAMES="100.64.0.4,localhost,127.0.0.1"
export PAPERCLIP_DEPLOYMENT_MODE=authenticated
export PAPERCLIP_INSTANCE_ID=default
export OPENCODE_ALLOW_ALL_MODELS=true
export DEEPSEEK_API_KEY="sk-9e3667164f1e40a29197fbb7497fc57f"
export BETTER_AUTH_SECRET="pc-97d21c5956151717bb6c3cb810f42f7c"

MODE="${1:-all}"

case "$MODE" in
  server)
    echo "🔧 Starting server on :3100..."
    cd /root/paperclip
    pnpm --filter @paperclipai/server dev
    ;;
  ui)
    echo "🎨 Starting UI dev on :5173 (proxy API → :3100)..."
    cd /root/paperclip
    pnpm --filter @paperclipai/ui dev -- --host 0.0.0.0
    ;;
  all)
    echo "🚀 Starting both server + UI dev..."
    echo "   Server: http://100.64.0.4:3100"
    echo "   UI:     http://100.64.0.4:5173"
    echo ""
    
    # Start server in background
    (pnpm --filter @paperclipai/server dev &)
    SERVER_PID=$!
    echo "   Server PID: $SERVER_PID"
    
    # Wait a bit for server to start
    sleep 3
    
    # Start UI dev
    pnpm --filter @paperclipai/ui dev -- --host 0.0.0.0
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null
    ;;
  *)
    echo "Usage: bash dev.sh [server|ui|all]"
    echo "  server - 只启动后端 API"
    echo "  ui     - 只启动前端开发服务器 (需要 server 已运行)"
    echo "  all    - 同时启动后端和前端"
    ;;
esac
