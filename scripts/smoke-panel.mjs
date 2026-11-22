// Headless smoke test: loads the generated client half against a tiny DOM stub
// and exercises the panel wiring. Run with `node .tmp-inspect/smoke-panel.mjs`.
import fs from 'node:fs';
import vm from 'node:vm';

class El {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attrs = {};
    this.listeners = {};
    this.dataset = {};
    this.style = {
      values: {},
      setProperty: (k, v) => (this.style.values[k] = v),
      getPropertyValue: (k) => this.style.values[k] ?? '',
      removeProperty: (k) => {
        delete this.style.values[k];
      },
    };
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.hidden = false;
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
    if (k === 'hidden') this.hidden = true;
  }
  removeAttribute(k) {
    delete this.attrs[k];
    if (k === 'hidden') this.hidden = false;
  }
  hasAttribute(k) {
    return k in this.attrs;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  appendChild(node) {
    this.children.push(node);
    return node;
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  remove() {
    this.removed = true;
  }
}

const head = new El('head');
const body = new El('body');
const documentElement = new El('html');
const document = {
  head,
  body,
  documentElement,
  createElement: (tag) => new El(tag),
  createComment: (data) => ({ tagName: '#comment', data, remove() {} }),
};

const store = new Map();
const window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  __ModuleLoader__: { load: (spec) => (loaded = spec) },
};

let loaded = null;
const source = fs.readFileSync('client.js', 'utf8');
vm.runInNewContext(source, { window, document, JSON, Math, Object, Array, String, Number, console }, {
  filename: 'client.js',
});

const overrides = [];
const disposers = [];
const mode = { value: 'dark' };
const plugin = loaded.factory();
const ctx = {
  theme: {
    overrideTokens: (id, tokens) => {
      overrides.push({ id, tokens });
      return () => disposers.push(id);
    },
    setTheme: (id) => {
      mode.value = id;
    },
    getTheme: () => ({ preference: mode.value }),
  },
  effect: (fn) => fn(),
};
plugin.apply(ctx);

const fail = [];
let passed = 0;
const check = (ok, label) => {
  if (!ok) fail.push(label);
  else passed += 1;
};

check(loaded.id === 'dsh-kairosoft-theme', 'module id');
check(plugin.inject[0] === 'theme', 'inject theme');
check(overrides.length === 1, `override called once (got ${overrides.length})`);
check(Object.keys(overrides[0]?.tokens ?? {}).length === 166, 'token count 166');
check(overrides[0]?.tokens['--dsw-alias-bg-base'].light.includes('0.8'), 'bg-base alpha from settings');
check(
  overrides[0]?.tokens['--dsw-specific-sidebar-fill'].dark === overrides[0]?.tokens['--dsw-alias-bg-base'].dark,
  'sidebar linked to main area by default',
);

const style = head.children.find((n) => n.tagName === 'style');
check(Boolean(style), 'style injected');
check(style.textContent.includes('.kf-fab'), 'panel css present');
check(style.textContent.includes('--kairosoft-art-image'), 'artwork vars present');

const fab = body.children.find((n) => n.className === 'kf-fab');
const sheet = body.children.find((n) => n.className === 'kf-sheet');
check(Boolean(fab && sheet), 'fab + sheet mounted');
check(sheet.hasAttribute('hidden'), 'sheet starts hidden');
check(String(sheet.style.values['--kf-panel'] || '').startsWith('#'), 'panel paints itself from the theme palette');
check(sheet.style.values['--kf-accent'] !== sheet.style.values['--kf-on-accent'], 'panel accent and its text differ');
fab.listeners.click?.[0]?.();
check(!sheet.hasAttribute('hidden'), 'fab opens sheet');
check(documentElement.style.values['--kairosoft-art-position'] === '38%', 'artwork position applied');
check(
  documentElement.style.values['--kairosoft-caption'] === 'rgba(0, 0, 0, 0)',
  'caption handed to the shell as transparent',
);

