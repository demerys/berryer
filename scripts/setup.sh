#!/usr/bin/env bash
# setup.sh — installation des dépendances et build du MCP server.
# Lancé automatiquement par Claude Code/Cowork après l'install du plugin.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js est requis (≥ 20). Installez-le avant de continuer." >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "❌ Node.js ≥ 20 requis (vous avez $(node -v))." >&2
  exit 1
fi

cd mcp-server
echo "▶ npm install"
npm install --no-fund --no-audit
echo "▶ npm run build"
npm run build
echo "✅ MCP server prêt : mcp-server/dist/index.js"
