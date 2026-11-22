# Asystenci AI (MCP)

<p align="right">
 <a href="mcp.md">English</a> | <b>Polski</b>
</p>

ArchFlow ma **serwer MCP** o nazwie `archflow-mcp`. Dzięki niemu asystenci AI, np. Claude Desktop, Claude Code albo każdy program obsługujący Model Context Protocol, rysują dla Ciebie diagramy ArchFlow. Opisz zwykłymi słowami, czego potrzebujesz, np. *„narysuj architekturę naszego sklepu: przeglądarka, load balancer, dwa serwery aplikacji, PostgreSQL z repliką”*. Asystent zbuduje diagram i go zapisze, a Ty otworzysz go w ArchFlow jak każdy inny.

Asystent potrafi:

- tworzyć całe diagramy z węzłami, kolorowymi strefami, połączeniami z etykietami i tekstami;
- zmieniać istniejące: dodawać i usuwać węzły i połączenia, zmieniać nazwy i ikony, dodawać strefy;
- czytać Twoje diagramy i odpowiadać na pytania o nie;
- szukać ikon po nazwie w każdym z języków ArchFlow.

Niczego nie trzeba ustawiać ręcznie: serwer ArchFlow sam rozmieszcza węzły na siatce izometrycznej. Strefy układa od lewej do prawej, jak warstwy architektury. Potem możesz wszystko poprzesuwać w ArchFlow jak zwykle.

Serwer można uruchomić na dwa sposoby:

