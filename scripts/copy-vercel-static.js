import { cp, rm, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const clientAssetsSrc = resolve(projectRoot, 'dist', 'client', 'assets');
const destAssets = resolve(projectRoot, 'assets');
const robotsSrc = resolve(projectRoot, 'dist', 'client', 'robots.txt');
const robotsDest = resolve(projectRoot, 'robots.txt');

async function main() {
  try {
    await rm(destAssets, { recursive: true, force: true });
    await mkdir(destAssets, { recursive: true });
    await cp(clientAssetsSrc, destAssets, { recursive: true });
    await copyFile(robotsSrc, robotsDest);
    console.log('Copied dist/client assets and robots.txt to project root');
  } catch (error) {
    console.error('Failed to copy Vercel static assets:', error);
    process.exit(1);
  }
}

main();