const ranges = [];
const checks = [];
const walk = (node) => {
  for (const child of node.children ?? []) {
    if (child.tagName === 'input' && child.attrs.type === 'range') ranges.push(child);
    if (child.tagName === 'input' && child.attrs.type === 'checkbox') checks.push(child);
    walk(child);
  }
};
walk(sheet);
check(ranges.length === 3, `three sliders (got ${ranges.length})`);
check(checks.length === 3, `three toggles (got ${checks.length})`);
check(ranges[1].disabled === true, 'sidebar slider disabled while linked');
check(documentElement.dataset.kairosoftShadow === 'off', 'soft shadows flattened by default');

const linkBox = checks[1];
linkBox.listeners.change?.[0]?.({ target: { checked: false } });
check(overrides.length === 2, 'unlinking re-applies');
check(ranges[1].disabled === false, 'sidebar slider re-enabled when unlinked');
check(
  overrides[1].tokens['--dsw-specific-sidebar-fill'].dark !== overrides[1].tokens['--dsw-alias-bg-base'].dark,
  'unlinked sidebar uses its own wash',
);

const shadowBox = checks[2];
shadowBox.listeners.change?.[0]?.({ target: { checked: true } });
check(documentElement.dataset.kairosoftShadow === 'on', 'shadow toggle restores soft shadows');

ranges[0].listeners.input?.[0]?.({ target: { value: '70' } });
check(overrides.length === 3, 'slider triggers re-override');
const base = overrides[2].tokens['--dsw-alias-bg-base'].light;
check(/rgba\(246, 238, 220, 0\.66\)/.test(base), `panel alpha shifted (got ${base})`);

const reset = sheet.children.find((n) => n.className === 'kf-foot')?.children[0];
reset?.listeners.click?.[0]?.();
check(overrides.length === 4, 'reset re-applies');
check(overrides[3].tokens['--dsw-alias-bg-base'].light.includes('0.8'), 'reset restores default alpha');
check(linkBox.checked === true, 'reset re-links sidebar');
check(documentElement.dataset.kairosoftShadow === 'off', 'reset flattens shadows again');

const buttons = [];
const collect = (node) => {
  for (const child of node.children ?? []) {
    if (child.tagName === 'button') buttons.push(child);
    collect(child);
  }
};
collect(sheet);
const themeButtons = buttons.filter((b) => b.className === 'kf-theme');
check(themeButtons.length === 7, `theme picker has 7 buttons (got ${themeButtons.length})`);
check(themeButtons[0]?.attrs['aria-pressed'] === 'true', 'first theme selected by default');

const modeButtons = buttons.filter((b) => b.className === 'kf-mode');
check(modeButtons.length === 3, `mode picker has 3 buttons (got ${modeButtons.length})`);
check(modeButtons[1].attrs['aria-pressed'] === 'true', 'dark mode reflected from the theme service');
modeButtons[0].listeners.click?.[0]?.();
check(mode.value === 'light', 'light mode delegated to the theme service');
check(documentElement.style.values['--kairosoft-page-bg'] !== undefined, 'page colour kept across a mode switch');

const beforeSwitch = overrides.length;
themeButtons[1].listeners.click?.[0]?.();
check(overrides.length === beforeSwitch + 1, 'switching theme re-applies tokens');
check(documentElement.style.values['--kairosoft-page-bg'] === '#FBF1E0', 'home page colour applied');
check(themeButtons[1].attrs['aria-pressed'] === 'true', 'home button becomes active');
check(themeButtons[0].attrs['aria-pressed'] === 'false', 'onsen button deactivates');

const nativeButton = themeButtons[6];
const beforeNative = overrides.length;
nativeButton.listeners.click?.[0]?.();
check(overrides.length === beforeNative, 'native theme does not override tokens');
check(documentElement.style.values['--kairosoft-page-bg'] === undefined, 'native theme clears page colour');

const reset2 = sheet.children.find((n) => n.className === 'kf-foot')?.children[0];
reset2?.listeners.click?.[0]?.();
check(overrides.length === beforeNative + 1, 'reset after native restores a palette');
check(themeButtons[0].attrs['aria-pressed'] === 'true', 'reset selects the first theme again');

console.log(fail.length ? `FAIL ${fail.join(' | ')}` : `ok   panel runtime (${passed} checks)`);
process.exit(fail.length ? 1 : 0);
