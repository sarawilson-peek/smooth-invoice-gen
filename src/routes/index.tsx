import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Receipt, Search, Check, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  loadInvoices,
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
  const [duplicateWarning, setDuplicateWarning] = useState<{ booking: Booking; existing: Invoice[] } | null>(null);
  const [generated, setGenerated] = useState<Invoice | null>(null);

  useEffect(() => {
    if (open) {
      setBookingIdInput("");
      setBooking(null);
      setForm(null);
      setBiz(loadSettings());
      setInvoiceNumber(newInvoiceNumber());
      setOrganizationName("");
      setDuplicateWarning(null);
      setGenerated(null);
      setCopied(false);
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
    const existing = loadInvoices().filter((i) => i.bookingId === b.id);
    if (existing.length > 0) {
      setDuplicateWarning({ booking: b, existing });
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

  const invoiceUrl =
    generated && typeof window !== "undefined"
      ? `${window.location.origin}/invoice/${generated.id}`
      : "";

  const handleCopy = async () => {
    if (!invoiceUrl) return;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      toast.success("Invoice link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{generated ? "Invoice created" : "Create invoice"}</DialogTitle>
          <DialogDescription>
            {generated
              ? "Copy the link below to share this invoice."
              : booking
              ? "Review booking details and override business info if needed."
              : "Find a booking by ID to begin."}
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-semibold">Invoice {generated.invoiceNumber} is ready</p>
                <p className="text-sm text-muted-foreground">
                  For {generated.customerName} · {formatMoney(generated.total)}
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button asChild size="lg">
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> View Invoice
                </a>
              </Button>
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

        <DialogFooter>
          {generated ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
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

      <AlertDialog open={!!duplicateWarning} onOpenChange={(o) => !o && setDuplicateWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invoice already exists</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateWarning && (
                <>
                  Booking{" "}
                  <span className="font-medium text-foreground">{duplicateWarning.booking.id}</span>{" "}
                  already has {duplicateWarning.existing.length}{" "}
                  {duplicateWarning.existing.length === 1 ? "invoice" : "invoices"} (
                  {duplicateWarning.existing.map((i) => i.invoiceNumber).join(", ")}). Would you like to create another one?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (duplicateWarning) proceedWithBooking(duplicateWarning.booking);
                setDuplicateWarning(null);
              }}
            >
              Proceed anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
