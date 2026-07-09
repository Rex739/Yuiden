#!/usr/bin/env bash

set -euo pipefail

# YuiDen conventional commit helper.
# Usage:
#   chmod +x scripts/commit-yuiden.sh
#   ./scripts/commit-yuiden.sh

types=(
  "feat"
  "fix"
  "docs"
  "style"
  "refactor"
  "perf"
  "test"
  "chore"
  "ci"
  "build"
)

scopes=(
  "landing"
  "dashboard"
  "agent"
  "weather"
  "openai"
  "hsp"
  "contracts"
  "mainnet"
  "testnet"
  "wallet"
  "privy"
  "receipts"
  "settlement"
  "persistence"
  "docs"
  "config"
  "deps"
  "ui"
  "types"
)

echo "🌞 YuiDen Commit Helper"
echo

echo "Select commit type:"
select type in "${types[@]}"; do
  if [[ -n "${type:-}" ]]; then
    break
  fi
  echo "❌ Invalid selection. Try again."
done

echo
echo "Select commit scope:"
select scope in "${scopes[@]}" "custom"; do
  if [[ "${scope:-}" == "custom" ]]; then
    read -r -p "Enter custom scope: " custom_scope
    if [[ -z "$custom_scope" ]]; then
      echo "❌ Scope cannot be empty."
      continue
    fi
    scope="$custom_scope"
    break
  elif [[ -n "${scope:-}" ]]; then
    break
  fi
  echo "❌ Invalid selection. Try again."
done

echo
read -r -p "🔤 Enter a short commit message: " message
if [[ -z "$message" ]]; then
  echo "❌ Commit message cannot be empty."
  exit 1
fi

read -r -p "📝 Enter a detailed description (optional, press Enter to skip): " details
read -r -p "🔗 Reference an issue (optional, e.g., #123): " issue
read -r -p "✏️ Do you want to edit the commit message before committing? (y/n): " edit_choice

commit_msg="$type($scope): $message"

if [[ -n "$details" ]]; then
  commit_msg+=$'\n\n'"$details"
fi

if [[ -n "$issue" ]]; then
  commit_msg+=$'\n\n'"Closes $issue"
fi

echo
echo "Commit preview:"
echo "----------------"
printf '%s\n' "$commit_msg"
echo "----------------"
echo

read -r -p "✅ Proceed with commit? (y/n): " confirm_choice
if [[ ! "$confirm_choice" =~ ^[Yy]$ ]]; then
  echo "Commit cancelled."
  exit 0
fi

if [[ "$edit_choice" =~ ^[Yy]$ ]]; then
  commit_file="$(mktemp)"
  trap 'rm -f "$commit_file"' EXIT
  printf '%s\n' "$commit_msg" > "$commit_file"
  git commit --edit -F "$commit_file"
else
  git commit -m "$commit_msg"
fi

echo
echo "✅ YuiDen commit created successfully!"