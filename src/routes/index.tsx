import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Receipt, Search, Printer, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  defaultSettings,
  loadSettings,
  
  saveInvoice,
  findBooking,
  formatMoney,
  newInvoiceId,
  newInvoiceNumber,
  
  type Settings,
  type Invoice,
  type Booking,
} from "@/lib/invoice-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invoice Generator" },
      { name: "description", content: "Create and manage invoices from your bookings." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Invoice Studio</h1>
              <p className="text-xs text-muted-foreground">Generate invoices from bookings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <InvoicesTab />
      </main>
    </div>
  );
}

/* ---------------- Invoices ---------------- */

function InvoicesTab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-64 w-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary transition-colors hover:border-primary hover:bg-primary/10"
      >
        <Plus className="h-16 w-16 transition-transform group-hover:scale-110" />
        <span className="text-lg font-semibold">Create invoice</span>
      </button>

      <CreateInvoiceDialog open={open} onOpenChange={setOpen} onCreated={() => {}} />
    </div>
  );
}

/* ---------------- Create invoice dialog ---------------- */

function CreateInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<Booking | null>(null);
  const [biz, setBiz] = useState<Settings>(defaultSettings);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  
  const [generated, setGenerated] = useState<Invoice | null>(null);

  useEffect(() => {
    if (open) {
      setBookingIdInput("");
      setBooking(null);
      setForm(null);
      setBiz(loadSettings());
      setInvoiceNumber(newInvoiceNumber());
      setOrganizationName("");
      
      setGenerated(null);
    }
  }, [open]);

  const proceedWithBooking = (b: Booking) => {
    setBooking(b);
    setForm({ ...b });
  };

  const handleSelectBooking = () => {
    const b = findBooking(bookingIdInput);
    if (!b) {
      toast.error("No booking found. Try BK-1001 – BK-1005.");
      return;
    }
    proceedWithBooking(b);
  };

  const subtotal = useMemo(() => {
    if (!form) return 0;
    if (form.items && form.items.length > 0) {
      return form.items.reduce((s, it) => s + it.quantity * it.price, 0);
    }
    return form.ticketsQuantity * form.ticketPrice;
  }, [form]);
  const total = useMemo(() => (form ? subtotal + form.taxesAndFees : 0), [form, subtotal]);
  const amountDue = useMemo(() => (form ? Math.max(total - form.amountPaid, 0) : 0), [form, total]);


  const updateBiz = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setBiz((prev) => ({ ...prev, [k]: v }));

  const handleGenerate = () => {
    if (!form) return;
    const trimmedNumber = invoiceNumber.trim() || newInvoiceNumber();
    const inv: Invoice = {
      id: newInvoiceId(),
      invoiceNumber: trimmedNumber,
      createdAt: new Date().toISOString(),
      createdBy: biz.operatorName.trim() || undefined,
      activityDate: form.activityDate,
      bookingId: form.id,
      productName: form.productName,
      organizationName: organizationName.trim() || undefined,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      ticketsQuantity: form.ticketsQuantity,
      ticketPrice: form.ticketPrice,
      subtotal,
      taxesAndFees: form.taxesAndFees,
      total,
      amountDue,
      items: form.items,
      business: {
        name: biz.businessName,
        id: biz.businessId,
        logo: biz.businessLogo,
        address: biz.address,
        notes: biz.notes,
      },
    };
    saveInvoice(inv);
    setGenerated(inv);
    onCreated();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && generated) {
          if (
            !window.confirm(
              "Are you sure? Once you close this you won't be able to access this invoice again — you'll need to create a new one."
            )
          ) {
            return;
          }
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl print:max-h-none print:overflow-visible print:border-0 print:shadow-none">

        <DialogHeader className="print:hidden">
          <DialogTitle>{generated ? "Invoice created" : "Create invoice"}</DialogTitle>
          <DialogDescription>
            {generated
              ? "Review the invoice below. Print or save as PDF to share."
              : booking
              ? "Review booking details and override business info if needed."
              : "Find a booking by ID to begin."}
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-4 py-2">
            <style>{`
              @media print {
                @page { margin: 12mm; }
                html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                body * { visibility: hidden !important; }
                [role="dialog"] {
                  position: static !important;
                  transform: none !important;
                  inset: auto !important;
                  max-width: none !important;
                  width: auto !important;
                  max-height: none !important;
                  height: auto !important;
                  overflow: visible !important;
                  border: 0 !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                }
                #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
                #invoice-print-area { position: static !important; margin: 0 !important; padding: 0 !important; }
              }
            `}</style>


            <div id="invoice-print-area" className="rounded-xl border bg-card p-8 print:border-0 print:p-0">
              {/* Header */}
              <header className="flex items-start justify-between gap-6 border-b pb-6">
                <div className="flex items-start gap-4">
                  {generated.business.logo ? (
                    <img src={generated.business.logo} alt="Logo" className="h-14 w-14 object-contain" />
                  ) : null}
                  <div>
                    <h2 className="text-lg font-semibold">{generated.business.name || "Your Business"}</h2>
                    {generated.business.id && (
                      <p className="text-xs text-muted-foreground">ID: {generated.business.id}</p>
                    )}
                    {generated.business.address && (
                      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                        {generated.business.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</p>
                  <p className="text-xl font-semibold text-primary">{generated.invoiceNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Issued {new Date(generated.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </header>

              {/* Bill to / Booking card */}
              <section className="mt-5 grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bill to</p>
                    {generated.organizationName && (
                      <p className="font-semibold">{generated.organizationName}</p>
                    )}
                    <p className={generated.organizationName ? "text-muted-foreground" : "font-semibold"}>
                      {generated.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">{generated.customerEmail}</p>
                    <p className="text-xs text-muted-foreground">{generated.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Booking</p>
                    <p className="font-semibold">{generated.bookingId}</p>
                    <p className="text-xs text-muted-foreground">
                      Activity: {new Date(generated.activityDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* Line items */}
              <section className="mt-6 overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ticket</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                      <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-background">
                      <td colSpan={4} className="px-4 py-2 font-semibold">{generated.productName}</td>
                    </tr>
                    {generated.items && generated.items.length > 0 ? (
                      generated.items.map((it, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-4 py-3 pl-8">{it.name}</td>
                          <td className="px-4 py-3 text-right">{it.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(it.price)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(it.quantity * it.price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b last:border-0">
                        <td className="px-4 py-3 pl-8">Ticket</td>
                        <td className="px-4 py-3 text-right">{generated.ticketsQuantity}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(generated.ticketPrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatMoney(generated.subtotal)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              {/* Totals */}
              <section className="mt-4 flex justify-end">
                <div className="w-full max-w-xs space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(generated.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & fees</span>
                    <span>{formatMoney(generated.taxesAndFees)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(generated.total)}</span>
                  </div>
                  <div className="flex justify-between rounded-md bg-primary/10 px-3 py-2 text-primary">
                    <span className="font-semibold">Amount due</span>
                    <span className="font-semibold">{formatMoney(generated.amountDue)}</span>
                  </div>
                </div>
              </section>

              {generated.business.notes && (
                <section className="mt-6 border-t pt-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-line text-sm">{generated.business.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : !booking ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bookingId">Booking ID</Label>
              <div className="flex gap-2">
                <Input
                  id="bookingId"
                  placeholder="BK-1001"
                  value={bookingIdInput}
                  onChange={(e) => setBookingIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectBooking()}
                />
                <Button onClick={handleSelectBooking}>
                  <Search className="mr-2 h-4 w-4" /> Select
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Demo IDs: BK-1001, BK-1002, BK-1003, BK-1004, BK-1005
              </p>
            </div>
          </div>
        ) : form ? (
          <div className="space-y-6 py-2">
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
              To change any of the booking details do this in Peek first.
            </div>
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Invoice
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Invoice number" className="sm:col-span-2">
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-202606-1234"
                  />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Customer name">
                  <Input value={form.customerName} readOnly disabled />
                </Field>
                <Field label="Customer email">
                  <Input type="email" value={form.customerEmail} readOnly disabled />
                </Field>
                <Field label="Customer phone">
                  <Input value={form.customerPhone} readOnly disabled />
                </Field>
                <Field label="Organization name (optional)">
                  <Input
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Corp."
                  />
                </Field>
                <Field label="Note to Customer" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={biz.notes}
                    onChange={(e) => updateBiz("notes", e.target.value)}
                    placeholder="Thank you for your business!"
                  />
                </Field>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Booking Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Product name">
                  <Input value={form.productName} readOnly disabled />
                </Field>
                <Field label="Activity date">
                  <Input type="date" value={form.activityDate} readOnly disabled />
                </Field>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Ticket Type</th>
                      <th className="px-4 py-2 text-right font-medium">Price</th>
                      <th className="px-4 py-2 text-right font-medium">Quantity</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items && form.items.length > 0 ? (
                      form.items.map((it, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-4 py-3">{it.name}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(it.price)}</td>
                          <td className="px-4 py-3 text-right">{it.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(it.quantity * it.price)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b last:border-0">
                        <td className="px-4 py-3">{form.productName}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(form.ticketPrice)}</td>
                        <td className="px-4 py-3 text-right">{form.ticketsQuantity}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(subtotal)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="border-t bg-muted/30 px-4 py-3">
                  <Row label="Subtotal" value={formatMoney(subtotal)} />
                  <Row label="Taxes & fees" value={formatMoney(form.taxesAndFees)} />
                  <Row label="Total" value={formatMoney(total)} strong />
                  <Row label="Amount paid" value={formatMoney(form.amountPaid)} />
                  <Row label="Amount due" value={formatMoney(amountDue)} accent />
                </div>
              </div>
            </section>


          </div>
        ) : null}

        <DialogFooter className="print:hidden">
          {generated ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure? Once you close this you won't be able to access this invoice again — you'll need to create a new one."
                    )
                  ) {
                    onOpenChange(false);
                  }
                }}
              >
                Close
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {booking && <Button onClick={handleGenerate}>Generate</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${strong ? "font-semibold" : ""} ${accent ? "text-primary font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
