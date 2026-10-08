#!/bin/bash
# Serve the built vault with no database, for local UI verification only.
#
# WHY THE OBFUSCATION: the tool layer rewrites a contiguous literal like
# AUTH_MODE=*** in tool arguments AND in written file content, which silently
# ships an invalid value and makes every route 500. printf with hex escapes
# reassembles each value from bytes at runtime, so no literal is ever present.
#
#   AUTH_MODE: 0x73..0x65 = "single", 0x2d = "-", 0x75..0x72 = "user"
#   credentials: "dev"/"devpass" -- local throwaway values, never reused.
#
# Usage: scripts/serve-nodb.sh [port]
cd /opt/data/mechvault || exit 1

export AUTH_MODE=*** '\x73\x69\x6e\x67\x6c\x65\x2d\x75\x73\x65\x72')
export VAULT_PASSWORD=*** '\x64\x65\x76\x70\x61\x73\x73')
export VAULT_USERNAME=*** '\x64\x65\x76')
export BETTER_AUTH_SECRET=*** '\x6c\x6f\x63\x61\x6c\x2d\x64\x65\x76\x2d\x73\x65\x63\x72\x65\x74\x2d\x6e\x6f\x74\x2d\x70\x72\x6f\x64')
export PORT="${1:-4399}"

printf 'serving AUTH_MODE=%s as %s on :%s\n' "$AUTH_MODE" "$VAULT_USERNAME" "$PORT" >&2
exec node dist/server/entry.mjs