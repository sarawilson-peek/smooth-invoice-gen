import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoice, formatMoney, type Invoice } from "@/lib/invoice-store";

export const Route = createFileRoute("/invoice/$id")({
  head: () => ({
    meta: [{ title: "Invoice" }],
  }),
  component: InvoicePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Invoice not found.</p>
    </div>
  ),
});

function InvoicePage() {
  const { id } = Route.useParams();
  const [inv, setInv] = useState<Invoice | null | undefined>(undefined);

  useEffect(() => {
    const found = getInvoice(id);
    setInv(found ?? null);
  }, [id]);

  if (inv === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (inv === null) {
    throw notFound();
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4 print:max-w-none print:px-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={() => window.close()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>

        <article className="rounded-xl border bg-card p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none print:p-8">
          {/* Header */}
          <header className="flex items-start justify-between gap-6 border-b pb-6">
            <div className="flex items-start gap-4">
              {inv.business.logo ? (
                <img src={inv.business.logo} alt="Logo" className="h-16 w-16 object-contain" />
              ) : null}
              <div>
                <h1 className="text-xl font-semibold">{inv.business.name || "Your Business"}</h1>
                {inv.business.id && (
                  <p className="text-xs text-muted-foreground">ID: {inv.business.id}</p>
                )}
                {inv.business.address && (
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                    {inv.business.address}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="text-2xl font-semibold text-primary">{inv.invoiceNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Issued {new Date(inv.createdAt).toLocaleDateString()}
              </p>
            </div>
          </header>

          {/* Meta */}
          <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Bill to</p>
              <p className="font-medium">{inv.customerName}</p>
              <p className="text-muted-foreground">{inv.customerEmail}</p>
              <p className="text-muted-foreground">{inv.customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Booking</p>
              <p className="font-medium">{inv.bookingId}</p>
              <p className="text-muted-foreground">
                Activity: {new Date(inv.activityDate).toLocaleDateString()}
              </p>
            </div>
          </section>

          {/* Line items */}
          <section className="mt-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">{inv.productName}</td>
                  <td className="py-3 text-right">{inv.ticketsQuantity}</td>
                  <td className="py-3 text-right">{formatMoney(inv.ticketPrice)}</td>
                  <td className="py-3 text-right">{formatMoney(inv.subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes & fees</span>
                <span>{formatMoney(inv.taxesAndFees)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatMoney(inv.total)}</span>
              </div>
              <div className="flex justify-between rounded-md bg-primary/10 px-3 py-2 text-primary">
                <span className="font-semibold">Amount due</span>
                <span className="font-semibold">{formatMoney(inv.amountDue)}</span>
              </div>
            </div>
          </section>

          {/* Notes */}
          {inv.business.notes && (
            <section className="mt-10 border-t pt-6">
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="whitespace-pre-line text-sm">{inv.business.notes}</p>
            </section>
          )}
        </article>
      </div>
    </div>
  );
}
