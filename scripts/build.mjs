// Build step for the Kairosoft onsen theme.
// Source of truth: design/palette.json
// Outputs:
//   client.js                     -- the browser plugin (tokens + light CSS)
//   docs/design/tokens.json       -- resolved token map for documentation
//   docs/design/mockup.html       -- design mockup rendered from the same palette
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'design/themes.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// Every theme carries its own artwork. It is embedded as a data URI so the
// plugin stays a single self-contained bundle (no asset route needed).
const artworkUri = (relative) => {
  const file = path.join(root, relative);
  return fs.existsSync(file) ? `url("data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}")` : 'none';
};

const hex = (h) => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgba = (h, a) => {
  const [r, g, b] = hex(h);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
const mixHex = (a, b, t) => {
  const A = hex(a);
  const B = hex(b);
  const c = A.map((v, i) => Math.round(v * t + B[i] * (1 - t)));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

// Resolve the whole token table for one theme: the same rules, two palettes.
const buildTokens = (L, D) => {
// Resolve one value per mode from a function over the mode palette.
const tk = (fn) => ({ light: fn(L), dark: fn(D) });

return {
  // --- surfaces ---------------------------------------------------------
  '--dsw-alias-bg-base': tk((p) => rgba(p.bg, p === L ? 0.8 : 0.84)),
  '--dsw-alias-bg-layer-1': tk((p) => rgba(p.surface, p === L ? 0.93 : 0.9)),
  '--dsw-alias-bg-layer-2': tk((p) => rgba(p.surfaceAlt, p === L ? 0.94 : 0.91)),
  '--dsw-alias-bg-layer-3': tk((p) => rgba(p.surfaceRaised, p === L ? 0.94 : 0.91)),
  '--dsw-alias-bg-overlay': tk((p) => rgba(p.surface, p === L ? 0.96 : 0.94)),
  '--dsw-alias-bg-skeleton': tk((p) => rgba(p.surfaceAlt, 0.9)),
  '--dsw-alias-bg-mask-1': tk((p) => (p === L ? rgba(L.text, 0.1) : 'rgba(0, 0, 0, 0.32)')),
  '--dsw-alias-bg-mask-2': tk((p) => (p === L ? rgba(L.text, 0.26) : 'rgba(0, 0, 0, 0.52)')),
  '--dsw-alias-bg-mask-3': tk((p) => (p === L ? rgba(L.text, 0.42) : 'rgba(0, 0, 0, 0.7)')),
  '--dsw-alias-bg-mask-drop': tk((p) => (p === L ? 'rgba(24, 16, 8, 0.16)' : 'rgba(0, 0, 0, 0.35)')),
  '--dsw-alias-bg-mask-photo': tk(() => 'rgba(0, 0, 0, 0.45)'),
  '--dsw-alias-bg-multi-select': tk((p) => rgba(p.brand, 0.16)),
  '--dsw-alias-bg-document-preview': tk((p) => p.surface),
  '--dsw-alias-bg-document-selection': tk((p) => rgba(p.brand, 0.24)),
  '--dsw-alias-bg-module-platform': tk((p) => p.surfaceAlt),

  // --- borders ----------------------------------------------------------
  '--dsw-alias-border-l1': tk((p) => rgba(p.text, 0.1)),
  '--dsw-alias-border-l2': tk((p) => rgba(p.text, 0.17)),
  '--dsw-alias-border-l2-darkmode-thin': tk((p) => rgba(p.text, 0.13)),
  '--dsw-alias-border-l3': tk((p) => rgba(p.text, 0.27)),
  '--dsw-alias-border-l4': tk((p) => rgba(p.text, 0.38)),
  '--dsw-alias-border-selected': tk((p) => p.brand),
  '--dsw-alias-border-inverted': tk((p) => p.text),
  '--dsw-alias-border-inverted2': tk((p) => p.text2),

  // --- labels -----------------------------------------------------------
  '--dsw-alias-label-primary': tk((p) => p.text),
  '--dsw-alias-label-primary-bluish': tk((p) => p.text2),
  '--dsw-alias-label-primary-dimmed': tk((p) => p.text3),
  '--dsw-alias-label-primary-foreground': tk((p) => p.onBrand),
  '--dsw-alias-label-primary-inverted': tk((p) => p.bg),
  '--dsw-alias-label-secondary': tk((p) => p.text2),
  '--dsw-alias-label-tertiary': tk((p) => p.text3),
  '--dsw-alias-label-caption': tk((p) => p.text3),
  '--dsw-alias-label-dimmed': tk((p) => p.text4),
  '--dsw-alias-label-on-color': tk((p) => p.onBrand),
  '--dsw-alias-label-shimmer': tk((p) => p.brand),
  '--dsw-alias-label-deep-diving': tk((p) => p.brand),
  '--dsw-alias-label-deep-diving-shimmer': tk((p) => p.brandHover),
  '--dsw-alias-link': tk((p) => p.brand),

  // --- brand and buttons -------------------------------------------------
  '--dsw-alias-brand-primary': tk((p) => p.brand),
  '--dsw-alias-brand-primary-invert': tk((p) => p.onBrand),
  '--dsw-alias-brand-text': tk((p) => p.onBrand),
  '--dsw-alias-button-primary-fill': tk((p) => p.brand),
  '--dsw-alias-button-primary-hover': tk((p) => p.brandHover),
  '--dsw-alias-button-primary-dimmed': tk((p) => mixHex(p.brand, p.bg, 0.45)),
  '--dsw-alias-button-contrast-fill': tk((p) => p.text),
  '--dsw-alias-button-elevated-fill': tk((p) => p.surface),
  '--dsw-alias-button-floating-fill': tk((p) => p.surface),
  '--dsw-alias-button-floating-hover': tk((p) => p.surfaceAlt),
  '--dsw-alias-button-tool-bar-fill': tk((p) => p.surface),
  '--dsw-alias-button-tool-bar-fill-invisible': tk(() => 'transparent'),
  '--dsw-alias-button-tool-bar-hover': tk((p) => p.surfaceAlt),
  '--dsw-alias-button-ghost-active-fill': tk((p) => rgba(p.brand, 0.12)),
  '--dsw-alias-button-ghost-active-border': tk((p) => rgba(p.brand, 0.35)),
  '--dsw-alias-button-ghost-active-hover': tk((p) => rgba(p.brand, 0.18)),
  '--dsw-alias-button-info-fill': tk((p) => p.surfaceAlt),
  '--dsw-alias-button-info-hover': tk((p) => p.surfaceRaised),

  // --- interaction ------------------------------------------------------
  '--dsw-alias-interactive-bg-hover': tk((p) => rgba(p.brand, 0.07)),
  '--dsw-alias-interactive-bg-active': tk((p) => rgba(p.brand, 0.12)),
  '--dsw-alias-interactive-bg-hover-accent': tk((p) => rgba(p.accent, 0.16)),
  '--dsw-alias-interactive-bg-hover-danger': tk((p) => rgba(p.error, 0.1)),
  '--dsw-alias-interactive-bg-hover-solid': tk((p) => p.surfaceAlt),

  // --- cards, menus, popovers -------------------------------------------
  '--dsw-alias-card-fill': tk((p) => p.surface),
  '--dsw-alias-card-fill-hover': tk((p) => p.surfaceAlt),
  '--dsw-alias-card-tile-fill': tk((p) => p.surface),
  '--dsw-alias-settings-card-fill': tk((p) => p.surface),
  '--dsw-alias-settings-card-stroke': tk((p) => rgba(p.text, 0.15)),
  '--dsw-alias-hovercard-bg': tk((p) => p.surface),
  '--dsw-alias-hovercard-label-primary': tk((p) => p.text),
  '--dsw-alias-hovercard-label-secondary': tk((p) => p.text2),
  '--dsw-alias-hovercard-label-tertiary': tk((p) => p.text3),
  '--dsw-alias-hovercard-state-done': tk((p) => p.success),
  '--dsw-alias-hovercard-state-error': tk((p) => p.error),
  '--dsw-alias-menu-group-header-fill': tk(() => 'transparent'),
  '--dsw-alias-menu-icon': tk((p) => p.text3),
  '--dsw-menu-surface-fill': tk((p) => p.surface),
  '--dsw-menu-backdrop-filter': tk(() => 'none'),

  // --- tooltip / toast ---------------------------------------------------
  '--dsw-alias-tooltip-bg': tk((p) => p.tooltipBg),
  '--dsw-alias-tooltip-label': tk((p) => p.tooltipFg),
  '--dsw-alias-tooltip-key-bg': tk((p) => (p === L ? 'rgba(255, 246, 226, 0.16)' : 'rgba(36, 26, 16, 0.12)')),
  '--dsw-alias-toast-bg': tk((p) => p.toastBg),
  '--dsw-alias-toast-label': tk((p) => p.toastFg),
  '--dsw-alias-toast-action': tk((p) => p.toastAction),
  '--dsw-alias-switch-thumb': tk((p) => p.thumb),

  // --- markdown and code --------------------------------------------------
  '--dsw-alias-markdown-code-block': tk((p) => rgba(p.code, 0.94)),
  '--dsw-alias-markdown-code-block-banner': tk((p) => rgba(mixHex(p.code, p.surface, 0.55), 0.96)),
  '--dsw-alias-markdown-code-segment-selected': tk((p) => rgba(p.brand, 0.16)),
  '--dsw-alias-markdown-code-segment-unselected': tk(() => 'transparent'),
  '--dsw-alias-markdown-inline-code': tk((p) => p.code),
  '--dsw-alias-markdown-placeholder': tk((p) => p.text4),
  '--dsw-alias-markdown-tag': tk((p) => p.brand),
  '--dsw-alias-markdown-citation': tk((p) => p.brand),
  '--dsw-alias-json-tree-property': tk((p) => p.text),
  '--dsw-alias-json-tree-keyword': tk((p) => p.brand),
  '--dsw-alias-json-tree-string': tk((p) => p.success),
  '--dsw-alias-json-tree-number': tk((p) => p.accent),
  '--dsw-alias-json-tree-punctuation': tk((p) => p.text3),
  '--dsw-alias-json-tree-icon': tk((p) => p.text3),
  '--dsw-alias-json-tree-hover': tk((p) => rgba(p.brand, 0.08)),
  '--dsw-alias-code-diff-added': tk((p) => mixHex(p.success, p.bg, 0.2)),
  '--dsw-alias-code-diff-deleted': tk((p) => mixHex(p.error, p.bg, 0.2)),
  '--dsw-alias-file-diff-added-bg': tk((p) => mixHex(p.success, p.bg, 0.12)),
  '--dsw-alias-file-diff-added-gutter': tk((p) => mixHex(p.success, p.bg, 0.22)),
  '--dsw-alias-file-diff-added-marker': tk((p) => p.success),
  '--dsw-alias-file-diff-deleted-bg': tk((p) => mixHex(p.error, p.bg, 0.12)),
  '--dsw-alias-file-diff-deleted-gutter': tk((p) => mixHex(p.error, p.bg, 0.22)),
  '--dsw-alias-file-diff-deleted-marker': tk((p) => p.error),

  // --- states -------------------------------------------------------------
  '--dsw-alias-state-success-primary': tk((p) => p.success),
  '--dsw-alias-state-success-secondary': tk((p) => mixHex(p.success, p.bg, 0.35)),
  '--dsw-alias-state-success-tertiary': tk((p) => mixHex(p.success, p.bg, 0.16)),
  '--dsw-alias-state-warn-primary': tk((p) => p.warn),
  '--dsw-alias-state-warn-secondary': tk((p) => mixHex(p.warn, p.bg, 0.35)),
  '--dsw-alias-state-warn-tertiary': tk((p) => mixHex(p.warn, p.bg, 0.16)),
  '--dsw-alias-state-warn-label': tk((p) => (p === L ? p.warn : '#F0D9A4')),
  '--dsw-alias-state-error-primary': tk((p) => p.error),
  '--dsw-alias-state-error-secondary': tk((p) => mixHex(p.error, p.bg, 0.18)),
  '--dsw-alias-state-idle-primary': tk((p) => p.text4),
  '--dsw-alias-state-business-primary': tk((p) => p.brand),
  '--dsw-alias-state-business-tertiary': tk((p) => rgba(p.brand, 0.1)),
  '--dsw-alias-state-done-primary': tk((p) => p.success),
  '--dsw-alias-trajectory-accent': tk((p) => p.accent),

  // --- scrollbars ---------------------------------------------------------
  '--dsw-alias-scrollbar-bg-l1': tk(() => 'transparent'),
  '--dsw-alias-scrollbar-bg-l2': tk((p) => rgba(p.text, 0.08)),
  '--dsw-alias-scrollbar-hover-l1': tk((p) => rgba(p.text, 0.2)),
  '--dsw-alias-scrollbar-hover-l2': tk((p) => rgba(p.text, 0.28)),

  // --- app chrome (specific tokens) ---------------------------------------
  '--dsw-specific-sidebar-fill': tk((p) => rgba(p.sidebar, p === L ? 0.84 : 0.82)),
  '--dsw-specific-sidebar-tint': tk((p) => rgba(p.brand, 0.05)),
  '--dsw-specific-sidebar-glass-fill': tk((p) => rgba(p.surface, 0.72)),
  '--dsw-specific-sidebar-glass-hover': tk((p) => rgba(p.surface, 0.85)),
  '--dsw-specific-sidebar-glass-collapsed-fill': tk((p) => rgba(p.surface, 0.72)),
  '--dsw-specific-sidebar-glass-collapsed-hover': tk((p) => rgba(p.surface, 0.85)),
  '--dsw-specific-sidebar-nav-item-active': tk((p) => rgba(p.brand, 0.1)),
  '--dsw-specific-sidebar-nav-item-active-accent': tk((p) => p.brand),
  '--dsw-specific-sidebar-right-flash': tk((p) => rgba(p.brand, 0.18)),
  '--dsw-specific-menu': tk((p) => p.surface),
  '--dsw-specific-selector': tk((p) => p.surfaceAlt),
  '--dsw-specific-input-major': tk((p) => p.surface),
  '--dsw-specific-login-input': tk((p) => p.surface),
  '--dsw-specific-bubble': tk((p) => p.bubble),
  '--dsw-specific-bubble-highlight': tk((p) => rgba(p.brand, 0.28)),
  '--dsw-specific-tip': tk((p) => mixHex(p.accent, p.surface, 0.14)),
  '--dsw-specific-guide-hero': tk((p) => p.surfaceAlt),
  '--dsw-specific-file-upload-track': tk((p) => rgba(p.text, 0.1)),

  // --- chart / illustration / onboarding ----------------------------------
  '--dsw-alias-chart-messages': tk((p) => p.brand),
  '--dsw-alias-chart-system': tk((p) => p.text3),
  '--dsw-alias-chart-tools': tk((p) => p.success),
  '--dsw-alias-illustration-background': tk((p) => p.surfaceAlt),
  '--dsw-alias-illustration-backing': tk((p) => p.surfaceRaised),
  '--dsw-alias-illustration-detail': tk((p) => p.text3),
  '--dsw-alias-illustration-inset': tk((p) => p.surface),
  '--dsw-alias-illustration-shadow': tk((p) => rgba(p.text, 0.12)),
  '--dsw-alias-illustration-surface': tk((p) => p.surfaceAlt),
  '--dsw-alias-onboarding-accent': tk((p) => p.brand),
  '--dsw-alias-onboarding-card-fill': tk((p) => p.surface),
  '--dsw-alias-onboarding-checkbox-border': tk((p) => rgba(p.text, 0.27)),
  '--dsw-alias-onboarding-secondary-fill': tk((p) => p.surfaceAlt),

  // --- shape, focus, elevation -------------------------------------------
  '--dsw-radius-xs': tk(() => '2px'),
  '--dsw-radius-sm': tk(() => '3px'),
  '--dsw-radius-md': tk(() => '4px'),
  '--dsw-radius-lg': tk(() => '6px'),
  '--dsw-radius-xl': tk(() => '8px'),
  '--dsw-radius-panel': tk(() => '6px'),
  '--dsw-focus-ring-color': tk((p) => p.brand),
  '--dsw-focus-ring-width': tk(() => '2px'),
  // Hard, unblurred offsets: paper pieces stacked on a desk, not glass.
  '--dsw-shadow-lv1': tk((p) => `0 1px 0 ${p === L ? rgba(L.text, 0.12) : 'rgba(0, 0, 0, 0.45)'}`),
  '--dsw-shadow-lv2': tk((p) => `0 2px 0 ${p === L ? rgba(L.text, 0.14) : 'rgba(0, 0, 0, 0.5)'}`),
  '--dsw-shadow-lv3': tk((p) => `0 4px 0 ${p === L ? rgba(L.text, 0.12) : 'rgba(0, 0, 0, 0.45)'}`),
  '--dsw-elevation-stroke-color': tk((p) => rgba(p.text, 0.14)),
};
};

// Relative luminance, for the panel's own contrast guard.
function luminance(hexColor) {
  const [r, g, b] = hex(hexColor).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Opaque, self-consistent colours for the lantern panel, derived from a palette
// so the panel never depends on how a DS alias is defined in a given release.
function panelColors(p) {
  // The selected button is small text on the accent colour, so walk the accent
  // towards the body colour until it clears 4.5:1.
  let accent = p.brand;
  for (let i = 0; i < 8 && contrast(accent, p.onBrand) < 4.5; i += 1) {
    accent = mixHex(accent, p.text, 0.9);
  }
  return {
    panel: p.surface,
    raised: p.surfaceAlt,
    text: p.text,
    muted: p.text3,
    line: rgba(p.text, 0.16),
    accent,
    onAccent: p.onBrand,
    track: rgba(p.text, 0.14),
  };
}

// One entry per theme: the resolved table plus the artwork it hangs on.
const THEMES = Object.fromEntries(
  Object.entries(config.themes).map(([id, theme]) => [
    id,
    {
      label: theme.label,
      artwork: artworkUri(theme.artwork),
      // Solid page colour, used behind the page when the artwork is off; the
      // tokens themselves are translucent and would show nothing on their own.
      page: { light: theme.light.bg, dark: theme.dark.bg },
      // The panel is our own UI: it needs opaque colours it can trust, so it
      // does not have to guess what a DS alias means in this release.
      ui: {
        light: panelColors(theme.light),
        dark: panelColors(theme.dark),
      },
      tokens: buildTokens(theme.light, theme.dark),
    },
  ]),
);
const THEME_IDS = Object.keys(THEMES);
const PRIMARY = config.themes[THEME_IDS[0]];

const CSS = `/* Kairosoft theme pack: the tokens carry the palette, this only adds the
   hand-drawn edges the token system cannot express. */
:root {
  --kairosoft-art-image: none;
  --kairosoft-art-position: 38%;
}
html {
  background-color: var(--kairosoft-page-bg, ${PRIMARY.light.bg});
}
html:has(body[data-ds-dark-theme]) {
  background-color: var(--kairosoft-page-bg-dark, ${PRIMARY.dark.bg});
}
body {
  background-color: transparent !important;
  /* The window's drag strip sits above the app frame and stays unpainted, so the
     artwork would show through it untouched and read brighter than every pane
     below. src/runtime.js measures that strip into --kairosoft-titlebar; a hard
     stop gradient in the pane colour washes exactly that band, in the same layer
     as the picture (a ::before sat behind it and never showed). */
  background-image:
    linear-gradient(var(--dsw-alias-bg-base), var(--dsw-alias-bg-base)),
    var(--kairosoft-art-image);
  background-size:
    100% var(--kairosoft-titlebar, 0px),
    cover;
  background-position:
    left top,
    center var(--kairosoft-art-position);
  background-repeat: no-repeat, no-repeat;
  background-attachment: fixed, fixed;
}
/* The frame is the outermost grid and paints its own fill; leaving it on top
   of the artwork multiplies the two alphas and washes the picture out. Each
   column already paints its own surface, so the frame can go transparent. */
[class*="_frame"] {
  background: transparent !important;
}
/* Windows rounds the content column's top-left corner by 16px; that cut-out
   shows the raw artwork, which reads brighter than every washed pane around it. */
html[data-windows-titlebar] [class*="_frame"] {
  --dsh-windows-content-radius: 0px;
}
html[data-windows-titlebar] [class*="_centerCol"],
html[data-windows-titlebar] [class*="_rightbarCol"] {
  border-radius: 0 !important;
}
/* The shell paints the caption strip itself from a hidden probe that reads
   --dsw-specific-sidebar-fill; a solid band cannot follow the artwork, so the
   runtime samples the picture and hands that colour to the probe instead. */
body > span[style*="--dsw-specific-sidebar-fill"] {
  background-color: var(--kairosoft-caption, var(--dsw-specific-sidebar-fill)) !important;
}
::selection {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);
  color: inherit;
}
:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color);
  outline-offset: 2px;
}`;

// The browser half lives in src/runtime.js; this step only injects the resolved
// token table and the stylesheet so the runtime stays readable and lintable.
const runtimeSource = fs.readFileSync(path.join(root, 'src/runtime.js'), 'utf8');
const fill = (source, marker, value) => source.split(marker).join(value);
const client = fill(
  fill(fill(runtimeSource, '__TOKEN_TABLE__', JSON.stringify(THEMES, null, 2)), '__VERSION__', `'${pkg.version}'`),
  '__CSS_TEXT__',
  JSON.stringify(CSS),
);

fs.writeFileSync(path.join(root, 'client.js'), client);
fs.writeFileSync(
  path.join(root, 'docs/design/tokens.json'),
  JSON.stringify(Object.fromEntries(Object.entries(THEMES).map(([id, theme]) => [id, theme.tokens])), null, 2) + '\n',
);

// --- mockup -------------------------------------------------------------
const vars = (p) => `
  --bg: ${p.bg};
  --surface: ${p.surface};
  --surface-2: ${p.surfaceAlt};
  --surface-3: ${p.surfaceRaised};
  --sidebar: ${p.sidebar};
  --text: ${p.text};
  --text-2: ${p.text2};
  --text-3: ${p.text3};
  --text-4: ${p.text4};
  --brand: ${p.brand};
  --brand-hover: ${p.brandHover};
  --on-brand: ${p.onBrand};
  --accent: ${p.accent};
  --success: ${p.success};
  --bubble: ${p.bubble};
  --code: ${p.code};
  --border-1: ${rgba(p.text, 0.1)};
  --border-2: ${rgba(p.text, 0.17)};
  --border-3: ${rgba(p.text, 0.27)};
  --wash: ${rgba(p.brand, 0.07)};
  --shadow: ${rgba(p.text, 0.13)};`;

const mockup = `<!doctype html>
<html lang="zh-CN" data-mode="light">
<head>
<meta charset="utf-8">
<title>Kairosoft onsen theme - mockup</title>
<style>
  :root {${vars(PRIMARY.light)}
  }
  html[data-mode="dark"] {${vars(PRIMARY.dark)}
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Microsoft YaHei", "PingFang SC", -apple-system, "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .app { display: flex; height: 100%; }

  /* sidebar */
  .sidebar {
    width: 256px; flex: none;
    background: var(--sidebar);
    border-right: 1px solid var(--border-2);
    padding: 16px 12px 12px;
    display: flex; flex-direction: column; gap: 4px;
    background-image: linear-gradient(180deg, var(--wash), transparent 220px);
  }
  .brand { display: flex; align-items: center; gap: 8px; padding: 2px 8px 14px; }
  .brand b { font-size: 13.5px; letter-spacing: .02em; }
  .brand span { margin-left: auto; font-size: 10.5px; color: var(--text-3); }
  .new {
    display: flex; align-items: center; gap: 8px;
    margin: 0 0 14px; padding: 0 12px; height: 36px;
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border-2); border-radius: 4px;
    box-shadow: 0 2px 0 var(--shadow);
    font: inherit; font-size: 13px; text-align: left; cursor: default;
  }
  .new kbd {
    margin-left: auto; font: inherit; font-size: 10.5px; color: var(--text-3);
    border: 1px solid var(--border-2); border-radius: 2px; padding: 0 4px;
  }
  .sec { font-size: 10.5px; color: var(--text-4); letter-spacing: .08em; padding: 10px 10px 4px; }
  .item {
    position: relative; display: block; padding: 7px 10px 7px 12px; border-radius: 3px;
    color: var(--text-2); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .item.active { background: color-mix(in srgb, var(--brand) 10%, transparent); color: var(--text); }
  .item.active::before {
    content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 2px;
    background: var(--brand); border-radius: 1px;
  }
  .grow { flex: 1; }
  .foot {
    display: flex; gap: 6px; border-top: 1px solid var(--border-1); padding-top: 10px;
    color: var(--text-2); font-size: 12.5px;
  }
  .foot span { padding: 4px 8px; border-radius: 3px; }

  /* main */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; position: relative; }
  .main::before {
    content: ""; position: absolute; inset: 0 0 auto 0; height: 260px; pointer-events: none;
    background: linear-gradient(180deg, var(--wash), transparent);
  }
  header {
    flex: none; display: flex; align-items: center; gap: 12px;
    height: 56px; padding: 0 20px; border-bottom: 1px solid var(--border-1);
    position: relative;
  }
  header h1 { font-size: 14px; font-weight: 600; margin: 0; }
  header .sub { font-size: 11.5px; color: var(--text-3); padding-left: 10px; border-left: 1px solid var(--border-2); }
  header .right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 9px;
    background: var(--surface-2); border: 1px solid var(--border-2); border-radius: 3px;
    font-size: 11.5px; color: var(--text-2);
  }
  .icon {
    width: 26px; height: 26px; display: grid; place-items: center;
    border: 1px solid var(--border-2); border-radius: 3px; background: var(--surface);
    color: var(--text-2); font-size: 12px;
  }

  /* chat */
  .chat { flex: 1; overflow: hidden; padding: 26px 24px 0; position: relative; }
  .convo { width: 780px; max-width: 100%; margin: 0 auto; }
  .msg { display: flex; gap: 12px; margin-bottom: 22px; }
  .avatar {
    flex: none; width: 28px; height: 28px; border-radius: 4px;
    background: var(--brand); color: var(--on-brand);
    display: grid; place-items: center; font-size: 12px; font-weight: 700;
    border: 1px solid var(--border-3); box-shadow: 0 2px 0 var(--shadow);
  }
  .msg .body { min-width: 0; padding-top: 2px; }
  .meta { font-size: 12px; color: var(--text-2); margin-bottom: 2px; }
  .meta em { font-style: normal; color: var(--text-4); font-size: 11px; margin-left: 8px; }
  p { margin: 6px 0; }
  ul { margin: 6px 0; padding-left: 18px; color: var(--text-2); }
  li { margin: 2px 0; }
  li b { color: var(--text); font-weight: 600; }

  .tool {
    margin: 12px 0; border: 1px solid var(--border-2); border-radius: 4px;
    background: var(--surface); box-shadow: 0 2px 0 var(--shadow); overflow: hidden;
  }
  .tool .head {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    border-bottom: 1px solid var(--border-1); font-size: 12px; color: var(--text-2);
  }
  .tool .head b { color: var(--text); font-weight: 600; }
  .pill {
    margin-left: auto; display: inline-flex; align-items: center; gap: 5px;
    font-size: 10.5px; color: var(--success);
    background: color-mix(in srgb, var(--success) 14%, transparent);
    border-radius: 2px; padding: 1px 6px;
  }
  .pill::before { content: ""; width: 5px; height: 5px; background: currentColor; border-radius: 50%; }
  .tool .code-line {
    padding: 8px 12px; font-family: "Cascadia Code", Consolas, monospace;
    font-size: 11.5px; color: var(--text-3); background: var(--code);
  }

  pre {
    margin: 12px 0; padding: 12px 14px; overflow: hidden;
    background: var(--code); border: 1px solid var(--border-2); border-radius: 4px;
    font-family: "Cascadia Code", Consolas, monospace; font-size: 11.8px; line-height: 1.7;
    color: var(--text-2);
  }
  .k { color: var(--brand); }
  .s { color: var(--success); }
  .c { color: var(--text-4); }
  .p { color: var(--text); }

  .user { justify-content: flex-end; }
  .bubble {
    max-width: 560px; padding: 9px 14px;
    background: var(--bubble); color: var(--text);
    border: 1px solid color-mix(in srgb, var(--brand) 28%, transparent);
    border-radius: 6px; box-shadow: 0 2px 0 var(--shadow);
  }

  .swatches { display: flex; gap: 8px; margin: 12px 0 4px; }
  .sw { border: 1px solid var(--border-2); border-radius: 3px; overflow: hidden; background: var(--surface); }
  .sw i { display: block; width: 64px; height: 24px; }
  .sw b { display: block; font-size: 9.5px; font-weight: 400; color: var(--text-3); padding: 2px 5px 3px; letter-spacing: .02em; }

  /* composer */
  .composer { flex: none; padding: 8px 24px 14px; }
  .composer .wrap { width: 780px; max-width: 100%; margin: 0 auto; }
  .box {
    background: var(--surface); border: 1px solid var(--border-3); border-radius: 6px;
    box-shadow: 0 2px 0 var(--shadow); padding: 12px 14px 10px;
  }
  .ph { color: var(--text-4); font-size: 13.5px; padding: 2px 0 16px; }
  .row { display: flex; align-items: center; gap: 8px; }
  .row .ghost {
    height: 26px; padding: 0 8px; display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid var(--border-2); border-radius: 3px; color: var(--text-2); font-size: 11.5px;
    background: var(--surface-2);
  }
  .send {
    margin-left: auto; height: 28px; padding: 0 14px; border: 1px solid var(--border-3);
    border-radius: 3px; background: var(--brand); color: var(--on-brand);
    font: inherit; font-size: 12px; box-shadow: 0 2px 0 var(--shadow);
  }
  .hint { text-align: center; font-size: 10.5px; color: var(--text-4); padding-top: 8px; }

  html[data-mode="dark"] .main::after {
    content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background-image:
      radial-gradient(1px 1px at 62% 9%, rgba(242,231,206,.55), transparent 100%),
      radial-gradient(1px 1px at 74% 16%, rgba(242,231,206,.4), transparent 100%),
      radial-gradient(1.5px 1.5px at 86% 7%, rgba(242,231,206,.5), transparent 100%),
      radial-gradient(1px 1px at 92% 22%, rgba(242,231,206,.35), transparent 100%);
    background-repeat: no-repeat;
  }
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="6.2" y="5.4" width="7.6" height="9.6" rx="2.4" fill="var(--brand)"/>
        <rect x="7.2" y="6.4" width="2.2" height="7.6" rx="1.1" fill="var(--on-brand)" opacity=".28"/>
        <rect x="5.6" y="4" width="8.8" height="1.8" rx=".9" fill="var(--text-2)"/>
        <rect x="5.6" y="14.4" width="8.8" height="1.8" rx=".9" fill="var(--text-2)"/>
        <path d="M8 4V2.6a2 2 0 0 1 4 0V4" fill="none" stroke="var(--text-2)" stroke-width="1" stroke-linecap="round"/>
      </svg>
      <b>DeepSeek Harness</b><span>v0.2</span>
    </div>
    <div class="new">+ 新建会话 <kbd>Ctrl N</kbd></div>
    <div class="sec">今天</div>
    <a class="item active">温泉主题插件设计</a>
    <a class="item">令牌对比度核算</a>
    <div class="sec">更早</div>
    <a class="item">Git 分支整理</a>
    <a class="item">周报草稿</a>
    <div class="grow"></div>
    <div class="foot"><span>设置</span><span>插件</span></div>
  </aside>

  <main class="main">
    <header>
      <h1>温泉主题插件设计</h1>
      <span class="sub">deepseek-flash</span>
      <div class="right">
        <span class="chip">自动 · 高</span>
        <span class="icon">···</span>
      </div>
    </header>

    <div class="chat">
      <div class="convo">
        <div class="msg">
          <div class="avatar">D</div>
          <div class="body">
            <div class="meta">DeepSeek <em>16:24</em></div>
            <p>我把参考图拆成了一套双色板，方向叫「雪夜温泉」：室外是冷蓝的雪，室内是暖木和灯笼。</p>
            <ul>
              <li><b>浅色</b>：米纸底 + 木色描边，像白天的旅馆大堂，长时间阅读不刺眼。</li>
              <li><b>深色</b>：夜靛底 + 灯笼黄，只留关键动作发光，像雪夜的露天温泉。</li>
              <li>主色只给发送、选中、焦点环；大面积仍是中性色，避免整屏发橙。</li>
            </ul>

            <div class="tool">
              <div class="head"><b>写入主题令牌</b><span>client.js</span><span class="pill">已完成</span></div>
              <div class="code-line">ctx.theme.overrideTokens('kairosoft', tokens)</div>
            </div>

<pre><span class="c">// 每个令牌必须同时给出 light / dark</span>
<span class="k">const</span> <span class="p">tokens</span> = {
  <span class="s">'--dsw-alias-bg-base'</span>:     { light: <span class="s">'#F6EEDC'</span>, dark: <span class="s">'#141A24'</span> },
  <span class="s">'--dsw-alias-brand-primary'</span>: { light: <span class="s">'#AE4C18'</span>, dark: <span class="s">'#F2A93B'</span> },
};</pre>
          </div>
        </div>

        <div class="msg user">
          <div class="bubble">先按这个方向做一版，重点看深色模式的对比度。</div>
        </div>

        <div class="msg">
          <div class="avatar">D</div>
          <div class="body">
            <div class="meta">DeepSeek <em>16:25</em></div>
            <p>深色正文用暖白 #F2E7CE，对底色 #141A24 是 14.2:1；主色 #F2A93B 是 8.7:1。浅色主色 #AE4C18 对米纸底 4.7:1，正文 11.6:1，都过 AA。</p>
            <div class="swatches">
              <div class="sw"><i style="background:#F6EEDC"></i><b>#F6EEDC</b></div>
              <div class="sw"><i style="background:#AE4C18"></i><b>#AE4C18</b></div>
              <div class="sw"><i style="background:#D67D3D"></i><b>#D67D3D</b></div>
              <div class="sw"><i style="background:#141A24"></i><b>#141A24</b></div>
              <div class="sw"><i style="background:#F2A93B"></i><b>#F2A93B</b></div>
              <div class="sw"><i style="background:#3A2B1B"></i><b>#3A2B1B</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="composer">
      <div class="wrap">
        <div class="box">
          <div class="ph">给 DeepSeek 发送消息…</div>
          <div class="row">
            <span class="ghost">+ 附件</span>
            <span class="ghost">deepseek-flash</span>
            <span class="ghost">/ 鍛戒护</span>
            <span class="send">发送</span>
          </div>
        </div>
        <div class="hint">内容由 AI 生成，请仔细甄别</div>
      </div>
    </div>
  </main>
</div>
<script>
  if (location.hash === '#dark') document.documentElement.dataset.mode = 'dark';
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'docs/design/mockup.html'), mockup);

console.log(`themes: ${THEME_IDS.join(', ')} (${Object.keys(THEMES[THEME_IDS[0]].tokens).length} tokens each)`);
console.log(`client.js: ${client.length} bytes`);
console.log(`mockup.html: ${mockup.length} bytes`);

