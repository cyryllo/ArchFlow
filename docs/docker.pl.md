# ArchFlow w Dockerze

<p>
 <a href="docker.md">English</a> | <b>Polski</b>
</p>

Gotowy obraz jest publikowany w GitHub Container Registry po każdym udanym buildzie gałęzi `master`:

```
ghcr.io/cyryllo/archflow
```

| Tag | Znaczenie |
|---|---|
| `latest` | Najnowszy build gałęzi `master` |
| `0.6.1` (dowolna wersja) | Konkretna wersja ArchFlow, z `package.json` |
| `sha-abc1234` | Konkretny commit |

Na razie obraz jest budowany tylko dla `linux/amd64`.

We wszystkich przykładach poniżej ArchFlow działa na porcie **9500**. Porty takie jak 80 czy 8080 są często zajęte przez inne usługi, więc 9500 jest bezpieczniejszym wyborem. Możesz go zmienić, patrz [Zmiana portu](#zmiana-portu).

## Opcja 1: Docker Compose (zalecane)

Nie trzeba klonować repozytorium, wystarczy sam plik compose.

```bash
# 1. Utwórz katalog na ArchFlow i pobierz plik compose
mkdir archflow && cd archflow
curl -O https://raw.githubusercontent.com/cyryllo/ArchFlow/master/compose.yml

# 2. Pobierz obraz i uruchom kontener w tle
docker compose pull
docker compose up -d
```

Otwórz **http://localhost:9500** w przeglądarce. Diagramy są zapisywane jako pliki JSON w `./diagrams`, obok `compose.yml`.

Codzienne komendy (uruchamiane z tego samego katalogu):

```bash
docker compose ps                   # czy działa?
docker compose logs -f              # podgląd logów
docker compose stop                 # zatrzymanie (kontener zostaje)
docker compose start                # ponowne uruchomienie
docker compose down                 # zatrzymanie i usunięcie kontenera (diagramy zostają w ./diagrams)
docker compose pull && docker compose up -d   # aktualizacja do najnowszego obrazu
```

Aby przypiąć konkretną wersję zamiast `latest`, ustaw `ARCHFLOW_VERSION`, w linii komendy albo w pliku `.env` obok `compose.yml`:

```bash
ARCHFLOW_VERSION=0.6.1 docker compose up -d
```

## Opcja 2: `docker run`

```bash
docker run -d --name archflow \
  -p 9500:80 \
  -v "$(pwd)/diagrams:/data/diagrams" \
  --restart unless-stopped \
  ghcr.io/cyryllo/archflow:latest
```

Codzienne komendy:

```bash
docker ps                        # czy działa?
docker logs -f archflow          # podgląd logów
docker stop archflow             # zatrzymanie kontenera
docker start archflow            # ponowne uruchomienie
docker rm -f archflow            # usunięcie kontenera (diagramy zostają w ./diagrams)
```

Aktualizacja: `docker pull ghcr.io/cyryllo/archflow:latest`, potem `docker rm -f archflow` i ponownie komenda powyżej. Diagramy zostają w `./diagrams`.

Jeśli wolisz nazwany wolumen Dockera zamiast katalogu na hoście, użyj `-v archflow-diagrams:/data/diagrams`. Wolumen przetrwa `docker rm`. Podgląd i usuwanie:

```bash
docker volume ls                                                          # lista wolumenów
docker run --rm -v archflow-diagrams:/data alpine ls -la /data            # zawartość wolumenu
docker volume rm archflow-diagrams                                        # usunięcie wolumenu razem z diagramami
```

## Opcja 3: Budowanie ze źródeł

Jeśli masz sklonowane repozytorium, możesz zbudować obraz samodzielnie zamiast go pobierać:

```bash
docker compose up -d --build                     # zbuduj z lokalnych źródeł i uruchom
docker compose -f compose.dev.yml up --build     # wariant deweloperski: porty 3000 (aplikacja) i 3001 (API)
```

## Zmiana portu

Port to liczba **przed** dwukropkiem w mapowaniu portów (`HOST:KONTENER`). W kontenerze ArchFlow zawsze nasłuchuje na `80`, zmieniasz tylko stronę hosta.

- **Compose:** zmień linię `ports` w `compose.yml`, np. na `- "9600:80"`, i uruchom `docker compose up -d`.
- **`docker run`:** zmień `-p 9500:80` np. na `-p 9600:80`.

Sprawdzenie, czy port jest wolny (Linux): `ss -ltn | grep :9500` (brak wyniku oznacza, że jest wolny).

## Jak działa kontener

Warto wiedzieć, zanim uruchomisz go na serwerze:

- **Jeden kontener, dwa procesy.** nginx serwuje aplikację na porcie `80` w kontenerze, a mały backend w Node.js (port `3001`) zapisuje diagramy. nginx przekazuje zapytania `/api/...` do backendu, więc wystarczy wystawić port 80 (zmapowany na 9500 na hoście). Portu 3001 nie wystawiaj.
- **Gdzie są diagramy.** Backend zapisuje każdy diagram jako plik JSON w `/data/diagrams` w kontenerze. Obraz nie deklaruje wolumenu, więc **jeśli nic tam nie zamontujesz, diagramy są tylko wewnątrz kontenera**. Przetrwają `stop`/`start`/restart, ale **znikną po `docker rm`, `docker compose down` albo przy aktualizacji do nowego obrazu**. Zawsze montuj katalog albo nazwany wolumen (przykłady powyżej to robią).
- **Katalog na hoście czy nazwany wolumen.**
  - Katalog na hoście (`./diagrams:/data/diagrams`): pliki widać bezpośrednio na dysku, łatwo je skopiować i zrobić kopię zapasową. Jeśli katalog nie istnieje, Docker sam go utworzy przy pierwszym starcie.
  - Nazwany wolumen (`archflow-diagrams:/data/diagrams`): miejscem zarządza Docker (na Linuksie w `/var/lib/docker/volumes/`). Nie widać go jako zwykłego katalogu, ale nie ma problemu z uprawnieniami opisanego niżej.
- **Właściciel plików (Linux).** Kontener działa jako `root`, więc katalog `./diagrams` i pliki JSON w nim należą na hoście do `root`. Aby je ręcznie edytować, przenosić czy usuwać, użyj `sudo` albo przejmij je: `sudo chown -R $USER: diagrams`. ArchFlow dalej będzie działał.
- **Działa bez internetu.** Wszystko, czego potrzebuje aplikacja, jest w obrazie, więc kontener startuje w kilka sekund i nie potrzebuje internetu, poza samym pobraniem obrazu.
- **Restarty.** Oba przykłady używają `restart: unless-stopped`: kontener wstaje sam po awarii albo po restarcie maszyny, chyba że sam go zatrzymasz.
- **Brak logowania.** ArchFlow nie ma kont użytkowników. Każdy, kto otworzy adres, może przeglądać, zmieniać i usuwać diagramy w Dysku aplikacji. Uruchamiaj go w zaufanej sieci albo za reverse proxy z uwierzytelnianiem (np. basic auth), jeśli ma być dostępny z internetu.
- **Kopie zapasowe.** Wszystko, co zapisuje ArchFlow, jest w `/data/diagrams` (czyli w katalogu `./diagrams`), więc wystarczy kopia tego katalogu.

## Konfiguracja

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `ARCHFLOW_VERSION` | `latest` | Tag obrazu używany przez `compose.yml`. |
| `ENABLE_SERVER_STORAGE` | `true` | Zapis diagramów jako plików na serwerze (Moje diagramy). `false` przełącza na zapis tylko w przeglądarce (sesja). |
| `STORAGE_PATH` | `/data/diagrams` | Gdzie w kontenerze zapisywane są diagramy. Tu montuj katalog z hosta albo wolumen. |
| `MCP_TOKEN` | *(puste)* | Włącza serwer MCP dla asystentów AI pod `/mcp`. Klienci wysyłają go jako `Authorization: Bearer <token>`. Zobacz [Asystenci AI (MCP)](mcp.pl.md#mcp-w-dockerze-przez-http). |

Aby wyłączyć zapis serwerowy i wrócić do zapisu tylko w przeglądarce (sesja), ustaw `ENABLE_SERVER_STORAGE=false`:
```bash
ENABLE_SERVER_STORAGE=false docker compose up -d
# albo
docker run -d -p 9500:80 -e ENABLE_SERVER_STORAGE=false ghcr.io/cyryllo/archflow:latest
```

Co wtedy zmienia się w aplikacji, opisuje sekcja [Zapisywanie i otwieranie diagramów](saving.pl.md).

---

[← Powrót do README](README.pl.md)
