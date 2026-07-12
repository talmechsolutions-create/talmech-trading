#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = process.cwd();
const expectedName = 'talmech-trading-marketplace';
const expectedRemote = 'talmechsolutions-create/talmech-trading';
const errors = [];
const warnings = [];

function exists(name) {
  return fs.existsSync(path.join(cwd, name));
}

if (path.basename(cwd) !== expectedName) {
  errors.push(`Current folder must be ${expectedName}. Current folder: ${cwd}`);
}

if (path.basename(cwd) === 'talmech-trading-public-marketplace-final') {
  errors.push('You are in the parent duplicate folder. Change into talmech-trading-marketplace before building or pushing.');
}

for (const required of ['.git', 'package.json', 'app']) {
  if (!exists(required)) errors.push(`Missing required project item: ${required}`);
}

let remote = '';
try {
  remote = execSync('git remote get-url origin', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
} catch (error) {
  errors.push('Unable to read git remote origin.');
}

if (remote && !remote.includes(expectedRemote)) {
  errors.push(`Remote origin must include ${expectedRemote}. Current origin: ${remote}`);
}

if (exists('.env') || exists('.env.local')) {
  warnings.push('Local env files exist. They must stay untracked and must never be shared.');
}

if (exists('.vercel') || exists('.next') || exists('node_modules')) {
  warnings.push('Generated/local folders exist. Build/share only through clean scripts, not by zipping the raw folder.');
}

console.log('Talmech live project verification');
console.log(`cwd: ${cwd}`);
console.log(`origin: ${remote || '(not available)'}`);

warnings.forEach((message) => console.warn(`WARN: ${message}`));

if (errors.length) {
  errors.forEach((message) => console.error(`ERROR: ${message}`));
  process.exit(1);
}

console.log('OK: live project folder and remote look correct.');
