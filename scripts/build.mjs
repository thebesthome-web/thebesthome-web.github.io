import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { renderSite } from '../src/pages.mjs';
import { services } from '../src/services.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);

function formatHtml(markup) {
  const blockTags = new Set([
    'html', 'head', 'body', 'header', 'nav', 'main', 'footer', 'section', 'article',
    'div', 'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'form', 'label', 'fieldset',
    'select', 'option', 'textarea', 'figure', 'figcaption', 'details', 'summary', 'video',
    'meta', 'link', 'img', 'input', 'a', 'button',
  ]);
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const tokens = markup.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>|[^<]+/gi) ?? [];
  const output = [];
  let line = '';
  let depth = 0;
  let rawTag = '';

  const flush = () => {
    if (line.trim()) output.push(line.trimEnd());
    line = '';
  };
  const startLine = () => {
    if (!line) line = '  '.repeat(depth);
  };

  for (const token of tokens) {
    if (rawTag) {
      if (new RegExp(`<\\/${rawTag}\\s*>`, 'i').test(token)) {
        if (blockTags.has(rawTag)) {
          depth = Math.max(0, depth - 1);
          output.push(`${'  '.repeat(depth)}${token}`);
        } else {
          line += token;
          flush();
        }
        rawTag = '';
      } else {
        line += token;
      }
      continue;
    }

    const tag = token.match(/^<\/?([a-z][\w:-]*)\b/i);
    if (!tag || token.startsWith('<!')) {
      if (token.startsWith('<!')) {
        flush();
        output.push(`${'  '.repeat(depth)}${token}`);
      } else {
        const text = token.replace(/\s+/g, ' ');
        if (text.trim() || line) {
          startLine();
          line += text;
        }
      }
      continue;
    }

    const name = tag[1].toLowerCase();
    const closing = token.startsWith('</');
    const isVoid = voidTags.has(name) || /\/\s*>$/.test(token);
    if (blockTags.has(name)) {
      if (closing) {
        flush();
        depth = Math.max(0, depth - 1);
        output.push(`${'  '.repeat(depth)}${token}`);
      } else {
        flush();
        startLine();
        line += token;
        flush();
        if (!isVoid) depth++;
      }
      continue;
    }

    startLine();
    line += token;
    if (isVoid) continue;
    if (!closing && (name === 'script' || name === 'style')) rawTag = name;
  }
  flush();
  return `${output.join('\n')}\n`;
}

const projects = JSON.parse(await readFile('data/projects.json', 'utf8'));
const manifestPath = 'images/optimized/manifest.json';
const recipe = 'webp-q92-effort6-auto-orient-v1';
let previous = {};
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* First build. */ }
const manifest = {};
const sources = [...new Set([
  ...projects.flatMap(project => project.photos.map(photo => photo.src)),
  ...services.map(service => service.image),
  'images/living-room.jpg', 'images/architect.jpg', 'images/worker.jpg',
  'images/dentist-2530983_1920-1.jpg', 'images/service-maintenance-worker.jpg',
  'images/stone.jpg', 'images/kitchen.jpg', 'images/tap.jpg',
  'images/bg.png', 'logo/logo.png',
])];
let generated = 0;

// Originals are read only. Each display size is encoded directly from its original.
for (const source of sources) {
  const input = await readFile(source);
  const logo = source.startsWith('logo/');
  const hash = createHash('sha256').update(input).update(logo ? `${recipe}-logo-320` : recipe).digest('hex');
  const cached = previous[source];
  if (cached?.hash === hash && !process.argv.includes('--images')) {
    const exists = await Promise.all(cached.variants.map(variant => access(variant.src).then(() => true, () => false)));
    if (exists.every(Boolean)) { manifest[source] = cached; continue; }
  }
  const metadata = await sharp(input).metadata();
  const rotated = metadata.orientation >= 5;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  const requested = logo ? [80, 160, 320] : source === 'images/living-room.jpg' ? [480, 800, 1200, 1600, 1920] : [480, 960, 1600];
  const widths = [...new Set(requested.map(size => Math.min(size, width)))];
  const stem = source.replace(/^(images|logo)\//, '').replace(/\.[^.]+$/, '');
  const variants = [];
  for (const size of widths) {
    const output = `images/optimized/${stem}-${size}.webp`;
    await mkdir(path.dirname(output), { recursive: true });
    const result = await sharp(input).rotate().resize({ width: size, withoutEnlargement: true })
      .webp(logo ? { lossless: true, effort: 6 } : { quality: 92, effort: 6, smartSubsample: true })
      .toFile(output);
    variants.push({ src: output, width: result.width, height: result.height, bytes: result.size });
    generated++;
  }
  manifest[source] = { hash, width, height, originalBytes: input.length, variants };
  console.log(`Images: ${source}`);
}

// Card crops are separate assets: galleries and original links retain the full frame.
const previewProfiles = {
  service: { ratio: 8 / 5, widths: [240, 360, 480, 720, 1080, 1440] },
  gallery: { ratio: 4 / 3, widths: [320, 480, 640, 960, 1440] },
};
const previewSources = {
  service: [...new Set(services.map(service => service.image))],
  gallery: [...new Set(projects.filter(project => project.id !== 'klinika').flatMap(project => project.photos.map(photo => photo.src)))],
};
for (const [profile, sourceList] of Object.entries(previewSources)) {
  const { ratio, widths: requested } = previewProfiles[profile];
  for (const source of sourceList) {
    const original = manifest[source];
    const hash = createHash('sha256').update(original.hash).update(JSON.stringify({ profile, ratio, requested, recipe: 'center-crop-q92-v1' })).digest('hex');
    const cached = previous[source]?.previews?.[profile];
    original.previews ??= {};
    if (cached?.hash === hash && !process.argv.includes('--images')) {
      const exists = await Promise.all(cached.variants.map(variant => access(variant.src).then(() => true, () => false)));
      if (exists.every(Boolean)) { original.previews[profile] = cached; continue; }
    }
    const maxWidth = Math.floor(Math.min(original.width, original.height * ratio));
    const widths = [...new Set(requested.map(width => Math.min(width, maxWidth)))];
    const stem = source.replace(/^(images|logo)\//, '').replace(/\.[^.]+$/, '');
    const variants = [];
    for (const width of widths) {
      const output = `images/optimized/previews/${profile}/${stem}-${width}.webp`;
      await mkdir(path.dirname(output), { recursive: true });
      const result = await sharp(source).rotate()
        .resize({ width, height: Math.round(width / ratio), fit: 'cover', position: 'centre', withoutEnlargement: true })
        .webp({ quality: 92, effort: 6, smartSubsample: true }).toFile(output);
      variants.push({ src: output, width: result.width, height: result.height, bytes: result.size });
      generated++;
    }
    const largest = variants.at(-1);
    original.previews[profile] = { hash, width: largest.width, height: largest.height, variants };
    console.log(`Previews (${profile}): ${source}`);
  }
}
await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const version = createHash('sha256')
  .update(await readFile('css/site.css'))
  .update(await readFile('js/site.js'))
  .digest('hex').slice(0, 10);
const pages = renderSite({ projects, images: manifest, version });
for (const [file, html] of Object.entries(pages)) await writeFile(file, formatHtml(html));
const urls = Object.keys(pages).filter(file => file !== 'footer.html').map(file => `https://thebesthome.cz/${file === 'index.html' ? '' : file}`);
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${Object.keys(pages).length} HTML files; generated ${generated} image variants. Originals unchanged.`);
