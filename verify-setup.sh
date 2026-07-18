#!/usr/bin/env bash

set -u

passed=0
failed=0

check() {
  local description="$1"
  local command="$2"

  if eval "$command" >/dev/null 2>&1; then
    printf "[PASS] %s\n" "$description"
    passed=$((passed + 1))
  else
    printf "[FAIL] %s\n" "$description"
    failed=$((failed + 1))
  fi
}

printf "%s\n" "BDA Module - Setup Verification"
printf "%s\n\n" "================================"

printf "%s\n" "Prerequisites"
printf "%s\n" "-------------"
check "Node.js is installed" "command -v node"
check "npm is installed" "command -v npm"
check "MongoDB shell is installed" "command -v mongosh"

printf "\n%s\n" "Project Structure"
printf "%s\n" "-----------------"
check "server directory exists" "test -d server"
check "client directory exists" "test -d client"
check "server package.json exists" "test -f server/package.json"
check "client package.json exists" "test -f client/package.json"
check "server entry point exists" "test -f server/src/server.js"
check "client entry point exists" "test -f client/src/main.jsx"

printf "\n%s\n" "Configuration"
printf "%s\n" "-------------"
check "root .gitignore exists" "test -f .gitignore"
check "README exists" "test -f README.md"
check "server .env.example exists" "test -f server/.env.example"
check "client .env.example exists" "test -f client/.env.example"
check "server .env exists" "test -f server/.env"
check "client .env exists" "test -f client/.env"

printf "\n%s\n" "Dependencies"
printf "%s\n" "------------"
check "server dependencies are installed" "test -d server/node_modules"
check "client dependencies are installed" "test -d client/node_modules"

printf "\n%s\n" "Summary"
printf "%s\n" "-------"
printf "Passed: %s\n" "$passed"
printf "Failed: %s\n" "$failed"

if [ "$failed" -eq 0 ]; then
  printf "\nAll setup checks passed.\n"
  exit 0
fi

printf "\nSome setup checks failed. Review the messages above before running the app.\n"
exit 1
