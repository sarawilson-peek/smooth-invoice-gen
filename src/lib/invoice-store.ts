// Local-only storage + mock booking data for the invoice generator.

export type Settings = {
  businessName: string;
  businessId: string;
  businessLogo: string; // data URL
  address: string;
  notes: string;
  operatorName: string;
};

export type LineItem = {
  name: string;
  quantity: number;
  price: number;
};

export type Booking = {
  id: string;
  productName: string;
  activityDate: string; // ISO date
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketsQuantity: number;
  ticketPrice: number;
  taxesAndFees: number;
  amountPaid: number;
  items?: LineItem[];
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  activityDate: string;
  bookingId: string;
  productName: string;
  organizationName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketsQuantity: number;
  ticketPrice: number;
  subtotal: number;
  taxesAndFees: number;
  total: number;
  amountDue: number;
  items?: LineItem[];
  business: {
    name: string;
    id: string;
    logo: string;
    address: string;
    notes: string;
  };
};

const SETTINGS_KEY = "invoice_app_settings_v1";
const INVOICES_KEY = "invoice_app_invoices_v1";

export const defaultSettings: Settings = {
  businessName: "",
  businessId: "",
  businessLogo: "",
  address: "",
  notes: "",
};

const isBrowser = () => typeof window !== "undefined";

export function loadSettings(): Settings {
  if (!isBrowser()) return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: Settings) {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadInvoices(): Invoice[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
}

export function saveInvoice(inv: Invoice) {
  if (!isBrowser()) return;
  const all = loadInvoices();
  all.unshift(inv);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(all));
}

export function deleteInvoice(id: string) {
  if (!isBrowser()) return;
  const all = loadInvoices().filter((i) => i.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(all));
}

export function getInvoice(id: string): Invoice | undefined {
  return loadInvoices().find((i) => i.id === id);
}

// ---- Mock bookings ----
export const mockBookings: Booking[] = [
  {
    id: "BK-1001",
    productName: "Sunset Sailing Tour",
    activityDate: "2026-07-12",
    customerName: "Amelia Hart",
    customerEmail: "amelia.hart@example.com",
    customerPhone: "+1 (415) 555-2014",
    ticketsQuantity: 4,
    ticketPrice: 85,
    taxesAndFees: 28.5,
    amountPaid: 150,
  },
  {
    id: "BK-1002",
    productName: "Volcano Hiking Adventure",
    activityDate: "2026-08-03",
    customerName: "Marcus Chen",
    customerEmail: "m.chen@example.com",
    customerPhone: "+1 (808) 555-9921",
    ticketsQuantity: 2,
    ticketPrice: 145,
    taxesAndFees: 24.2,
    amountPaid: 0,
  },
  {
    id: "BK-1003",
    productName: "City Food Walking Tour",
    activityDate: "2026-07-22",
    customerName: "Priya Patel",
    customerEmail: "priya.p@example.com",
    customerPhone: "+44 20 7946 0118",
    ticketsQuantity: 6,
    ticketPrice: 65,
    taxesAndFees: 31.2,
    amountPaid: 421.2,
  },
  {
    id: "BK-1004",
    productName: "Scuba Discovery Dive",
    activityDate: "2026-09-15",
    customerName: "Diego Alvarez",
    customerEmail: "diego.a@example.com",
    customerPhone: "+34 612 345 678",
    ticketsQuantity: 1,
    ticketPrice: 220,
    taxesAndFees: 18.5,
    amountPaid: 100,
  },
  {
    id: "BK-1005",
    productName: "Coastal Kayak Expedition",
    activityDate: "2026-08-18",
    customerName: "Sofia Ramirez",
    customerEmail: "sofia.r@example.com",
    customerPhone: "+1 (305) 555-0177",
    ticketsQuantity: 15,
    ticketPrice: 0,
    taxesAndFees: 62.5,
    amountPaid: 200,
    items: [
      { name: "Adult ticket", quantity: 10, price: 75 },
      { name: "Child ticket", quantity: 5, price: 45 },
      { name: "Water bottle", quantity: 4, price: 6 },
    ],
  },
];

export function findBooking(id: string): Booking | undefined {
  return mockBookings.find((b) => b.id.toLowerCase() === id.trim().toLowerCase());
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function newInvoiceId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newInvoiceNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}-${rand}`;
}