- **Na Twoim komputerze** (kroki 1–4 poniżej). Asystent sam uruchamia serwer. Potrzebny jest [Node.js](https://nodejs.org/) w wersji 18 lub nowszej. Działa z aplikacją desktopową, folderem z plikami i ArchFlow w Dockerze.
- **W obrazie Dockera** ([MCP w Dockerze](#mcp-w-dockerze-przez-http)). Włączasz go jednym ustawieniem na serwerze, a asystenci łączą się przez HTTP z tokenem. Na swoim komputerze niczego nie instalujesz. Działa z asystentami obsługującymi zdalne serwery MCP, np. Claude Code.

Działa też z lokalnymi modelami, np. przez Ollamę: zobacz [Lokalne modele](#lokalne-modele-ollama-i-inne).

## 1. Wybierz, gdzie trafią diagramy

Serwer MCP zapisuje diagramy tam, skąd czyta je ArchFlow:

| Korzystasz z ArchFlow… | Ustawienie | Diagramy znajdziesz w |
|---|---|---|
| w **Dockerze** na swoim serwerze | `ARCHFLOW_URL=http://twoj-serwer:9500` | *Moje diagramy* w przeglądarce |
| w **aplikacji desktopowej** | nic (domyślnie) | *Moje diagramy* w aplikacji (`Dokumenty/ArchFlow`) |
| z plikami w **innym folderze** | `ARCHFLOW_DIR=/ścieżka/do/folderu` | ☰ → *Otwórz z pliku (JSON)* |

Podaj adres, pod którym otwierasz ArchFlow w przeglądarce, np. `http://localhost:9500` (ArchFlow uruchomiony z `compose.yml`) albo `http://localhost:3000` (deweloperski `compose.dev.yml`). Zapis na serwerze musi być włączony; w obrazie Dockera jest włączony domyślnie. Jeśli Twój ArchFlow ma logowanie (domyślny `compose.yml` od wersji 0.9.0), ustaw też `ARCHFLOW_TOKEN` na swój osobisty token z *Konta* (zobacz [Z logowaniem](#z-logowaniem-domyślnie-od-wersji-090)).

## 2. Dodaj go do asystenta

### Claude Code

Jedno polecenie w terminalu. Dla Dockera dodaj `-e ARCHFLOW_URL=…`:

~~~bash
claude mcp add archflow --scope user -e ARCHFLOW_URL=http://localhost:9500 -- npx -y archflow-mcp@latest
~~~

Dla folderu aplikacji desktopowej pomiń część `-e`. Dzięki `--scope user` ArchFlow będzie dostępny we wszystkich Twoich projektach. Sprawdzisz to poleceniem `claude mcp list`.

Dzięki `@latest` npx zawsze bierze najnowszą wersję z npm. Działa to też wewnątrz sklonowanego repozytorium ArchFlow; samo `archflow-mcp` tam nie działa (zobacz [Rozwiązywanie problemów](#rozwiązywanie-problemów)).

#### Claude Code w VS Code (zainstalowane tylko rozszerzenie)

Jeśli terminal odpowiada `claude: command not found`, masz tylko rozszerzenie do VS Code. Zawiera ono ten sam program, więc wywołaj go pełną ścieżką:

~~~bash
$(ls -d ~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude | tail -1) \
  mcp add archflow --scope user -e ARCHFLOW_URL=http://localhost:9500 -- npx -y archflow-mcp@latest
~~~

W Windows rozszerzenie leży w `%USERPROFILE%\.vscode\extensions\anthropic.claude-code-…\resources\native-binary\claude.exe`. Możesz też [zainstalować polecenie `claude`](https://docs.anthropic.com/en/docs/claude-code/setup). Korzysta z tych samych ustawień co rozszerzenie.

Inny sposób, tylko dla jednego projektu: plik `.mcp.json` w folderze projektu. Claude Code za pierwszym razem poprosi o jego zatwierdzenie:

~~~json
{
  "mcpServers": {
    "archflow": {
      "command": "npx",
      "args": ["-y", "archflow-mcp@latest"],
      "env": { "ARCHFLOW_URL": "http://localhost:9500" }
    }
  }
}
~~~

#### Potem otwórz nową rozmowę

Serwery MCP startują razem z rozmową, więc narzędzia ArchFlow pojawią się w **następnej**. Wpisz `/mcp` w Claude Code, żeby sprawdzić, czy `archflow` jest połączony; tam też połączysz go ponownie.

### Claude Desktop

1. Otwórz **Settings → Developer → Edit Config**. Otworzy się plik `claude_desktop_config.json`.
2. Dodaj `archflow` do `mcpServers`:

~~~json
{
  "mcpServers": {
    "archflow": {
      "command": "npx",
      "args": ["-y", "archflow-mcp@latest"],
      "env": { "ARCHFLOW_URL": "http://localhost:9500" }
    }
  }
}
~~~

3. Uruchom Claude Desktop ponownie. Narzędzia ArchFlow pojawią się pod ikoną narzędzi (🔨).

Dla folderu aplikacji desktopowej usuń linię `env`.

### Inne programy obsługujące MCP

Uruchom `npx -y archflow-mcp@latest` jako serwer **stdio**, ze zmiennymi z kroku 1 w środowisku. `npx -y archflow-mcp@latest --help` pokazuje dostępne opcje.

## 3. Wypróbuj

Pisz własnymi słowami, w dowolnym języku. Na przykład:

- *„Narysuj diagram sklepu internetowego: klienci (przeglądarka, aplikacja mobilna), wejście (load balancer, brama API), usługi (zamówienia, płatności, kolejka zdarzeń), dane (PostgreSQL, Redis, hurtownia danych). Pod spodem dodaj proces zamówienia: nowe zamówienie, przyjęcie, opłacone?, wysyłka, dostarczone.”*
- *„W diagramie Sklep internetowy dodaj usługę wyszukiwania obok bazy i połącz z nią zamówienia.”*
- *„Które usługi w diagramie Sklep internetowy łączą się z bazą?”*
- *„Zmień nazwę diagramu na Sklep v2 i wyeksportuj go do ~/Pulpit/sklep.json.”*

Asystent napisze, gdzie zapisał diagram. Zwykle najpierw szuka ikon przez `list_icons`, potem buduje cały diagram jednym wywołaniem `build_diagram`, a szczegóły poprawia mniejszymi narzędziami. Za pierwszym razem Claude Code pyta o zgodę na każde narzędzie ArchFlow; wybierz stałą zgodę, jeśli nie chcesz, żeby pytał ponownie.

## 4. Otwórz wynik

- **Docker / aplikacja desktopowa:** otwórz **Moje diagramy** i wczytaj diagram. Jeśli *Moje diagramy* było już otwarte, zamknij je i otwórz ponownie, żeby odświeżyć listę.
- **Folder:** ☰ → **Otwórz z pliku (JSON)**.

> **Nie zmieniaj jednego diagramu w dwóch miejscach naraz.** Każda zmiana asystenta zapisuje się od razu. Jeśli masz ten diagram otwarty w ArchFlow, gdy asystent go zmienia, wczytaj go ponownie z *Moich diagramów*, zanim zaczniesz dalej pracować. Inaczej zapis Twojej otwartej kopii nadpisze zmiany asystenta.

## MCP w Dockerze (przez HTTP)

Obraz Dockera (od wersji 0.8.1) zawiera serwer MCP. Sposób łączenia zależy od tego, czy Twój ArchFlow ma logowanie.

### Z logowaniem (domyślnie od wersji 0.9.0)

Serwer działa zawsze, a **każdy używa własnego tokenu**:

1. W ArchFlow kliknij swoje imię u góry (albo ☰ → *Konto*) i w sekcji *Tokeny dla asystentów AI i API* utwórz token. Wybierz *Odczyt i zmiany* albo *Tylko odczyt* dla asystenta, który ma tylko odpowiadać na pytania.
2. ArchFlow raz pokaże token razem z gotowym poleceniem `claude mcp add …` dla Claude Code. Skopiuj je i uruchom w terminalu.

Asystent działa wtedy z Twoimi uprawnieniami: token czytelnika niczego nie zmieni, a unieważniony token od razu przestaje działać. Jeśli w sekcji tokenów widzisz, że dostęp nie jest włączony, poproś administratora (*Użytkownicy i ustawienia* → *API i MCP*). Więcej w [instrukcji Dockera](docker.pl.md#konta-i-logowanie).

### Bez logowania (`AUTH_MODE=none`): jeden wspólny token

Serwer jest wyłączony, dopóki nie dostanie tokenu.


1. **Wygeneruj token**, czyli długi losowy ciąg znaków:

   ~~~bash
   openssl rand -hex 32
   ~~~

2. **Przekaż go kontenerowi.** W folderze z `compose.yml` dopisz go do `.env` i uruchom kontener ponownie:

   ~~~bash
   echo "MCP_TOKEN=wklej-tu-token" >> .env
   docker compose up -d
   ~~~

   Przy `docker run` dodaj `-e MCP_TOKEN=…`. Serwer MCP zapisuje przez zapis na serwerze ArchFlow, więc `ENABLE_SERVER_STORAGE` musi zostać `true` (tak jest domyślnie).

3. **Sprawdź.** `curl -X POST http://twoj-serwer:9500/mcp` powinien odpowiedzieć *Missing or wrong token*. To znaczy, że serwer działa i czeka na token. *The ArchFlow MCP server is off* oznacza, że kontener nie dostał `MCP_TOKEN`.

4. **Podłącz asystenta.** W Claude Code:

   ~~~bash
   claude mcp add --transport http archflow --scope user http://twoj-serwer:9500/mcp \
     --header "Authorization: Bearer wklej-tu-token"
   ~~~

   Albo dla jednego projektu, w `.mcp.json`:

   ~~~json
   {
     "mcpServers": {
       "archflow": {
         "type": "http",
         "url": "http://twoj-serwer:9500/mcp",
         "headers": { "Authorization": "Bearer wklej-tu-token" }
       }
     }
   }
   ~~~

   Inni asystenci muszą obsługiwać zdalne serwery MCP przez **Streamable HTTP** z własnym nagłówkiem. Plik konfiguracyjny Claude Desktop uruchamia tylko lokalne serwery, więc tam skonfiguruj go jak w kroku 2 wyżej (`npx` z `ARCHFLOW_URL`).

Potem przejdź do [Wypróbuj](#3-wypróbuj). Linki od asystenta używają adresu, pod którym się połączył.

**Trzymaj token w tajemnicy.** Daje pełny dostęp do wszystkich diagramów. Nie dodawaj `.env` do gita. Używaj HTTPS (reverse proxy przed ArchFlow), jeśli łączysz się z serwerem przez internet. Żeby zmienić token, popraw `.env`, uruchom ponownie `docker compose up -d` i zaktualizuj asystenta.

Ten sam serwer HTTP działa też poza Dockerem: `MCP_TOKEN=… npx -y archflow-mcp@latest --http --port 3002`. Domyślnie słucha na `127.0.0.1`, a `--host 0.0.0.0` udostępnia go na wszystkich adresach. `--help` pokazuje wszystkie opcje.

## Lokalne modele (Ollama i inne)

Tak, serwer MCP ArchFlow działa też z modelem na Twoim komputerze. Potrzebny jest program pośrodku. Ollama, LM Studio czy llama.cpp tylko uruchamiają model i nie łączą się z serwerami MCP. Robi to **klient MCP**: przekazuje Twoją prośbę lokalnemu modelowi i wywołuje narzędzia, o które model poprosi.

| Program | Model uruchamia | Dodanie ArchFlow |
|---|---|---|
| [Open WebUI](https://docs.openwebui.com/features/extensibility/mcp) (0.6.31+) | Ollama | *Admin Settings → External Tools → Add Server*, typ **MCP (Streamable HTTP)**, adres `http://twoj-serwer:9500/mcp`, uwierzytelnianie Bearer z Twoim tokenem. Łączy się tylko z [MCP w Dockerze](#mcp-w-dockerze-przez-http). Jeśli sam Open WebUI działa w Dockerze, podaj adres IP serwera, nie `localhost`. |
| [Continue](https://docs.continue.dev/customize/deep-dives/mcp) (VS Code, JetBrains) | Ollama | W trybie **agent**; plik `.continue/mcpServers/archflow.yaml` (poniżej) |
| [Goose](https://block.github.io/goose/) (aplikacja, terminal) | Ollama | Dodaj własne rozszerzenie **wiersza poleceń (stdio)**: polecenie `npx -y archflow-mcp@latest`, zmienna środowiskowa `ARCHFLOW_URL` |
| [MCPHost](https://github.com/mark3labs/mcphost) (terminal) | Ollama | `mcphost --model ollama:<model> --config <plik>`; format pliku w jego README |
| [LM Studio](https://lmstudio.ai/docs/app/mcp) | samo | *Program → Install → Edit mcp.json*, ten sam format co Claude Desktop (krok 2) |

Continue, `.continue/mcpServers/archflow.yaml`:

~~~yaml
name: ArchFlow
version: 0.0.1
schema: v1
mcpServers:
  - name: archflow
    command: npx
    args: ["-y", "archflow-mcp@latest"]
    env:
      ARCHFLOW_URL: http://localhost:9500
~~~

**Wybór modelu**

- Model musi obsługiwać **wywoływanie narzędzi** (tool calling). Ollama oznacza takie modele w swojej bibliotece etykietą *tools*.
- **Większe modele radzą sobie lepiej.** Przykład z homelabem („router, switch, Proxmox z trzema VM, NAS, Raspberry Pi; pogrupuj w strefy”) wypróbowaliśmy na `qwen3:30b-a3b` i `gemma4:26b`. Oba zbudowały poprawny diagram w kilka minut na domowej karcie graficznej; gemma sama poprawiła swój błąd po pierwszej próbie. Modele 7–8B często gubią się w długim opisie `build_diagram`.
- **Daj mu dość kontekstu**, co najmniej 16–32 tysiące tokenów. Opisy narzędzi i lista ikon zajmują kilka tysięcy, a domyślny kontekst Ollamy jest mniejszy. Ustaw `num_ctx` w programie albo uruchom Ollamę z `OLLAMA_CONTEXT_LENGTH=32768 ollama serve`.
- Lokalne modele lubią wymyślać identyfikatory ikon, np. `raspberry-pi`. Serwer zamienia nieznany identyfikator na najbliższą ikonę i mówi modelowi, której użył.

Sam serwer MCP ArchFlow jest przetestowany z Claude Code oraz z lokalnym modelem przez nasz własny klient testowy. Programy z tabeli są wymienione, bo obsługują MCP; ich menu mogą się zmieniać między wersjami.

## Narzędzia

| Narzędzie | Co robi |
|---|---|
| `list_icons` | Szuka ikon po nazwie w dowolnym języku albo wypisuje wszystkie według kategorii |
| `list_diagrams` | Wypisuje Twoje diagramy |
| `get_diagram` | Czyta diagram: węzły, strefy, połączenia, teksty |
| `build_diagram` | Tworzy cały diagram naraz, z automatycznym rozmieszczeniem |
| `add_nodes`, `update_node`, `remove_node` | Dodaje, zmienia albo usuwa węzły |
| `add_connectors`, `remove_connector` | Łączy węzły, z etykietami i stylami linii |
| `add_zone`, `remove_zone` | Kolorowe strefy pod grupami węzłów |
| `add_text` | Tekst na płótnie |
| `rename_diagram` | Zmienia tytuł diagramu |
| `export_json` | Zapisuje diagram do pliku JSON |

Przed każdym zapisem diagram przechodzi takie samo sprawdzenie, jakie robi ArchFlow przy otwieraniu. Błąd, np. ikona, której nie ma, wraca do asystenta z podpowiedzią, a nic zepsutego się nie zapisuje.

## Warto wiedzieć

- **Rozmieszczanie** jest automatyczne, ale proste. Strefy idą w rzędach od lewej do prawej, węzły w strefie tworzą małą siatkę, a strefa może też być jednym wierszem, co pasuje do procesu. Możesz poprosić o dokładne pozycje albo poprzesuwać elementy później w ArchFlow.
- **Docker i dostęp:** serwer MCP korzysta z tego samego API co ArchFlow w przeglądarce. ArchFlow w Dockerze nie ma jeszcze logowania, więc każdy, kto może go otworzyć, może też zmieniać diagramy. Trzymaj go w zaufanej sieci. Logowanie jest w planach.
- **Logowanie** do ArchFlow w Dockerze jest w planach. Serwer MCP też będzie z niego korzystał.

## Rozwiązywanie problemów

| Co widzisz | Co zrobić |
|---|---|
| Asystent nie ma narzędzi ArchFlow albo `/mcp` pokazuje *Connection closed* | Otwórz nową rozmowę. W `/mcp` wybierz *archflow* → *Reconnect*. Sprawdź, czy polecenie kończy się na `archflow-mcp@latest`. Wewnątrz sklonowanego repozytorium ArchFlow samo `archflow-mcp` trafia na lokalną, niezbudowaną paczkę i kończy się błędem `archflow-mcp: not found`. |
| Nie wiesz, czy serwer w ogóle startuje | Uruchom w terminalu `npx -y archflow-mcp@latest --version`. Powinien wypisać numer wersji; jeśli nie, zainstaluj albo zaktualizuj Node.js (18+). |
| *Can't reach ArchFlow at …* | Sprawdź adres: otwórz go w przeglądarce. `curl http://localhost:9500/api/storage/status` powinien odpowiedzieć `{"enabled":true,…}`. ArchFlow z `compose.yml` słucha na porcie 9500, wersja deweloperska (`compose.dev.yml`) na 3000. |
| *Server storage is turned off* | Ustaw `ENABLE_SERVER_STORAGE=true` dla kontenera (w obrazie to wartość domyślna). |
| Diagramu nie ma w *Moich diagramach* | Zamknij *Moje diagramy* i otwórz ponownie. Upewnij się, że patrzysz na ten ArchFlow, do którego zapisuje serwer: ten sam adres albo aplikację desktopową, gdy nie ma `ARCHFLOW_URL`. |
| *The ArchFlow MCP server is off* (z `/mcp` w Dockerze) | Ustaw `MCP_TOKEN` dla kontenera i uruchom go ponownie (`docker compose up -d`). `ENABLE_SERVER_STORAGE` musi być `true`. |
| *Missing or wrong token* | Asystent musi wysyłać `Authorization: Bearer <token>` z dokładnie tym samym tokenem co `MCP_TOKEN` kontenera. |
| *Unknown or revoked token* / *The token has expired* | Z logowaniem: utwórz nowy token w *Koncie* i zaktualizuj asystenta. |
| *API and MCP access is not allowed for this user* | Administrator włącza go w *Użytkownicy i ustawienia* (dla osoby albo dla wszystkich w *Ustawieniach*). |
| *This token is read-only* | Token utworzono jako *Tylko odczyt*. Utwórz nowy z *Odczyt i zmiany*. |
| Asystent pisze pliki albo kod zamiast używać narzędzi | Poproś go, żeby „użył narzędzi archflow”, i sprawdź `/mcp`. |

## Bez MCP

Jeśli Twoje narzędzie AI nie obsługuje MCP, poproś je o plik w kompaktowym formacie ArchFlow i otwórz go przez ☰ → *Otwórz z pliku (JSON)*. Format i wszystkie identyfikatory ikon opisuje [LLM-GENERATION-GUIDE.md](../LLM-GENERATION-GUIDE.md) (po angielsku).

## Uruchomienie z kodu źródłowego

Żeby wypróbować wersję rozwojową albo używać serwera przed wydaniem paczki npm, zbuduj go z klonu repozytorium:

~~~bash
git clone https://github.com/cyryllo/ArchFlow.git
cd ArchFlow
npm install
npm run build --workspace=packages/archflow-mcp
~~~

Potem w krokach powyżej zamiast `npx -y archflow-mcp@latest` użyj `node /pełna/ścieżka/do/ArchFlow/packages/archflow-mcp/dist/index.js`. Testy uruchamia `npm test --workspace=packages/archflow-mcp`.
