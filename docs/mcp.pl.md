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

Podaj adres, pod którym otwierasz ArchFlow w przeglądarce, np. `http://localhost:9500`. Zapis na serwerze musi być włączony; w obrazie Dockera jest włączony domyślnie.

## 2. Dodaj go do asystenta

### Claude Code

Jedno polecenie w terminalu. Dla Dockera dodaj `-e ARCHFLOW_URL=…`:

~~~bash
claude mcp add archflow --scope user -e ARCHFLOW_URL=http://localhost:9500 -- npx -y archflow-mcp
~~~

Dla folderu aplikacji desktopowej pomiń część `-e`. Dzięki `--scope user` ArchFlow będzie dostępny we wszystkich Twoich projektach. Sprawdzisz to poleceniem `claude mcp list`.

### Claude Desktop

1. Otwórz **Settings → Developer → Edit Config**. Otworzy się plik `claude_desktop_config.json`.
2. Dodaj `archflow` do `mcpServers`:

~~~json
{
  "mcpServers": {
    "archflow": {
      "command": "npx",
      "args": ["-y", "archflow-mcp"],
      "env": { "ARCHFLOW_URL": "http://localhost:9500" }
    }
  }
}
~~~

3. Uruchom Claude Desktop ponownie. Narzędzia ArchFlow pojawią się pod ikoną narzędzi (🔨).

Dla folderu aplikacji desktopowej usuń linię `env`.

### Inne programy obsługujące MCP

Uruchom `npx -y archflow-mcp` jako serwer **stdio**, ze zmiennymi z kroku 1 w środowisku. `npx -y archflow-mcp --help` pokazuje dostępne opcje.

## 3. Wypróbuj

Pisz własnymi słowami, w dowolnym języku. Na przykład:

- *„Narysuj diagram sklepu internetowego: klienci (przeglądarka, aplikacja mobilna), wejście (load balancer, brama API), usługi (zamówienia, płatności, kolejka zdarzeń), dane (PostgreSQL, Redis, hurtownia danych). Pod spodem dodaj proces zamówienia: nowe zamówienie, przyjęcie, opłacone?, wysyłka, dostarczone.”*
- *„W diagramie Sklep internetowy dodaj usługę wyszukiwania obok bazy i połącz z nią zamówienia.”*
- *„Które usługi w diagramie Sklep internetowy łączą się z bazą?”*
- *„Zmień nazwę diagramu na Sklep v2 i wyeksportuj go do ~/Pulpit/sklep.json.”*

Asystent napisze, gdzie zapisał diagram.

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

Potem w krokach powyżej zamiast `npx -y archflow-mcp` użyj `node /pełna/ścieżka/do/ArchFlow/packages/archflow-mcp/dist/index.js`. Testy uruchamia `npm test --workspace=packages/archflow-mcp`.
