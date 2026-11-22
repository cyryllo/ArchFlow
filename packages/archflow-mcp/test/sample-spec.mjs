// A typical request: an online shop in four tiers plus the order process.
export const shopSpec = {
  title: 'Online shop',
  zones: [
    { id: 'customers', name: 'Customers', color: 'amber' },
    { id: 'entry', name: 'Entry', color: 'violet' },
    { id: 'services', name: 'Services', color: 'blue' },
    { id: 'data', name: 'Data', color: 'green' },
    { id: 'process', name: 'Order process', color: 'none', row: 1, shape: 'line' }
  ],
  nodes: [
    { id: 'customer', name: 'Customer', icon: 'customer', zone: 'customers' },
    { id: 'mobile', name: 'Mobile app', icon: 'mobiledevice', zone: 'customers' },
    { id: 'browser', name: 'Browser', icon: 'laptop', zone: 'customers' },
    { id: 'lb', name: 'Load balancer', icon: 'loadbalancer', zone: 'entry' },
    { id: 'web', name: 'Web shop', icon: 'web-app', zone: 'entry' },
    { id: 'api', name: 'API', icon: 'api-gateway', zone: 'entry' },
    { id: 'orders', name: 'Orders', icon: 'microservice', zone: 'services', description: 'Cart and orders.\n\nWritten in Go.' },
    { id: 'payments', name: 'Payments', icon: 'paymentcard', zone: 'services' },
    { id: 'queue', name: 'Event queue', icon: 'queue', zone: 'services' },
    { id: 'db', name: 'Orders DB', icon: 'storage', zone: 'data', description: 'PostgreSQL, hourly backup' },
    { id: 'cache', name: 'Cache', icon: 'cache', zone: 'data' },
    { id: 'dwh', name: 'Data warehouse', icon: 'data-warehouse', zone: 'data' },
    { id: 'start', name: 'New order', icon: 'start', zone: 'process' },
    { id: 'accept', name: 'Accept order', icon: 'process', zone: 'process' },
    { id: 'paid', name: 'Paid?', icon: 'diamond', zone: 'process' },
    { id: 'ship', name: 'Shipping', icon: 'truck', zone: 'process' },
    { id: 'end', name: 'Delivered', icon: 'end', zone: 'process' }
  ],
  connectors: [
    { from: 'customer', to: 'lb' },
    { from: 'browser', to: 'lb' },
    { from: 'mobile', to: 'api' },
    { from: 'lb', to: 'web' },
    { from: 'web', to: 'orders' },
    { from: 'api', to: 'orders', label: 'REST' },
    { from: 'orders', to: 'payments' },
    { from: 'orders', to: 'queue', style: 'dashed' },
    { from: 'orders', to: 'db' },
    { from: 'db', to: 'cache' },
    { from: 'db', to: 'dwh', style: 'dotted' },
    { from: 'start', to: 'accept', color: 'pink' },
    { from: 'accept', to: 'paid', color: 'pink' },
    { from: 'paid', to: 'ship', color: 'pink', label: 'yes' },
    { from: 'ship', to: 'end', color: 'pink' }
  ]
};
