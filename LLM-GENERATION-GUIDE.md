# Generating ArchFlow diagrams with AI

There are two ways to let an AI model draw ArchFlow diagrams.

1. **The MCP server (recommended).** Assistants that support the Model Context Protocol (Claude Desktop, Claude Code and others) build, change and save diagrams directly, with automatic layout and validation. See **[docs/mcp.md](docs/mcp.md)**.
2. **The compact format (this page).** Any chat model can write a small JSON file, which you open in ArchFlow with ☰ → *Open from file (JSON)*.

## Compact format

~~~json
{
  "t": "Web shop",
  "i": [
    ["Browser", "laptop", "Customers order here"],
    ["Load balancer", "loadbalancer", ""],
    ["Orders", "microservice", "Cart and orders"],
    ["Orders DB", "storage", "PostgreSQL"]
  ],
  "v": [
    [
      [[0, 0, 0], [1, 3, -3], [2, 6, -6], [3, 9, -9]],
      [[0, 1], [1, 2], [2, 3]]
    ]
  ],
  "_": { "f": "compact", "v": "1.0" }
}
~~~

- `t`: the diagram title.
- `i`: the items, each `[name, icon id, description]`. Keep names short, 1 to 3 words: they're labels on the canvas.
- `v`: the views, normally just one: `[positions, connections]`.
  - positions: `[item index, x, y]`, a tile on the isometric grid;
  - connections: `[from index, to index]`, an arrow between two items.
- `_`: always `{"f": "compact", "v": "1.0"}`.

The compact format has no zones, connector labels or texts. The MCP server can make those, or you can add them in ArchFlow.

### Positions

Tiles are isometric: `x` grows towards the upper right of the screen and `y` towards the upper left. To lay items out on an ordinary screen grid (`col` to the right, `row` downwards) with comfortable spacing, use:

~~~
x = 3 * (col - row)
y = -3 * (col + row)
~~~

So a row from left to right is `(0, 0)`, `(3, -3)`, `(6, -6)`… and the next row down starts at `(-3, -3)`.

## Icon ids

ArchFlow has 177 isometric icons in 9 categories. Use these ids; names in the other interface languages are in the app.

**Servers & computers** (24): `server` Server, `server-rack` Server rack, `mainframe` Mainframe, `desktop` Desktop computer, `workstation` Workstation, `laptop` Laptop, `mobiledevice` Mobile phone, `tablet` Tablet, `web-app` Web application, `terminal` Terminal / console, `vm` Virtual machine, `container` Container, `cluster` Cluster / Kubernetes, `microservice` Microservice, `function-module` Function (serverless), `cronjob` Scheduled job, `gpu-server` GPU server, `cpu` CPU / chip, `printer` Printer, `iot-device` IoT device / sensor, `edge-device` Edge device, `kiosk` Kiosk, `smartwatch` Smartwatch, `camera` Camera

**Network** (19): `router` Router, `switch-module` Network switch, `hub` Hub, `modem` Modem, `wifi-ap` Wi-Fi access point, `loadbalancer` Load balancer, `dns` DNS, `api-gateway` API gateway, `cloud` Cloud, `internet` Internet, `tower` Radio tower, `antenna-5g` 5G antenna / base station, `vpn` VPN / tunnel, `satellite` Satellite, `cdn` CDN / edge network, `proxy` Proxy server, `nat` NAT / address translation, `vlan` VLAN / network segment, `fiber-link` Fiber link

**Communication** (17): `mail` E-mail, `mailmultiple` Multiple e-mails, `speech` Message / chat, `chat-group` Group chat, `sms` SMS / text message, `push` Push notification, `notification` Notification / alert, `megaphone` Broadcast / megaphone, `phone` Phone call, `webhook` Webhook, `queue` Message queue, `event-bus` Event bus / topic, `video-call` Video call, `newsletter` Newsletter, `rss` RSS / feed, `inbox` Inbox, `chatbot` Chatbot / assistant

**Data** (19): `storage` Database, `database-cluster` Database cluster, `cache` Cache, `disk` Disk drive, `bucket` Object storage (bucket), `data-warehouse` Data warehouse, `backup` Backup, `data-lake` Data lake, `file` File, `folder` Folder, `table` Table / spreadsheet, `etl` ETL / data pipeline, `stream` Data stream, `search-index` Search index, `archive` Archive, `nas` NAS / SAN storage, `graph-db` Graph database, `data-export` Data export, `data-import` Data import

**Security** (15): `firewall` Firewall, `waf` WAF / web application firewall, `lock` Lock, `key` Key / secret, `shield` Shield / protection, `certificate` Certificate, `identity` Identity / login, `mfa` MFA / one-time code, `audit-log` Audit log, `vault` Vault / safe, `bug` Threat / malware, `fingerprint` Biometrics / fingerprint, `policy` Policy / rules, `encryption` Encryption, `alert` Alert / incident

**People & organisation** (14): `user` User, `group` Team / group, `admin` Administrator, `customer` Customer, `manager` Manager, `developer` Developer, `support-agent` Support agent, `partner` Partner / supplier, `external-actor` External actor, `meeting` Meeting, `role` Role / permissions, `department` Department / org chart, `office` Office / company, `home` Home / remote work

**Flow & process** (29): `start` Start event, `end` End event, `intermediate-event` Intermediate event, `error` Error / exception, `signal` Signal, `message-send` Send message, `message-receive` Receive message, `approval` Approval, `rejection` Rejection, `process` Process step, `subprocess` Sub-process, `diamond` Decision, `parallel-gateway` Parallel gateway, `merge` Merge, `document` Document, `documents` Documents, `report` Report / analytics, `note` Note / annotation, `checklist` Checklist, `calendar` Calendar / deadline, `data-io` Data input / output, `data-store` Data store, `manual-input` Manual input, `manual-task` Manual task, `delay` Delay / wait, `timer` Timer, `loop` Loop / retry, `milestone` Milestone, `swimlane` Swimlane / pool

**Business & logistics** (26): `paymentcard` Payment card, `cardterminal` Card terminal, `cart` Shopping cart, `order` Order, `invoice` Invoice, `receipt` Receipt, `contract` Contract, `money` Money / payment, `bank` Bank, `wallet` Wallet, `store` Store / point of sale, `warehouse` Warehouse, `shelf` Shelf / inventory, `forklift` Forklift, `pallet` Pallet, `package-module` Package / parcel, `truck` Truck / transport, `truck-2` Delivery van, `plane` Plane / air freight, `ship` Ship / sea freight, `train` Train / rail freight, `drone` Delivery drone, `factory` Factory / plant, `factory-line` Production line, `kpi-chart` KPI / chart, `price-tag` Price tag / promotion

**Shapes** (14): `block` Block, `cube` Cube, `plate` Plate / platform, `sphere` Sphere, `cylinder` Cylinder, `cone` Cone, `pyramid` Pyramid, `hexagon` Hexagonal prism, `triangle-prism` Triangular prism, `torus` Ring / torus, `arrow` Arrow, `star` Star, `text-label` Label / text, `image` Image
