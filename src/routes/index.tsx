import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Settings as SettingsIcon, Plus, Upload, Receipt, Search, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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
  saveSettings,
  loadInvoices,
  saveInvoice,
  findBooking,
  formatMoney,
  newInvoiceId,
  newInvoiceNumber,
  deleteInvoice,
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
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="invoices">
              <FileText className="mr-2 h-4 w-4" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="mr-2 h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
            <InvoicesTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab() {
  const [s, setS] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const handleLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => update("businessLogo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveSettings(s);
    setSaved(true);
    toast.success("Settings saved");
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Business details</h2>
        <p className="text-sm text-muted-foreground">
          These fields appear on every invoice you generate. You can override them per invoice.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bn">Business name</Label>
          <Input id="bn" value={s.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Acme Tours LLC" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bid">Business ID</Label>
          <Input id="bid" value={s.businessId} onChange={(e) => update("businessId", e.target.value)} placeholder="EIN / VAT / Tax ID" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addr">Address</Label>
          <Textarea id="addr" rows={3} value={s.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St, Suite 200&#10;Springfield, IL 62701" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="op">Your name</Label>
          <Input id="op" value={s.operatorName} onChange={(e) => update("operatorName", e.target.value)} placeholder="Jane Doe" />
          <p className="text-xs text-muted-foreground">Recorded on each invoice you generate.</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Note to Customer</Label>
          <Textarea id="notes" rows={3} value={s.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Thank you for your business! Payment due within 14 days." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Business logo</Label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {s.businessLogo ? (
                <img src={s.businessLogo} alt="Logo preview" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
              <Upload className="h-4 w-4" />
              Upload logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
              />
            </label>
            {s.businessLogo && (
              <Button variant="ghost" size="sm" onClick={() => update("businessLogo", "")}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave}>{saved ? "Saved ✓" : "Save settings"}</Button>
      </div>
    </Card>
  );
}

/* ---------------- Invoices ---------------- */

function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  const refresh = () => setInvoices(loadInvoices());

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteInvoice(pendingDelete.id);
    toast.success(`Invoice ${pendingDelete.invoiceNumber} deleted`);
    setPendingDelete(null);
    refresh();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} created
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create invoice
        </Button>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground">Create your first invoice from a booking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Activity date</th>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Tickets</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDelete(inv)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Delete invoice ${inv.invoiceNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link to="/invoice/$id" params={{ id: inv.id }} target="_blank" className="font-medium text-primary hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.createdBy || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inv.activityDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{inv.customerName}</td>
                    <td className="px-4 py-3">{inv.productName}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateInvoiceDialog open={open} onOpenChange={setOpen} onCreated={refresh} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice{" "}
              <span className="font-medium text-foreground">{pendingDelete?.invoiceNumber}</span>
              {pendingDelete ? ` for ${pendingDelete.customerName}` : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  useEffect(() => {
    if (open) {
      setBookingIdInput("");
      setBooking(null);
      setForm(null);
      setBiz(loadSettings());
      setInvoiceNumber(newInvoiceNumber());
      setOrganizationName("");
      setDuplicateWarning(null);
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
    toast.success("Invoice generated");
    onCreated();
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
          <DialogDescription>
            {booking ? "Review booking details and override business info if needed." : "Find a booking by ID to begin."}
          </DialogDescription>
        </DialogHeader>

        {!booking ? (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {booking && (
            <Button onClick={handleGenerate}>Generate</Button>
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
