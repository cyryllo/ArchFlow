# ArchFlow - Narzędzie do Diagramów Izometrycznych <img width="30" height="30" alt="archflow" src="https://github.com/user-attachments/assets/56d78887-601c-4336-ab87-76f8ee4cde96" />

<p align="center">
 <a href="../README.md">English</a> | <a href="README.pl.md">Polski</a>
</p>

**ArchFlow** jest forkiem <a href="https://github.com/stan-smith/FossFLOW">FossFLOW</a> autorstwa Stana Smitha, które samo jest forkiem/przepisaniem <a href="https://github.com/markmanx/isoflow">Isoflow</a> autorstwa @markmanx — ten projekt stoi na barkach obu tych projektów. Jeśli któryś z nich Ci pomógł, koniecznie je odwiedź i rozważ wsparcie ich twórców.

------------------------------------------------------------------------------------------------------------------------------
ArchFlow to potężna, open-source'owa aplikacja webowa do tworzenia pięknych diagramów izometrycznych. Zbudowana w React i na bibliotece <a href="https://github.com/markmanx/isoflow">Isoflow</a> (sforkowanej i opublikowanej na NPM jako `fossflow`), działa całkowicie w przeglądarce. Dostępna jest też natywna wersja okienkowa (Electron) w `packages/fossflow-desktop`.

