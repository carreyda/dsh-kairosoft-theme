// Structural checks for the published bundle. No dependencies: run with node.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const fail = [];
const ok = [];

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const check = (cond, msg) => (cond ? ok.push(msg) : fail.push(msg));

// package.json
const pkg = JSON.parse(read('package.json'));
check(pkg.name === 'dsh-kairosoft-theme', 'package name');
check(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch declared');
check(pkg.dsh?.client?.platform === 'web', 'dsh.client.platform = web');
check(pkg.dsh?.client?.immediately === true, 'dsh.client.immediately = true');
for (const exp of ['.', './client', './locale/*.json', './icon']) {
  check(typeof pkg.exports?.[exp] === 'string', `exports["${exp}"]`);
}
for (const f of ['locale/zh.json', 'locale/en.json', 'icon.svg', 'docs/preview.svg', 'docs/DETAIL.md']) {
  const covered = pkg.files?.some((g) => g === f || (g.endsWith('/*.json') && f.endsWith('.json'))
    || (g === 'docs' && f.startsWith('docs/')) || (g === 'locale' && f.startsWith('locale/')));
  check(covered, `files covers ${f}`);
}

// patch
const patch = read('cordis.patch.yml');
check(/- insert:/.test(patch), 'patch inserts a plugin');
check(new RegExp(`name:\\s*['"]?${pkg.name}['"]?`).test(patch), 'patch references the package name');

// locales
for (const lang of ['en', 'zh']) {
  const loc = JSON.parse(read(`locale/${lang}.json`));
  check(Boolean(loc.meta?.title), `locale ${lang} title`);
  check(Boolean(loc.meta?.description), `locale ${lang} description`);
  check(exists(loc.meta?.detail ?? ''), `locale ${lang} detail -> ${loc.meta?.detail}`);
}

// detail page: one line, one image, link resolves
for (const f of ['docs/DETAIL.md', 'docs/DETAIL.zh.md']) {
  const lines = read(f).split(/\r?\n/).filter(Boolean);
  check(lines.length === 1, `${f} is a single line`);
  const m = /^!\[[^\]]*\]\(([^)]+)\)$/.exec(lines[0] ?? '');
  check(Boolean(m), `${f} is exactly one image`);
  if (m) check(exists(path.join('docs', m[1])), `${f} image ${m[1]} exists`);
}

// svg rules
const preview = read('docs/preview.svg');
check(/width="640"\s+height="300"/.test(preview), 'preview.svg is 640x300');
check(!/<(text|style|script|foreignObject|animate)\b/i.test(preview), 'preview.svg has no text/style/script/animation');

const icon = read('icon.svg');
check(/width="36"\s+height="36"/.test(icon), 'icon.svg is 36x36');
check(!/<text\b/i.test(icon), 'icon.svg has no text node');
check(Buffer.byteLength(icon) < 256 * 1024, 'icon.svg < 256 KiB');

// tokens
const tokens = JSON.parse(read('docs/design/tokens.json'));
const packs = Object.entries(tokens);
check(packs.length >= 2, `at least two themes bundled (got ${packs.length})`);
for (const [id, pack] of packs) {
  const entries = Object.entries(pack);
  check(entries.length === 166, `${id}: token count is 166 (got ${entries.length})`);
  check(
    entries.every(([, v]) => typeof v.light === 'string' && typeof v.dark === 'string'),
    `${id}: every token has light + dark`,
  );
}
const entries = Object.entries(Object.values(tokens)[0]);
const client = read('client.js');
check(client.includes("id: 'dsh-kairosoft-theme'"), 'client factory id matches package name');
check(/inject:\s*\['theme'\]/.test(client), 'client injects the theme service');
check(client.includes('overrideTokens'), 'client overrides theme tokens');
check(!/\{\s*apply\s*\(/.test(client.replace(/factory\(\)/, '')), 'client only exports a factory (sanity)');
const missing = entries.filter(([k]) => !client.includes(JSON.stringify(k)));
check(missing.length === 0, `all ${entries.length} tokens present in client.js`);

// generated files
for (const f of ['client.js', 'docs/design/mockup.html', 'docs/design/preview-light.png', 'docs/design/preview-dark.png']) {
  check(exists(f), `${f} exists`);
}

for (const line of ok) console.log(`ok   ${line}`);
for (const line of fail) console.log(`FAIL ${line}`);
console.log(`\n${ok.length} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
