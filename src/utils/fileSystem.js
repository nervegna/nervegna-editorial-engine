import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../../output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export async function saveMarkdown(content) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const randomId = Math.random().toString(36).substring(2, 8);
  const filename = `editorial-${timestamp}-${randomId}.md`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, content, 'utf8');

  return filename;
}

export function readMarkdown(filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  return fs.readFileSync(filepath, 'utf8');
}

export function listEditorials() {
  const files = fs.readdirSync(OUTPUT_DIR);
  return files.filter(f => f.endsWith('.md')).sort().reverse();
}
