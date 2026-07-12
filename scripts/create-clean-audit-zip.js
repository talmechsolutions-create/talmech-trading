#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const outputDir = path.join(cwd, 'audit-output');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(outputDir, `talmech-clean-audit-${stamp}.zip`);

const excluded = [
  /^\.git(?:\/|$)/,
  /^\.next(?:\/|$)/,
  /^node_modules(?:\/|$)/,
  /^\.vercel(?:\/|$)/,
  /^\.env(?:\..*)?$/i,
  /^data\/.*\.json$/i,
  /^logs(?:\/|$)/i,
  /^audit-output(?:\/|$)/i,
  /\.zip$/i,
  /\.mp4$/i,
  /\.tsbuildinfo$/i,
];

function toUnix(file) {
  return file.replace(/\\/g, '/');
}

function isExcluded(relativePath) {
  const normalized = toUnix(relativePath);
  return excluded.some((pattern) => pattern.test(normalized));
}

function walk(dir, prefix = '') {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = prefix ? path.join(prefix, entry.name) : entry.name;
    if (isExcluded(relative)) continue;
    if (entry.isDirectory()) rows.push(...walk(absolute, relative));
    if (entry.isFile()) rows.push(relative);
  }
  return rows;
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

fs.mkdirSync(outputDir, { recursive: true });

const localParts = [];
const centralParts = [];
let offset = 0;
const files = walk(cwd).sort();

for (const relative of files) {
  const name = Buffer.from(toUnix(relative), 'utf8');
  const content = fs.readFileSync(path.join(cwd, relative));
  const stat = fs.statSync(path.join(cwd, relative));
  const { dosTime, dosDate } = dosDateTime(stat.mtime);
  const crc = crc32(content);

  const localHeader = Buffer.concat([
    u32(0x04034b50),
    u16(20),
    u16(0x0800),
    u16(0),
    u16(dosTime),
    u16(dosDate),
    u32(crc),
    u32(content.length),
    u32(content.length),
    u16(name.length),
    u16(0),
    name,
  ]);

  localParts.push(localHeader, content);

  const centralHeader = Buffer.concat([
    u32(0x02014b50),
    u16(20),
    u16(20),
    u16(0x0800),
    u16(0),
    u16(dosTime),
    u16(dosDate),
    u32(crc),
    u32(content.length),
    u32(content.length),
    u16(name.length),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(0),
    u32(offset),
    name,
  ]);

  centralParts.push(centralHeader);
  offset += localHeader.length + content.length;
}

const centralDir = Buffer.concat(centralParts);
const localData = Buffer.concat(localParts);
const endRecord = Buffer.concat([
  u32(0x06054b50),
  u16(0),
  u16(0),
  u16(files.length),
  u16(files.length),
  u32(centralDir.length),
  u32(localData.length),
  u16(0),
]);

fs.writeFileSync(outputFile, Buffer.concat([localData, centralDir, endRecord]));
console.log(`Created clean audit ZIP: ${outputFile}`);
console.log(`Included files: ${files.length}`);
