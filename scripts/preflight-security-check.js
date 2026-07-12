#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = process.cwd();
const findings = [];
const riskyPathPatterns = [
  /^\.env(?:\..*)?$/i,
  /^\.vercel(?:\/|$)/i,
  /^node_modules(?:\/|$)/i,
  /^\.next(?:\/|$)/i,
  /^data\/.*\.json$/i,
  /\.zip$/i,
  /\.mp4$/i,
];

const secretPatterns = [
  { label: 'Postgres/database URL', pattern: /postgres(?:ql)?:\/\/[^\s"'`]+/i },
  { label: 'Razorpay secret', pattern: /rzp_(?:live|test)_[A-Za-z0-9]{12,}/ },
  { label: 'sk_ secret', pattern: /\bsk_[A-Za-z0-9_-]{16,}\b/ },
  { label: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { label: 'API key assignment', pattern: /\b(?:API_KEY|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|SMTP_PASSWORD|DATABASE_URL)\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{12,}/i },
];

function run(command) {
  try {
    return execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalize(file) {
  return file.replace(/\\/g, '/');
}

function shouldScan(file) {
  if (!file || file.includes('\0')) return false;
  const normalized = normalize(file);
  if (normalized === '.env.example') return false;
  if (/\.(?:png|jpe?g|webp|gif|ico|pdf|woff2?|ttf|eot)$/i.test(normalized)) return false;
  if (/^(?:\.git|node_modules|\.next|\.vercel)\//i.test(normalized)) return false;
  return fs.existsSync(path.join(cwd, normalized)) && fs.statSync(path.join(cwd, normalized)).isFile();
}

const tracked = run('git ls-files');
const staged = run('git diff --cached --name-only --diff-filter=ACMRT');
const files = Array.from(new Set([...tracked, ...staged].map(normalize)));

for (const file of files) {
  if (file === '.env.example') continue;
  if (riskyPathPatterns.some((pattern) => pattern.test(file))) {
    findings.push(`Blocked tracked/staged path: ${file}`);
  }
}

for (const file of files.filter(shouldScan)) {
  let content = '';
  try {
    content = fs.readFileSync(path.join(cwd, file), 'utf8');
  } catch {
    continue;
  }
  for (const rule of secretPatterns) {
    if (rule.pattern.test(content)) {
      findings.push(`${rule.label} pattern found in tracked/staged file: ${file}`);
      break;
    }
  }
}

if (findings.length) {
  console.error('Security preflight failed:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  console.error('Fix by removing secrets/generated data from Git and rotating exposed credentials.');
  process.exit(1);
}

console.log('Security preflight passed: no blocked files or obvious secret patterns found in tracked/staged content.');
