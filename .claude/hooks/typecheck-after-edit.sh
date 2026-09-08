#!/bin/bash
# .claude/hooks/typecheck-after-edit.sh
cat > /dev/null  # skonsumuj stdin, żeby nie blokować pipe'a

MAX_ATTEMPTS=5
COUNTER_FILE="/tmp/claude-typecheck-counter-$$"
COUNT=0
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE")
fi
if [ "$COUNT" -ge "$MAX_ATTEMPTS" ]; then
  rm -f "$COUNTER_FILE"
  exit 0
fi
echo $((COUNT + 1)) > "$COUNTER_FILE"
OUTPUT=$(npm run typecheck 2>&1)
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  rm -f "$COUNTER_FILE"
  exit 0
fi
cat <<EOJSON
{
  "decision": "block",
  "reason": "TypeScript errors found (attempt $((COUNT + 1))/$MAX_ATTEMPTS):\n$(echo "$OUTPUT" | tail -20 | jq -Rs .)"
}
EOJSON
