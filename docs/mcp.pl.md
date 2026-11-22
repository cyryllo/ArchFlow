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

Na komputerze, na którym działa asystent, potrzebny jest [Node.js](https://nodejs.org/) w wersji 18 lub nowszej.

## 1. Wybierz, gdzie trafią diagramy

Serwer MCP zapisuje diagramy tam, skąd czyta je ArchFlow:

| Korzystasz z ArchFlow… | Ustawienie | Diagramy znajdziesz w |
|---|---|---|
| w **Dockerze** na swoim serwerze | `ARCHFLOW_URL=http://twoj-serwer:9500` | *Moje diagramy* w przeglądarce |
| w **aplikacji desktopowej** | nic (domyślnie) | *Moje diagramy* w aplikacji (`Dokumenty/ArchFlow`) |
| z plikami w **innym folderze** | `ARCHFLOW_DIR=/ścieżka/do/folderu` | ☰ → *Otwórz z pliku (JSON)* |

Podaj adres, pod którym otwierasz ArchFlow w przeglądarce, np. `http://localhost:9500` (ArchFlow uruchomiony z `compose.yml`) albo `http://localhost:3000` (deweloperski `compose.dev.yml`). Zapis na serwerze musi być włączony; w obrazie Dockera jest włączony domyślnie.

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
- **Wkrótce:** serwer MCP wbudowany w obraz Dockera (przez HTTP), żeby nie musiał działać na Twoim komputerze.

## Rozwiązywanie problemów

| Co widzisz | Co zrobić |
|---|---|
| Asystent nie ma narzędzi ArchFlow albo `/mcp` pokazuje *Connection closed* | Otwórz nową rozmowę. W `/mcp` wybierz *archflow* → *Reconnect*. Sprawdź, czy polecenie kończy się na `archflow-mcp@latest`. Wewnątrz sklonowanego repozytorium ArchFlow samo `archflow-mcp` trafia na lokalną, niezbudowaną paczkę i kończy się błędem `archflow-mcp: not found`. |
| Nie wiesz, czy serwer w ogóle startuje | Uruchom w terminalu `npx -y archflow-mcp@latest --version`. Powinien wypisać numer wersji; jeśli nie, zainstaluj albo zaktualizuj Node.js (18+). |
| *Can't reach ArchFlow at …* | Sprawdź adres: otwórz go w przeglądarce. `curl http://localhost:9500/api/storage/status` powinien odpowiedzieć `{"enabled":true,…}`. ArchFlow z `compose.yml` słucha na porcie 9500, wersja deweloperska (`compose.dev.yml`) na 3000. |
| *Server storage is turned off* | Ustaw `ENABLE_SERVER_STORAGE=true` dla kontenera (w obrazie to wartość domyślna). |
| Diagramu nie ma w *Moich diagramach* | Zamknij *Moje diagramy* i otwórz ponownie. Upewnij się, że patrzysz na ten ArchFlow, do którego zapisuje serwer: ten sam adres albo aplikację desktopową, gdy nie ma `ARCHFLOW_URL`. |
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
