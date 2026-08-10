import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const siteRoot = resolve(import.meta.dirname, '..');
const sourceDirectory = resolve(siteRoot, '../../docs');
const targetDirectory = resolve(siteRoot, '.content');

rmSync(targetDirectory, { force: true, recursive: true });
mkdirSync(targetDirectory, { recursive: true });
cpSync(sourceDirectory, targetDirectory, { recursive: true });
