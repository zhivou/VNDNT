#!/usr/bin/env node
// Scans everything a pull request would publish for secrets and personal data (PII, PHI):
// the added lines and messages of every branch commit that isn't on the base branch, plus
// the staged changes. Prints findings with their values masked.
//
// Usage: node .claude/skills/create-pr/scan-sensitive.mjs --base main
// Exit codes: 0 clean, 1 blocked (or the scan itself failed), 2 needs review.

import { execFileSync } from 'node:child_process';

const git = (...args) =>
  execFileSync('git', ['-c', 'core.quotepath=off', ...args], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });

const fail = (message) => {
  console.error(`${message}\nRESULT: SCAN FAILED`);
  process.exit(1);
};

const base = process.argv[process.argv.indexOf('--base') + 1];
if (!process.argv.includes('--base') || !base) fail('Usage: scan-sensitive.mjs --base <base-branch>');

const refExists = (ref) => {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
};
const baseRef = [`origin/${base}`, base].find(refExists);
if (!baseRef) fail(`Base branch "${base}" not found (tried origin/${base} and ${base}).`);
const range = `${baseRef}..HEAD`;

// ---------------------------------------------------------------------------
// What counts as fake

const splitCamel = (text) => text.replace(/([a-z])([A-Z])/g, '$1 $2');

// Test doubles and documentation values, e.g. "wrong_password", "mockToken", "...EXAMPLE".
const FAKE = /(?:^|[^a-z])(?:fake|dummy|mock|sample|example|placeholder|invalid|wrong|incorrect|redacted|here)(?:[^a-z]|$)/i;
const isExample = (value) => FAKE.test(splitCamel(value));

