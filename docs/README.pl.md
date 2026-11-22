<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/logo-dark.svg">
    <img alt="ArchFlow" src="brand/logo.svg" width="440">
  </picture>
</p>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.pl.md">Polski</a>
</p>

<p align="center">
  <b>Zobacz, jak to wygląda:</b>
  <a href="https://cyryllo.github.io/ArchFlow/app/"><b>▶ Wypróbuj demo online</b></a> (działa w przeglądarce, bez instalacji)
  &nbsp;·&nbsp;
  <a href="https://cyryllo.github.io/ArchFlow/pl/">🌐 Strona projektu</a>
</p>

**ArchFlow** jest forkiem <a href="https://github.com/stan-smith/FossFLOW">FossFLOW</a> autorstwa Stana Smitha, które samo jest forkiem/przepisaniem <a href="https://github.com/markmanx/isoflow">Isoflow</a> autorstwa @markmanx — ten projekt stoi na barkach obu tych projektów. Jeśli któryś z nich Ci pomógł, koniecznie je odwiedź i rozważ wsparcie ich twórców.

------------------------------------------------------------------------------------------------------------------------------
ArchFlow to darmowy edytor open source do czytelnych, ładnych **diagramów izometrycznych**: architektury systemów, sieci, infrastruktury chmurowej i procesów biznesowych. Używaj go w przeglądarce, zainstaluj aplikację na Linuksie lub Windows albo uruchom u siebie jednym poleceniem Dockera.

![Edytor ArchFlow](screenshots/pl-editor.png)

## ✨ Funkcje

- **177 ikon izometrycznych w 9 kategoriach, każda w swoim kolorze**: serwery i komputery, sieć, komunikacja, dane, bezpieczeństwo, ludzie i organizacja, przepływ i procesy, biznes i logistyka, kształty. Możesz też importować własne obrazy jako ikony.
- **Nie tylko infrastruktura:** zdarzenia początkowe i końcowe, decyzje, bramki, dokumenty, akceptacje, czasomierze i kamienie milowe do diagramów procesów.
- **Strefy, połączenia i teksty:** grupuj elementy w kolorowe strefy, łącz je (z punktami pośrednimi, etykietami, stylami linii i strzałkami), dodawaj teksty i opisy.
- **Menu prawego przycisku** na płótnie i na każdym elemencie oraz **menu ☰** z plikami, eksportem i ustawieniami.
- **Zaznaczanie i przesuwanie razem:** ramka zaznaczenia, Shift+klik, potem przeciągnięcie albo strzałki. Połączenia zachowują kształt.
- **Skróty klawiszowe** do kopiowania, wycinania, wklejania, duplikowania, zaznaczania wszystkiego, usuwania, zoomu, dopasowania, zmiany nazwy i wszystkich narzędzi (lista pod F1).
- **Eksport** do przenośnego pliku JSON (ze wszystkimi ikonami) albo obrazu PNG z wyborem rozdzielczości, tła i przycięcia.
- **Zapis tam, gdzie wolisz:** pliki na komputerze, wspólna lista na serwerze w Dockerze albo folder `Dokumenty/ArchFlow` aplikacji desktopowej.
- **Interfejs w 10 językach**: polskim, angielskim, niemieckim, francuskim, hiszpańskim, włoskim, portugalskim (Brazylia), czeskim, niderlandzkim i ukraińskim, łącznie z nazwami ikon.
- **Konta na Twoim serwerze (Docker):** logowanie z rolami administratora, edytora i czytelnika, panel administratora, opcjonalny dostęp publiczny bez zapisu na serwer i osobiste tokeny dla asystentów AI.
- **Asystenci AI (MCP):** Claude i inni asystenci obsługujący MCP narysują i zmienią diagram na podstawie zwykłego opisu. Zobacz [Asystenci AI](mcp.pl.md).

## ⬇️ Pobierz

Gotowe wersje desktopowe są dołączone do każdego [wydania](https://github.com/cyryllo/ArchFlow/releases/latest):

| Plik | Dla |
|---|---|
| `ArchFlow-X.Y.Z-x86_64.AppImage` | Linux, dowolna dystrybucja |
| `ArchFlow-X.Y.Z-amd64.deb` | Debian / Ubuntu |
| `ArchFlow-Setup-X.Y.Z.exe` | Windows (instalator) |

```bash
# Linux AppImage
chmod +x ArchFlow-*-x86_64.AppImage
./ArchFlow-*-x86_64.AppImage
```

Instalator Windows nie jest jeszcze podpisany certyfikatem, więc SmartScreen może pokazać ostrzeżenie przy pierwszym uruchomieniu: kliknij **Więcej informacji → Uruchom mimo to**. Wolisz przeglądarkę? [Wypróbuj demo online](https://cyryllo.github.io/ArchFlow/app/) albo [uruchom w Dockerze](#-uruchom-w-dockerze).

## 🐳 Uruchom w Dockerze

```bash
mkdir archflow && cd archflow
curl -O https://raw.githubusercontent.com/cyryllo/ArchFlow/master/compose.yml
docker compose pull
docker compose up -d      # potem otwórz http://localhost:9500
```

Diagramy zapisują się jako pliki JSON w `./diagrams`. Porty, `docker run`, konfiguracja, kopie zapasowe i działanie kontenera: **[instrukcja Dockera](docker.pl.md)**.

## 📚 Dokumentacja

| | |
|---|---|
| 🚀 [Szybki start](quick-start.pl.md) | Pierwszy diagram w dziesięciu krokach, ze zrzutami ekranu |
| 📖 [Instrukcja obsługi](manual.pl.md) | Wszystko po kolei: węzły, strefy, połączenia, teksty, zaznaczanie, menu, eksport, ustawienia, wszystkie skróty, problemy |
| 💾 [Zapisywanie i otwieranie](saving.pl.md) | Pliki, Moje diagramy, eksport do JSON i PNG, tryb tylko w przeglądarce |
| 🐳 [Instrukcja Dockera](docker.pl.md) | Instalacja i uruchomienie ArchFlow na serwerze |
| 🤖 [Asystenci AI (MCP)](mcp.pl.md) | Claude i inni asystenci AI rysują diagramy za Ciebie |
| 🛠️ [Dla programistów](development.pl.md) | Uruchamianie ze źródeł, struktura projektu, budowanie aplikacji desktopowej |
| 📝 [ARCHFLOW_TODO.md](../ARCHFLOW_TODO.md) | Znane problemy i plan rozwoju |

## 🤝 Współtworzenie

Chętnie przyjmujemy wkład w projekt! Zobacz [CONTRIBUTING.md](../CONTRIBUTING.md) i [Dla programistów](development.pl.md).

## Licencja

MIT
