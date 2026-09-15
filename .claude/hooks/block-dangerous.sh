#!/bin/bash
# .claude/hooks/block-dangerous.sh
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

if echo "$COMMAND" | grep -qE 'rm\s+-rf|rm\s+(-\w*\s+)?data/|git\s+push\s+--force|DROP\s+TABLE'; then
  deny "Zablokowano niebezpieczną komendę. Użyj bezpieczniejszej alternatywy."
fi

# Blokada dostępu do plików z sekretami przez Bash (Read(deny) tego NIE pokrywa)
if echo "$COMMAND" | grep -qE '\.env(\.[a-zA-Z]+)?\b|\.pem\b|\.key\b'; then
  deny "Zablokowano dostęp do pliku z sekretami (.env/.key/.pem) przez Bash."
fi

exit 0
