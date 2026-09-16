---
name: prompt-log
description: Save the conversation with the AI (user prompts and AI replies, all sessions in this project) to docs/prompt-log.txt. Use when the user runs /prompt-log or asks to save, update, or export the prompts or the conversation log.
---

# prompt-log

Keeps `docs/prompt-log.txt` up to date. The take-home exercise requires all prompts used during development to be submitted.

## Steps

1. Run from the project root:

   ```bash
   node .claude/skills/prompt-log/prompt-log.mjs
   ```

2. Tell the user the file was updated. Do not commit it unless asked.

## How it works

- Reads the Claude Code session transcripts for this project (`~/.claude/projects/<project-path>/*.jsonl`) and regenerates the whole file each time, so re-running never creates duplicates.
- USER blocks have a solid border, AI blocks a dashed one. AI tool calls show up as one-line `> Tool: ...` entries. Tool output, hidden reasoning and system messages are left out.
- The AI reply being written while the script runs isn't in the transcript yet. The next run picks it up.
