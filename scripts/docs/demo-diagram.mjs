// Demo diagram used for the documentation screenshots: an online shop
// (customers, entry, services, data) with the order process underneath.
// buildDemo('pl' | 'en') returns an ArchFlow model in the user's language.

const T = {
  title: { pl: 'Sklep internetowy', en: 'Online shop' },
  zones: {
    customers: { pl: 'Klienci', en: 'Customers' },
    entry: { pl: 'Wejście', en: 'Entry' },
    services: { pl: 'Usługi', en: 'Services' },
    data: { pl: 'Dane', en: 'Data' },
    process: { pl: 'Proces zamówienia', en: 'Order process' }
  },
  nodes: {
    customer: { pl: 'Klient', en: 'Customer' },
    mobile: { pl: 'Aplikacja mobilna', en: 'Mobile app' },
    laptop: { pl: 'Przeglądarka', en: 'Browser' },
    lb: { pl: 'Load balancer', en: 'Load balancer' },
    web: { pl: 'Sklep WWW', en: 'Web shop' },
    api: { pl: 'API', en: 'API' },
    orders: { pl: 'Zamówienia', en: 'Orders' },
    payments: { pl: 'Płatności', en: 'Payments' },
    queue: { pl: 'Kolejka zdarzeń', en: 'Event queue' },
    notify: { pl: 'Powiadomienia', en: 'Notifications' },
    db: { pl: 'Baza zamówień', en: 'Orders DB' },
    cache: { pl: 'Cache', en: 'Cache' },
    dwh: { pl: 'Hurtownia danych', en: 'Data warehouse' },
    start: { pl: 'Nowe zamówienie', en: 'New order' },
    accept: { pl: 'Przyjęcie', en: 'Accept order' },
    paid: { pl: 'Opłacone?', en: 'Paid?' },
    ship: { pl: 'Wysyłka', en: 'Shipping' },
    end: { pl: 'Dostarczone', en: 'Delivered' }
  },
  desc: {
    orders: { pl: 'Mikroserwis obsługujący koszyk i zamówienia.', en: 'Microservice that handles the cart and orders.' },
    db: { pl: 'PostgreSQL, kopia co godzinę.', en: 'PostgreSQL, hourly backup.' }
  }
};

// Place things by "screen" position: c moves right on screen, up moves up.
// Tile (x, y) with x = c + up/2-ish: centre of zone c is tile (c, -c).
const at = (c, up = 0) => {
  return { x: c + up, y: -c + up };
};

export const buildDemo = (lang = 'en') => {
  const t = (o) => {
    return o[lang] ?? o.en;
  };
  const items = [];
  const viewItems = [];
  const node = (id, icon, name, tile, description) => {
    items.push({ id, name, icon, ...(description ? { description: `<p>${description}</p>` } : {}) });
    viewItems.push({ id, tile });
  };

  // Zones: centre c, 3x3 tiles, next to each other with a 1-tile gap
  const zones = [
    { id: 'z-customers', c: -6, color: 'amber', label: T.zones.customers },
    { id: 'z-entry', c: -2, color: 'violet', label: T.zones.entry },
    { id: 'z-services', c: 2, color: 'blue', label: T.zones.services },
    { id: 'z-data', c: 6, color: 'green', label: T.zones.data }
  ];

  // In each zone: one node on the left corner, one on top, one at the bottom
  node('customer', 'customer', t(T.nodes.customer), at(-7, 0));
  node('mobile', 'mobiledevice', t(T.nodes.mobile), at(-6, 1));
  node('laptop', 'laptop', t(T.nodes.laptop), at(-6, -1));

  node('lb', 'loadbalancer', t(T.nodes.lb), at(-3, 0));
  node('web', 'web-app', t(T.nodes.web), at(-2, 1));
  node('api', 'api-gateway', t(T.nodes.api), at(-2, -1));

  node('orders', 'microservice', t(T.nodes.orders), at(1, 0));
  node('payments', 'paymentcard', t(T.nodes.payments), at(2, 1));
  node('queue', 'queue', t(T.nodes.queue), at(2, -1));

  node('db', 'storage', t(T.nodes.db), at(5, 0));
  node('cache', 'cache', t(T.nodes.cache), at(6, 1));
  node('dwh', 'data-warehouse', t(T.nodes.dwh), at(6, -1));

  // Order process underneath
  const flowUp = -4;
  node('start', 'start', t(T.nodes.start), at(-6, flowUp));
  node('accept', 'process', t(T.nodes.accept), at(-3, flowUp));
  node('paid', 'diamond', t(T.nodes.paid), at(0, flowUp));
  node('ship', 'truck', t(T.nodes.ship), at(3, flowUp));
  node('end', 'end', t(T.nodes.end), at(6, flowUp));

  const connect = (id, from, to, color, extra = {}) => {
    return {
      id,
      color,
      anchors: [
        { id: `${id}-a`, ref: { item: from } },
        { id: `${id}-b`, ref: { item: to } }
      ],
      ...extra
    };
  };
  const connectors = [
    connect('c1', 'customer', 'lb', 'amber'),
    connect('c2', 'laptop', 'lb', 'amber'),
    connect('c3', 'mobile', 'api', 'amber'),
    connect('c4', 'lb', 'web', 'violet'),
    connect('c5', 'web', 'orders', 'violet'),
    connect('c6', 'api', 'orders', 'violet'),
    connect('c7', 'orders', 'payments', 'blue'),
    connect('c8', 'orders', 'queue', 'blue', { style: 'DASHED' }),
    connect('c9', 'orders', 'db', 'blue'),
    connect('c10', 'db', 'cache', 'green'),
    connect('c11', 'db', 'dwh', 'green', { style: 'DOTTED' }),
    connect('f1', 'start', 'accept', 'pink'),
    connect('f2', 'accept', 'paid', 'pink'),
    connect('f3', 'paid', 'ship', 'pink'),
    connect('f4', 'ship', 'end', 'pink')
  ];

  const rectangles = zones.map((z) => {
    return {
      id: z.id,
      color: z.color,
      from: { x: z.c - 1, y: -z.c - 1 },
      to: { x: z.c + 1, y: -z.c + 1 }
    };
  });

  const textBoxes = zones.map((z) => {
    return {
      id: `t-${z.id}`,
      tile: { x: z.c - 1, y: -z.c + 3 },
      content: t(z.label),
      fontSize: 0.4
    };
  });
  textBoxes.push({
    id: 't-process',
    tile: at(-9, flowUp - 1),
    content: t(T.zones.process),
    fontSize: 0.4
  });

  return {
    title: t(T.title),
    colors: [
      { id: 'amber', value: '#f6c66b' },
      { id: 'violet', value: '#b9a6f3' },
      { id: 'blue', value: '#9ebcf5' },
      { id: 'green', value: '#9fdcbf' },
      { id: 'pink', value: '#e59cc0' }
    ],
    items,
    views: [
      {
        id: 'main',
        name: t(T.title),
        items: viewItems,
        connectors,
        rectangles,
        textBoxes
      }
    ],
    fitToScreen: true
  };
};
