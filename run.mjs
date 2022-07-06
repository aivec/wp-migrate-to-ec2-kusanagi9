#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { validateConfig } from './validate.mjs';

const args = process.argv.slice(2);
const rawconfigf = args[0] ? args[0] : null;

if (rawconfigf === null) {
  console.log('A path to a valid JSON file is required as the first argument.');
  process.exit(1);
}

if (!existsSync(rawconfigf)) {
  console.log(`${rawconfigf} doesnt exist`);
  process.exit(1);
}

const rawconfig = JSON.parse(readFileSync(rawconfigf, 'utf8'));
console.log(rawconfig);

validateConfig({ host: 'mysite.com'});
