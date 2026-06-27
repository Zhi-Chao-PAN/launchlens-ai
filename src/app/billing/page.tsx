import type { Metadata } from "next";

import { CommercialBilling } from "@/components/commercial-billing";

export const metadata: Metadata = {
  title: "Billing - LaunchLens AI",
  description:
    "Inspect LaunchLens AI subscription state, start Stripe Checkout, or open the billing portal.",
};

export default function BillingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <CommercialBilling />
    </main>
  );
}
