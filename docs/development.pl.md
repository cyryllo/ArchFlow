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
