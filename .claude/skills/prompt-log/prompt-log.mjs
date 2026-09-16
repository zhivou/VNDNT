#!/usr/bin/env node
// Rebuilds docs/prompt-log.txt from the Claude Code session transcripts of this project.
// The whole file is regenerated on every run, so it never duplicates entries.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outFile = path.join(projectRoot, 'docs', 'prompt-log.txt');
const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const transcriptDir = path.join(configDir, 'projects', projectRoot.replace(/[^a-zA-Z0-9]/g, '-'));

const WIDTH = 80;
const home = os.homedir();

const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const shortenHome = (text) => text.split(home).join('~');
const clean = (text) =>
  shortenHome(text)
    .replace(/\x1b?\[[0-9;]*m/g, '') // ANSI colour codes (transcripts may store them without the ESC byte)
    .replace(/^\s*Canary: Checked!\s*/, '') // personal global-instruction marker, not part of the exercise
    .trim();

function userBlock(time, text) {
  const border = `+${'-'.repeat(WIDTH - 2)}+`;
  const label = 'USER';
  return `${border}\n| ${label}${' '.repeat(WIDTH - 4 - label.length - time.length)}${time} |\n${border}\n\n${text}\n`;
}

function aiBlock(time, parts) {
  const border = '- '.repeat(WIDTH / 2).trimEnd();
  const label = '  AI';
  return `${border}\n${label}${' '.repeat(WIDTH - 2 - label.length - time.length)}${time}\n${border}\n\n${parts.join('\n\n')}\n`;
}

function describeTool({ name, input = {} }) {
  const detail =
    input.description ??
    input.file_path ??
    input.notebook_path ??
    input.url ??
    input.query ??
    input.pattern ??
    input.skill ??
    input.command ??
    Object.values(input).find((v) => typeof v === 'string') ??
    '';
  const oneLine = shortenHome(String(detail).split('\n')[0]);
  return `  > ${name}${oneLine ? `: ${oneLine.length > 120 ? `${oneLine.slice(0, 117)}...` : oneLine}` : ''}`;
}

// Returns the text a human typed, or null for records that are not real prompts.
function userPromptText(record) {
  if (record.isMeta || record.isCompactSummary) return null;
  const { content } = record.message;
  if (typeof content !== 'string') return null;
  const cmd = content.match(/<command-name>([\s\S]*?)<\/command-name>/);
  if (cmd) {
    const args = content.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1]?.trim();
    return args ? `${cmd[1].trim()} ${args}` : cmd[1].trim();
  }
  const bash = content.match(/<bash-input>([\s\S]*?)<\/bash-input>/);
  if (bash) return `! ${bash[1].trim()}`;
  if (/^\s*<(local-command-|bash-std)/.test(content)) return null;
  return content;
}

function renderSession(file) {
  const records = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return []; // a line still being written by the live session
      }
    })
    .filter((r) => (r.type === 'user' || r.type === 'assistant') && !r.isSidechain);

  const blocks = [];
  let ai = null; // { time, parts, actions }
  const flushActions = () => {
    if (ai?.actions.length) ai.parts.push(ai.actions.join('\n'));
    if (ai) ai.actions = [];
  };
  const flushAi = () => {
    flushActions();
    if (ai?.parts.length) blocks.push(aiBlock(ai.time, ai.parts));
    ai = null;
  };

  for (const r of records) {
    if (r.type === 'user') {
      const prompt = userPromptText(r);
      if (prompt !== null) {
        flushAi();
        blocks.push(userBlock(fmtTime(r.timestamp), clean(prompt)));
        continue;
      }
      const interrupted = Array.isArray(r.message.content) &&
        r.message.content.some((b) => b.type === 'text' && b.text.startsWith('[Request interrupted by user'));
      if (interrupted && ai) ai.actions.push('  ! Interrupted by user');
      continue;
    }
    ai ??= { time: fmtTime(r.timestamp), parts: [], actions: [] };
    for (const b of r.message.content ?? []) {
      if (b.type === 'text' && clean(b.text)) {
        flushActions();
        ai.parts.push(clean(b.text));
      } else if (b.type === 'tool_use') {
        ai.actions.push(describeTool(b));
      }
    }
  }
  flushAi();

  const first = records[0]?.timestamp;
  return { first, blocks, id: path.basename(file, '.jsonl') };
}

const sessions = fs
  .readdirSync(transcriptDir)
  .filter((f) => f.endsWith('.jsonl'))
  .map((f) => renderSession(path.join(transcriptDir, f)))
  .filter((s) => s.blocks.length)
  .sort((a, b) => a.first.localeCompare(b.first));

const rule = '='.repeat(WIDTH);
const out = [
  rule,
  'PROMPT LOG',
  rule,
  'Full conversation between the user and the AI assistant (Claude Code) used to',
  'build this project, all sessions, in chronological order.',
  '',
  '  USER blocks  (solid border)   the prompts, verbatim',
  '  AI blocks    (dashed border)  the replies; "  > Tool: ..." lines are actions',
  '                                the AI took (reading files, running commands, edits)',
  '',
  `Last generated: ${fmtTime(new Date().toISOString())}`,
  '',
  '',
];
sessions.forEach((s, i) => {
  out.push(rule, `SESSION ${i + 1} of ${sessions.length}  |  started ${fmtTime(s.first)}  |  id ${s.id.slice(0, 8)}`, rule, '', '');
  out.push(s.blocks.join('\n\n'), '');
});

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out.join('\n'));
console.log(`Wrote ${path.relative(projectRoot, outFile)} (${sessions.length} sessions)`);
