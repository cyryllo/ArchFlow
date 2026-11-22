# Dla programistów

<p>
 <a href="development.md">English</a> | <b>Polski</b>
</p>

## Szybki start (lokalny development)

```bash
# Sklonuj repozytorium
git clone https://github.com/cyryllo/ArchFlow
cd ArchFlow

# Zainstaluj zależności
npm install

# Zbuduj bibliotekę (wymagane przy pierwszym uruchomieniu)
npm run build:lib

# Uruchom serwer deweloperski
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

## Struktura monorepo

To monorepo zawierające kilka pakietów:

- `packages/fossflow-lib` - biblioteka komponentów React do rysowania diagramów sieciowych (budowana Webpackiem)
- `packages/fossflow-app` - Progressive Web App opakowująca bibliotekę i prezentująca ją użytkownikowi (budowana RSBuildem)
- `packages/fossflow-backend` - opcjonalny serwer do trwałego zapisu diagramów
- `packages/fossflow-desktop` - natywna aplikacja okienkowa (Electron)

### Polecenia deweloperskie

```bash
# Development
npm run dev          # Uruchom serwer deweloperski aplikacji
npm run dev:lib      # Tryb watch dla rozwoju biblioteki
npm run dev:desktop  # Uruchom wersję okienkową (Electron) w trybie dev

# Budowanie
npm run build        # Zbuduj bibliotekę i aplikację
npm run build:lib    # Zbuduj tylko bibliotekę
npm run build:app    # Zbuduj tylko aplikację
npm run build:desktop # Zbuduj instalator aplikacji okienkowej

# Testy i lint
npm test             # Uruchom testy jednostkowe
npm run lint         # Sprawdź błędy lintera

# Testy E2E (Selenium)
cd e2e-tests
./run-tests.sh       # Uruchom testy end-to-end (wymaga Dockera i Pythona)

# Publikacja
npm run publish:lib  # Opublikuj bibliotekę na npm
```

## 🤖 Serwer MCP (`packages/archflow-mcp`)

Serwer MCP dla asystentów AI jest publikowany na npm jako [`archflow-mcp`](https://www.npmjs.com/package/archflow-mcp). Instrukcja dla użytkowników to [mcp.pl.md](mcp.pl.md).

```bash
npm run build --workspace=packages/archflow-mcp   # katalog ikon + TypeScript -> dist/
npm test --workspace=packages/archflow-mcp        # buduje i uruchamia testy
```

- W `src/server.ts` są narzędzia i instrukcja dla modelu, `src/builder.ts` buduje i zmienia diagramy, a `src/layout.ts` rozmieszcza je na siatce izometrycznej. `src/storage.ts` zapisuje przez API Dockera albo do folderu, a `src/validate.ts` odwzorowuje schematy z fossflow-lib.
- `src/catalog.json` (identyfikatory ikon, kategorie, nazwy we wszystkich językach) generuje `scripts/build-catalog.mjs` z zestawu ikon aplikacji. Każde budowanie odtwarza ten plik, więc nowe ikony i tłumaczenia trafiają do serwera MCP same.
- Testy korzystają z prawdziwego klienta MCP i zapisują też przez prawdziwy backend (`packages/fossflow-backend`). `test/fixtures/shop-diagram.json` to przykładowy diagram; test `mcpDiagram.test.ts` w fossflow-lib sprawdza go schematem `modelSchema` z edytora. Gdy wynik zmienia się celowo, odśwież go przez `UPDATE_FIXTURES=1 node --test test/*.test.mjs` (po zbudowaniu).
- Żeby wypróbować lokalną wersję w Claude Code, zamiast `npx` wskaż `node /pełna/ścieżka/do/packages/archflow-mcp/dist/index.js`.

**Wydawanie.** Wersja paczki idzie razem z aplikacją (zmienia ją też `scripts/update-version.js`). Tag wersji uruchamia `.github/workflows/npm.yml`, który testuje paczkę i publikuje ją przez **Trusted Publishing** w npm, więc nigdzie nie jest zapisany token npm. Wersja, która już jest na npm, zostaje pominięta. Zaufany wydawca jest ustawiony na npmjs.com → archflow-mcp → Settings: repozytorium `cyryllo/ArchFlow`, workflow `npm.yml`, z dozwolonym *npm publish*. Jeśli npm pokaże go kiedyś jako wygasłego albo niezweryfikowanego, usuń go i dodaj ponownie z tymi samymi danymi przed kolejnym tagiem.

## 🖥️ Budowanie aplikacji desktopowej

Aplikacja desktopowa (Electron) to ten sam edytor we własnym oknie. **Pobierz ją z [ostatniego wydania](https://github.com/cyryllo/ArchFlow/releases/latest)**: AppImage albo `.deb` dla Linuksa, instalator dla Windows (zobacz [Pobierz](README.pl.md#️-pobierz)).

Diagramy zapisują się jako zwykłe pliki na dysku, automatycznie — bez pytania o lokalizację i bez pamięci przeglądarki. Przy pierwszym uruchomieniu aplikacja tworzy folder `ArchFlow` w katalogu Dokumenty (`~/Dokumenty/ArchFlow` na polskim systemie, `~/Documents/ArchFlow` na angielskim), a każdy diagram zapisany przez **Zapisz** / **Moje diagramy** staje się tam plikiem `.json`. Eksport korzysta z systemowych okien „Zapisz jako”.

Budowanie samodzielne:

```bash
npm run dev:desktop     # uruchomienie w trybie deweloperskim (otwiera okno)
npm run build:desktop   # paczki dla Twojego systemu w packages/fossflow-desktop/dist/
```

Na Linuksie powstaje AppImage i `.deb`. Instalator Windows buduje się na Windows (na Linuksie wymagałby wine); workflow `Desktop builds` na GitHubie buduje wszystkie paczki przy każdym tagu wersji i dołącza je do wydania.

---

[← Powrót do README](README.pl.md)
