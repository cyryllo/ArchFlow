# ArchFlow — brand assets

Wariant „Przepływ / węzły": dwa izometryczne bloki połączone linią przepływu.

## Pliki
| Plik | Zastosowanie |
|------|--------------|
| `logo.svg` | Logo poziome (glif + napis) — na jasnym tle |
| `logo-dark.svg` | Logo na ciemnym tle (napis jasny) |
| `logo-mono.svg` | Logo jednokolorowe (druk, znak wodny) |
| `icon.svg` | Sam glif (kolor) — ikona aplikacji |
| `icon-mono.svg` | Glif jednokolorowy |
| `favicon.svg` | Favikona wektorowa (nowoczesne przeglądarki) |
| `favicon.ico` | Favikona 16/32/48 px (klasyczna) |
| `icon-16..512.png` | Rastrowe ikony (PWA, Electron, sklepy) |
| `logo.png` | Logo poziome PNG (3×, przezroczyste) |

Napisy zamienione na krzywe — brak zależności od fontu (Space Grotesk 700).

## Kolory
| Rola | HEX |
|------|-----|
| Teal 300 (góra) | `#5EEAD4` |
| Teal 500 | `#14B8A6` |
| Teal 600 (napis/lewa) | `#0D9488` |
| Flow / akcent | `#E67E22` |
| Ink / tekst | `#1E293B` |

## HTML (favikona + PWA)
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-256.png">
```

## Dodatkowe zasoby
| Plik | Zastosowanie |
|------|--------------|
| `icon-tile-light.svg` / `-512/-256.png` | Ikona z kafelkiem, jasne tło (desktop/PWA) |
| `icon-tile-dark.svg` / `-512/-256.png` | Ikona z kafelkiem, ciemne tło |
| `og-cover.svg` / `og-cover.png` | Grafika Open Graph 1200×630 (linki, README) |
| `README-header.md` | Gotowy nagłówek README (logo + tagline, jasny/ciemny) |

Kafelki mają margines ~19% (bezpieczna strefa maskable) — nadają się na ikony PWA.

### Open Graph w `<head>`
```html
<meta property="og:image" content="https://archflow.example/og-cover.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

### Umiejscowienie w repo
Zalecane: pliki marki w `docs/brand/`, favikony/ikony w `packages/fossflow-app/public/`.
Snippet z `README-header.md` zakłada `docs/brand/logo.svg` + `logo-dark.svg`.