![Screenshot_20250630_160954](https://github.com/user-attachments/assets/e7f254ad-625f-4b8a-8efc-5293b5be9d55)

- **📝 [ARCHFLOW_TODO.md](https://github.com/cyryllo/ArchFlow/blob/master/ARCHFLOW_TODO.md)** - Bieżące problemy i plan rozwoju wraz z mapowaniem kodu, większość uwag dotyczy samej biblioteki isoflow.
- **🤝 [CONTRIBUTING.md](https://github.com/cyryllo/ArchFlow/blob/master/CONTRIBUTING.md)** - Jak włączyć się w rozwój projektu.

### Wielojęzyczność
- **2 obsługiwane języki** - Pełne tłumaczenie interfejsu na angielski i polski
- **Selektor języka** - Łatwy w użyciu przełącznik języka w nagłówku aplikacji
- **Pełne tłumaczenie** - Wszystkie menu, okna dialogowe, ustawienia, podpowiedzi i pomoc przetłumaczone
- **Zapamiętywanie wyboru** - Aplikacja automatycznie wykrywa i zapamiętuje preferowany język

### Ulepszone narzędzie do łączenia
- **Tworzenie kliknięciem** - Nowy domyślny tryb: kliknij pierwszy węzeł, potem drugi, aby je połączyć
- **Tryb przeciągania** - Oryginalny tryb "przeciągnij i upuść" nadal dostępny w ustawieniach
- **Wybór trybu** - Przełączaj między trybem kliknięcia a przeciągania w Ustawienia → zakładka Połączenia
- **Większa niezawodność** - Tryb kliknięcia daje bardziej przewidywalne tworzenie połączeń

## 🐳 Szybkie wdrożenie z Dockerem

```bash
# Docker Compose (zalecane - z trwałym zapisem danych)
docker compose up

# Albo zbuduj i uruchom obraz lokalnie
docker build -t archflow:local .
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams archflow:local
```

Zapis po stronie serwera jest domyślnie włączony w Dockerze. Diagramy są zapisywane jako pliki JSON w `./diagrams` na hoście (montowane jako `/data/diagrams` w kontenerze). Gdy to działa, aplikacja wykrywa to automatycznie i przełącza się na trwałą listę diagramów "Dysk aplikacji" — przyciski Zapisz/Wczytaj/Szybki zapis (sesja) znikają, bo nie są już potrzebne.

Aby wyłączyć zapis po stronie serwera i wrócić do zapisu tylko w przeglądarce (sesja), ustaw `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false archflow:local
```

## 🖥️ Aplikacja okienkowa (Electron)

Dostępna jest też natywna wersja okienkowa dla Windows, macOS i Linuksa — opakowuje tę samą aplikację webową w natywne okno, z natywnymi oknami dialogowymi "Zapisz jako"/"Otwórz" zamiast pobierania plików przez przeglądarkę.

```bash
# Uruchom w trybie dev (otwiera natywne okno)
npm run dev:desktop

# Zbuduj instalatory (Windows .exe, macOS .dmg, Linux AppImage/.deb)
npm run build:desktop
```

Instalatory trafiają do `packages/fossflow-desktop/dist/`. Oba polecenia same budują najpierw bibliotekę i aplikację webową, więc nie trzeba robić tego osobno.

Diagramy są zapisywane jako prawdziwe pliki na dysku, automatycznie — bez pytania o lokalizację, bez pamięci przeglądarki. Aplikacja desktopowa przy pierwszym uruchomieniu tworzy katalog `ArchFlow` w katalogu Dokumentów systemu (`~/Documents/ArchFlow`, a na spolszczonym systemie `~/Dokumenty/ArchFlow`), i każdy diagram zapisany przez listę "📁 Dysk aplikacji" trafia tam jako plik `.json`. Tak samo jak w Dockerze, przyciski Zapisz/Wczytaj/Szybki zapis (sesja) są ukryte w aplikacji desktopowej, bo zawsze dostępny jest trwały zapis.

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

## Jak korzystać

### Tworzenie diagramów

1. **Dodawanie elementów**:
   - Naciśnij przycisk "+" w górnym prawym menu, po lewej pojawi się biblioteka komponentów
   - Przeciągnij i upuść komponenty z biblioteki na płótno
   - Albo kliknij prawym przyciskiem na siatce i wybierz "Dodaj węzeł"

2. **Łączenie elementów**:
   - Wybierz narzędzie Łącznik (naciśnij 'C' lub kliknij ikonę łącznika)
   - **Tryb kliknięcia** (domyślny): kliknij pierwszy węzeł, potem drugi
   - **Tryb przeciągania** (opcjonalny): kliknij i przeciągnij od pierwszego do drugiego węzła
   - Przełączaj tryby w Ustawienia → zakładka Połączenia

3. **Zapisywanie pracy**:
   - **🌐/📁 Dysk aplikacji** (Docker z włączonym zapisem serwerowym, albo aplikacja desktopowa) - trwałe, nazwane diagramy, które można wylistować, wczytać i usunąć; zapisywane jako prawdziwe pliki (`./diagrams` na hoście w Dockerze, `~/Documents/ArchFlow` na desktopie)
   - **Zapisz / Wczytaj / Szybki zapis (Sesja)** - pokazuje się tylko gdy nie ma trwałego zapisu (zwykły hosting webowy, albo Docker z wyłączonym zapisem serwerowym); zapisuje tylko w pamięci przeglądarki
   - **Eksport** - pobierz bieżący diagram jako plik JSON, zawsze dostępne niezależnie od platformy
   - **Import** - wczytaj diagram z pliku JSON, zawsze dostępne

### Opcje przechowywania

To, co widzisz, zależy od tego, gdzie działa ArchFlow:

| Gdzie | Co dostajesz |
|---|---|
| Aplikacja desktopowa | **📁 Dysk aplikacji** (pliki w `~/Documents/ArchFlow`) + Eksport/Import. Brak przycisków sesji. |
| Docker z włączonym zapisem serwerowym (domyślnie) | **📁 Dysk aplikacji** (pliki w `./diagrams` na hoście) + Eksport/Import. Brak przycisków sesji. |
| Zwykły hosting webowy / Docker z wyłączonym zapisem serwerowym | Zapisz/Wczytaj/Szybki zapis (tylko pamięć przeglądarki, znika po wyczyszczeniu danych przeglądarki) + Eksport/Import |

- **Autozapis**: ostatnio otwarty diagram jest automatycznie przywracany po odświeżeniu/ponownym uruchomieniu (`localStorage` przeglądarki / profil aplikacji desktopowej), niezależnie od tego, z której opcji przechowywania powyżej korzystasz.

## Współtworzenie

Chętnie przyjmiemy Twój wkład! Zobacz [CONTRIBUTING.md](https://github.com/cyryllo/ArchFlow/blob/master/CONTRIBUTING.md), by poznać zasady.

## Dokumentacja

- [ARCHFLOW_ENCYCLOPEDIA.md](https://github.com/cyryllo/ArchFlow/blob/master/ARCHFLOW_ENCYCLOPEDIA.md) - Obszerny przewodnik po kodzie projektu
- [ARCHFLOW_TODO.md](https://github.com/cyryllo/ArchFlow/blob/master/ARCHFLOW_TODO.md) - Bieżące problemy i plan rozwoju
- [CONTRIBUTING.md](https://github.com/cyryllo/ArchFlow/blob/master/CONTRIBUTING.md) - Zasady współtworzenia

## Licencja

MIT
