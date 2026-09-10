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

exit 0