const PLACEHOLDER =
  /^(?:<[^>]*>|\$\w+|%\w+%|[x*.#_-]+|add[-_ ]?here|change[-_ ]?me|replace[-_ ]?me|your[-_ ].*|todo|tbd|none|null|nil|undefined|true|false|string|number|hidden|password|passwd|secret|token)$/i;

// For values next to a password-like name: skips prose, env var names, template variables,
// selectors, paths and URLs.
const isNotASecret = (value) => {
  const v = value.trim();
  return (
    v.length < 4 ||
    /\s/.test(v) ||
    /^\d{1,5}$/.test(v) ||
    /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(v) ||
    /\$\{|\{\{/.test(v) ||
    /^(?:[#.[/]|https?:)/.test(v) ||
    PLACEHOLDER.test(v) ||
    isExample(v)
  );
};

// Public test card numbers from the card networks' and payment providers' docs.
const TEST_CARDS = new Set(['4242424242424242', '4111111111111111', '4012888888881881', '5555555555554444', '5105105105105100', '378282246310005', '6011111111111117']);
const isCardNumber = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19 || !/^[3-6]/.test(digits) || TEST_CARDS.has(digits)) return false;
  const sum = [...digits].reverse().reduce((acc, d, i) => {
    const n = Number(d) * (i % 2 ? 2 : 1);
    return acc + (n > 9 ? n - 9 : n);
  }, 0);
  return sum % 10 === 0;
};

const isPublicIp = (ip) => {
  const [a, b] = ip.split('.').map(Number);
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    /^(?:192\.0\.2|198\.51\.100|203\.0\.113)\./.test(ip)
  );
};

const isRealEmail = (email) => {
  const [local, domain] = email.split('@');
  return !(
    /^(?:no-?reply|git)$/i.test(local) ||
    /(?:^|\.)(?:example\.(?:com|net|org)|example|test|invalid|localhost|local)$/i.test(domain) ||
    /(?:^|\.)users\.noreply\.github\.com$/i.test(domain) ||
    /\.(?:png|jpe?g|gif|svg|webp|js|mjs|ts|css|json|md)$/i.test(domain)
  );
};

// ---------------------------------------------------------------------------
// Rules. "block" is never committed. "review" may be synthetic and needs a decision.
// normalize: match against the line with camelCase split into words (patientId -> patient Id).

const SECRET_NAME = String.raw`[\w.-]*(?:passw(?:or)?d|passphrase|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret)[\w.-]*`;
const CONFIG_FILE = /(?:^|\/)\.env(?:\.[^/]+)?$|\.(?:ya?ml|ini|cfg|conf|properties|toml|sh|bash|zsh)$|(?:^|\/)[^./]+$/;

const CONTENT_RULES = [
  // Secrets
  { level: 'block', label: 'Private key', re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g },
  { level: 'block', label: 'AWS access key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, ignore: isExample },
  { level: 'block', label: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/g, ignore: isExample },
  { level: 'block', label: 'Slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g, ignore: isExample },
  { level: 'block', label: 'Stripe key', re: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/g, ignore: isExample },
  { level: 'block', label: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}/g, ignore: isExample },
  { level: 'block', label: 'AI provider API key', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}/g, ignore: isExample },
  { level: 'block', label: 'npm token', re: /\bnpm_[A-Za-z0-9]{36}\b/g, ignore: isExample },
  { level: 'block', label: 'JSON Web Token', re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, ignore: isExample },
  { level: 'block', label: 'Password in a URL', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"`]+:(?<value>[^\s/@'"`]+)@/gi, ignore: isNotASecret },
  { level: 'block', label: 'Secret in a URL query', re: /[?&](?:access_token|token|api_?key|key|secret|password|sig|signature)=(?<value>[^&\s'"`#]{8,})/gi, ignore: isNotASecret },
  { level: 'block', label: 'Authorization header value', re: /\b(?:Bearer|Basic)\s+(?<value>[A-Za-z0-9._~+/-]{20,}=*)/g, ignore: isNotASecret },
  { level: 'block', label: 'npm auth token', re: /_auth(?:Token)?\s*=\s*(?<value>[^\s$]\S*)/g, ignore: isNotASecret },
  {
    level: 'block',
    label: 'Password or secret in code',
    re: new RegExp(String.raw`${SECRET_NAME}['"]?\s*(?:=>|[:=])\s*(?<q>['"\x60])(?<value>(?:(?!\k<q>).)*)\k<q>`, 'gi'),
    ignore: isNotASecret,
  },
  {
    level: 'block',
    label: 'Password or secret in config',
    re: new RegExp(String.raw`^\s*(?:export\s+)?${SECRET_NAME}\s*[:=]\s*(?<value>[^\s'"\x60#]+)\s*(?:#.*)?$`, 'gi'),
    files: CONFIG_FILE,
    ignore: isNotASecret,
  },
  {
    level: 'block',
    label: 'Password typed into a field',
    re: /(?:passw(?:or)?d|pwd)[^\n;]{0,80}?\.(?:fill|type|pressSequentially)\(\s*(?<q>['"`])(?<value>(?:(?!\k<q>).)+)\k<q>/gi,
    ignore: isNotASecret,
  },

  // Personal data that is never synthetic by accident
  { level: 'block', label: 'US Social Security number', re: /(?<![\w-])(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}(?![\w-])/g },
  {
    level: 'block',
    label: 'US Social Security number',
    re: /\b(?:ssn|social[ _-]?security(?:[ _-]?(?:number|num|no))?)\b\W{0,6}(?<value>(?!000|666|9\d\d)\d{9})\b/gi,
    normalize: true,
  },
  { level: 'block', label: 'Payment card number', re: /(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])/g, ignore: (v) => !isCardNumber(v) },

  // Personal data that may be synthetic
  {
    level: 'review',
    label: 'Health record identifier or date of birth (PHI)',
    re: /\b(?:mrn|medical[ _-]?record(?:[ _-]?(?:number|num|no|id))?|patient[ _-]?(?:id|number|num|no)|(?:member|subscriber|beneficiary|policy|medicare|medicaid|health[ _-]?plan)[ _-]?(?:id|number|num|no)|npi|dob|date[ _-]?of[ _-]?birth|birth[ _-]?date)\b['"]?\s*(?:=>|[:=#])?\s*['"]?(?<value>[A-Z0-9][A-Z0-9/.-]{3,})/gi,
    normalize: true,
    ignore: (v) => !/\d/.test(v),
  },
  {
    level: 'review',
    label: 'Health data field (PHI)',
    re: /\b(?:patient(?:[ _-]?name)?|diagnos[ie]s(?:[ _-]?codes?)?|icd[ _-]?(?:9|10)(?:[ _-]?codes?)?|medications?|prescriptions?|allerg(?:y|ies)|lab[ _-]?results?|blood[ _-]?type|insurance(?:[ _-]?\w+)?|mrn|ssn|dob|date[ _-]?of[ _-]?birth)\b['"]?\s*(?:=>|:|=(?!=))/gi,
    normalize: true,
  },
  {
    level: 'review',
    label: 'Email address',
    re: /(?<!\/\/[^\s/@]*)\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g, // not user:pass@host in a URL
    ignore: (v) => !isRealEmail(v),
  },
  {
    level: 'review',
    label: 'Phone number',
    re: /(?<![\w.+-])(?:(?:\+?1[ .-]?)?(?:\(\d{3}\)[ .-]?|\d{3}[ .-])\d{3}[ .-]\d{4}|\+[2-9]\d{0,2}[ .-]?\(?\d{1,4}\)?[ .-]\d{3,4}[ .-]\d{3,4})(?![\w-])/g,
    ignore: (v) => /555[ .-]?01\d\d$/.test(v), // 555-0100 to 555-0199 are reserved for fiction
  },
  {
    level: 'review',
    label: 'Street address',
    re: /\b\d{1,6}\s+(?:[A-Z][A-Za-z]+\.?\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Terrace|Parkway|Pkwy|Highway|Hwy)\b/g,
  },
  {
    level: 'review',
    label: 'Public IP address',
    re: /(?<![\w.])(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?![\w.]*\d)/g,
    ignore: (v) => !isPublicIp(v),
  },
];

const PATH_RULES = [
  { level: 'block', label: 'Environment file', re: /(?:^|\/)\.env(?:\.(?!example$|sample$|template$)[^/]+)?$/ },
  { level: 'block', label: 'Saved login session', re: /(?:^|\/)\.auth\/(?!\.gitignore$)/ },
  { level: 'block', label: 'Key or certificate store', re: /\.(?:pem|key|p12|pfx|jks|keystore|ppk|kdbx)$/i },
  { level: 'block', label: 'SSH private key', re: /(?:^|\/)id_(?:rsa|dsa|ecdsa|ed25519)$/ },
  { level: 'block', label: 'Credentials file', re: /(?:^|\/)(?:\.netrc|\.pgpass|\.htpasswd|credentials\.json|secrets?\.(?:json|ya?ml|env|txt))$/i },
  { level: 'block', label: 'Network recording (HAR, holds cookies and tokens)', re: /\.har$/i },
  { level: 'block', label: 'Test output (traces, screenshots, videos)', re: /(?:^|\/)(?:test-results|playwright-report|blob-report|\.playwright-mcp)\/|(?:^|\/)trace\.zip$/ },
  { level: 'review', label: 'Data export or database file', re: /\.(?:csv|tsv|xlsx?|sql|sqlite3?|db|dump|bak|parquet)$/i },
];

// ---------------------------------------------------------------------------
// Scanning

const findings = new Map();
const add = (level, label, where, value) => {
  const key = [level, label, where.file, where.line, value].join('\0');
  if (!findings.has(key)) findings.set(key, { level, label, ...where, value });
};

function scanText(text, where) {
  for (const rule of CONTENT_RULES) {
    if (rule.files && !rule.files.test(where.file)) continue;
    const line = rule.normalize ? splitCamel(text) : text;
    for (const match of line.matchAll(rule.re)) {
      const value = match.groups?.value ?? match[0];
      if (!rule.ignore?.(value)) add(rule.level, rule.label, where, value);
    }
  }
}

function scanPath(file, source) {
  for (const rule of PATH_RULES) if (rule.re.test(file)) add(rule.level, rule.label, { file, source }, '');
}

// Reads a -U0 patch. Only added lines are scanned: removed lines aren't published by this PR.
function scanPatch(patch, source) {
  let file = null;
  let line = 0;
  let inHeader = false;
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      file = null;
      inHeader = true;
    } else if (inHeader && raw.startsWith('+++ ')) {
      const target = raw.slice(4).replace(/\t$/, '').replace(/^"(.*)"$/, '$1');
      file = target === '/dev/null' ? null : target.replace(/^b\//, '');
      if (file) scanPath(file, source);
    } else if (inHeader && raw.startsWith('Binary files ')) {
      const target = raw.match(/ and "?b\/(.*?)"? differ$/)?.[1];
      if (target) {
        scanPath(target, source);
        add('review', 'Binary file, not scanned: open it and check what it shows', { file: target, source }, '');
      }
    } else if (raw.startsWith('@@ ')) {
      inHeader = false;
      line = Number(raw.match(/\+(\d+)/)[1]);
    } else if (!inHeader && file && raw.startsWith('+')) {
      scanText(raw.slice(1), { file, line, source });
      line++;
    }
  }
}

const diffFlags = ['--no-color', '--no-ext-diff', '--no-textconv', '--unified=0'];

const commits = git('log', '-p', ...diffFlags, '--format=%x01%h', range).split('\x01').filter(Boolean);
for (const chunk of commits) {
  const newline = chunk.indexOf('\n');
  scanPatch(chunk.slice(newline + 1), `commit ${chunk.slice(0, newline)}`);
}

const messages = git('log', '--format=%x01%h%n%B', range).split('\x01').filter(Boolean);
for (const chunk of messages) {
  const [hash, ...body] = chunk.split('\n');
  body.forEach((text, i) => scanText(text, { file: '(commit message)', line: i + 1, source: `commit ${hash}` }));
}

const staged = git('diff', '--cached', ...diffFlags);
scanPatch(staged, 'staged');
const stagedFiles = git('diff', '--cached', '--name-only').split('\n').filter(Boolean).length;

// ---------------------------------------------------------------------------
// Report

const mask = (value) => (value.length <= 4 ? '****' : `${value.slice(0, 2)}******  (${value.length} chars)`);
const all = [...findings.values()];
const blocked = all.filter((f) => f.level === 'block');
const review = all.filter((f) => f.level === 'review');

console.log(`Sensitive data scan against ${baseRef}`);
console.log(`  ${commits.length} commit(s) in ${range} (added lines and messages), ${stagedFiles} staged file(s)\n`);

const print = (title, list) => {
  if (!list.length) return;
  console.log(`${title} (${list.length})`);
  for (const f of list) {
    const where = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`  ${where}  [${f.source}]  ${f.label}${f.value ? `: ${mask(f.value)}` : ''}`);
  }
  console.log('');
};
print('BLOCK: never commit or push these', blocked);
print('REVIEW: real or synthetic? Open each one and decide', review);

if (blocked.length) {
  console.log(`RESULT: BLOCKED (${blocked.length} to fix, ${review.length} to review)`);
  process.exit(1);
}
if (review.length) {
  console.log(`RESULT: REVIEW (${review.length} to review)`);
  process.exit(2);
}
console.log('RESULT: CLEAN');
