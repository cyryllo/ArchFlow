// The ArchFlow icon set (ids, categories and names in every UI language),
// generated from the app by scripts/build-catalog.mjs.
import { createRequire } from 'node:module';

interface CatalogIcon {
  id: string;
  category: string;
  names: Record<string, string>;
}
interface CatalogCategory {
  id: string;
  [lang: string]: string;
}
interface Catalog {
  languages: string[];
  categories: CatalogCategory[];
  icons: CatalogIcon[];
}

const require = createRequire(import.meta.url);
export const catalog = require('./catalog.json') as Catalog;

const byId = new Map(
  catalog.icons.map((icon) => {
    return [icon.id, icon];
  })
);

export const isKnownIcon = (id: string) => {
  return byId.has(id);
};

export const languageOf = (lang?: string) => {
  const short = (lang ?? 'en').toLowerCase().split('-')[0];
  return catalog.languages.includes(short) ? short : 'en';
};

const fold = (s: string) => {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l');
};

const searchText = (icon: CatalogIcon) => {
  return fold([icon.id, ...Object.values(icon.names)].join(' '));
};

// Icons for a search: every word in the query is tried; icons matching more
// words come first (so "raspberry pi" or "Home Assistant" still find something)
export const findIcons = (opts: { query?: string; category?: string; lang?: string }) => {
  const lang = languageOf(opts.lang);
  const words = opts.query ? fold(opts.query).split(/[\s,/_-]+/).filter((w) => w.length > 1) : [];
  return catalog.icons
    .map((icon) => {
      const text = searchText(icon);
      const tokens = new Set(text.split(/[^\p{L}\p{N}]+/u));
      return {
        icon,
        // Short words ("pi", "db") count only as whole words
        score: words.filter((w) => {
          return w.length <= 2 ? tokens.has(w) : text.includes(w);
        }).length
      };
    })
    .filter(({ icon, score }) => {
      if (opts.category && icon.category !== opts.category) return false;
      return words.length === 0 || score > 0;
    })
    .sort((a, b) => {
      return b.score - a.score;
    })
    .map(({ icon }) => {
      return { id: icon.id, name: icon.names[lang] ?? icon.names.en, category: icon.category };
    });
};

export const categoryList = (lang?: string) => {
  const l = languageOf(lang);
  return catalog.categories.map((c) => {
    return {
      id: c.id,
      name: c[l] ?? c.en,
      count: catalog.icons.filter((i) => {
        return i.category === c.id;
      }).length
    };
  });
};

const distance = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => {
    return [i, ...Array(b.length).fill(0)];
  });
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
};

// Up to three icon ids that look like what was meant by an unknown id: close
// spelling first, then icons sharing a word, then generic ones
export const suggestIcons = (wanted: string): string[] => {
  const w = fold(wanted).replace(/[-_]/g, ' ').trim();
  const scored = catalog.icons.map((icon) => {
    const names = [icon.id.replace(/-/g, ' '), ...Object.values(icon.names).map(fold)];
    const contains = names.some((n) => {
      return n.includes(w) || (w.length > 3 && w.includes(n));
    });
    const best = Math.min(
      ...names.map((n) => {
        return distance(w, n);
      })
    );
    return { id: icon.id, score: contains ? -1 : best };
  });
  const close = scored
    .filter((s) => {
      return s.score <= Math.max(2, Math.floor(w.length / 3));
    })
    .sort((a, b) => {
      return a.score - b.score;
    })
    .map((s) => {
      return s.id;
    });
  const byWord = findIcons({ query: w }).map((i) => {
    return i.id;
  });
  return [...new Set([...close, ...byWord, ...GENERIC_ICONS])].slice(0, 3);
};

// For things with no icon of their own (products, apps)
export const GENERIC_ICONS = ['server', 'vm', 'container'];

// A known icon id for `wanted`: itself, or the closest match
export const resolveIcon = (wanted: string): { icon: string; replaced: boolean } => {
  if (isKnownIcon(wanted)) return { icon: wanted, replaced: false };
  return { icon: suggestIcons(wanted)[0], replaced: true };
};
