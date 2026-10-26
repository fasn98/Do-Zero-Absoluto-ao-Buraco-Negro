#!/usr/bin/env bash
# cc.sh — Claude Code persistente no Replit
#
# Por que o Claude Code "some" no Replit: o instalador normal grava o programa em
# ~/.local e o histórico/login em ~/.claude, e essas pastas ficam FORA do workspace.
# Quando o Replit reinicia o container, elas são apagadas. Só a pasta do projeto
# (o workspace) sobrevive. Este script guarda tudo dentro do workspace:
#   .claude-bin/      o programa Claude Code
#   .claude-persist/  login, configurações, histórico das conversas e memória
#
# Uso (na pasta do projeto):
#   ./cc.sh                    abre uma sessão nova
#   ./cc.sh -c                 continua a última conversa
#   ./cc.sh -r                 escolhe uma conversa antiga para retomar
#   ./cc.sh --remote-control   abre com controle remoto (celular)
#   ./cc.sh -c --remote-control   continua a última conversa, com controle remoto
#   ./cc.sh --atualizar        atualiza o Claude Code para a versão mais nova

set -euo pipefail

WS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$WS/.claude-bin"
CLAUDE_BIN="$BIN_DIR/node_modules/.bin/claude"

export CLAUDE_CONFIG_DIR="$WS/.claude-persist"
export CLAUDE_CODE_PROJECT_DIR_NAME="zero-absoluto"
export DISABLE_AUTOUPDATER=1

mkdir -p "$CLAUDE_CONFIG_DIR" "$BIN_DIR"

# Nunca enviar login e histórico para o Git
for entry in ".claude-persist/" ".claude-bin/"; do
  grep -qxF "$entry" "$WS/.gitignore" 2>/dev/null || echo "$entry" >> "$WS/.gitignore"
done

install_claude() {
  echo "Instalando o Claude Code dentro do workspace (só na primeira vez)..."
  [ -f "$BIN_DIR/package.json" ] || echo '{"private": true}' > "$BIN_DIR/package.json"
  npm install --prefix "$BIN_DIR" --no-audit --no-fund @anthropic-ai/claude-code@latest
}

if [ "${1:-}" = "--atualizar" ]; then
  install_claude
  "$CLAUDE_BIN" --version
  exit 0
fi

if [ ! -x "$CLAUDE_BIN" ]; then
  install_claude
fi

cd "$WS"
exec "$CLAUDE_BIN" "$@"
