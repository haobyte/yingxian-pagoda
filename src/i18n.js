// Minimal EN / 中文 switch. English text stays in the data files; Chinese lives in i18n-zh.js
// and is looked up by id / English string, so a missing translation simply falls back to English.
import { UI_ZH, STEPS_ZH, CHAPTERS_ZH, STATUE_ZH, FLOOR_ZH, PHOTOS_ZH, EVENTS_ZH, MISC_ZH } from './i18n-zh.js';

const KEY = 'yingxian-lang';
let lang = 'en';
try {
  const saved = localStorage.getItem(KEY);
  if (saved === 'zh' || saved === 'en') lang = saved;
} catch {
  /* storage can be blocked (private window); stay on English */
}

const listeners = [];
export const getLang = () => lang;
export const isZh = () => lang === 'zh';
export const onLangChange = (fn) => listeners.push(fn);

// UI strings: key -> { en, zh }; {name} placeholders
export function t(key, vars = {}) {
  const e = UI_ZH[key];
  const s = !e ? key : lang === 'zh' && e.zh != null ? e.zh : e.en;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

// Generic English -> Chinese lookup for short names (towers, views, layers, times…)
export const misc = (en) => (lang === 'zh' && MISC_ZH[en]) || en;

export function chapterText(ch) {
  const z = lang === 'zh' ? CHAPTERS_ZH[ch.id] : null;
  return { title: z?.title ?? ch.title, subtitle: z?.subtitle ?? ch.subtitle };
}

// Localized view of a director step: { name, summary, narration, pins:[{...pin, title, sub}] }
export function stepText(step) {
  const z = lang === 'zh' ? STEPS_ZH[step.id] : null;
  if (!z) return step;
  return {
    ...step,
    name: z.name ?? step.name,
    summary: z.summary ?? step.summary,
    narration: z.narration ?? step.narration,
    pins: (step.pins || []).map((p, i) => ({ ...p, title: z.pins?.[i]?.[0] ?? p.title, sub: z.pins?.[i]?.[1] ?? p.sub })),
  };
}

export function statueText(sp) {
  const z = lang === 'zh' ? STATUE_ZH[sp.name] : null;
  return { name: z?.[0] ?? sp.name, note: sp.note ? z?.[1] ?? sp.note : '' };
}
export const floorText = (F) => (lang === 'zh' && FLOOR_ZH[F.level]) || { title: F.title, note: F.note };
export const photoText = (p) => (lang === 'zh' && PHOTOS_ZH[p.key]) || { label: p.label, title: p.title, sub: p.sub };
export const eventText = (e) => (lang === 'zh' && EVENTS_ZH[e.year]) || e.text;

// Fill every [data-i18n] / [data-i18n-title] element
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle)));
}

export function setLang(next) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
