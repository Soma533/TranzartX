/** Terms of Service (required for Google OAuth publishing). */
export default function TermsPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-4 rounded-3xl border bg-white p-8">
      <p className="text-sm uppercase tracking-widest text-primary">TranzartX</p>
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">1. The platform</h2>
        <p>TranzartX provides portfolio hosting, an art marketplace, career opportunities, and professional networking for visual artists, collectors, galleries, curators, and art lovers. Accounts are free.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">2. Your content</h2>
        <p>You keep full ownership of artwork and writing you publish. By publishing, you grant TranzartX the right to display it on the platform. Do not upload work you do not own or have no right to sell. We may remove content that infringes rights or violates the law.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">3. Marketplace and payments</h2>
        <p>Purchases are processed by Paystack under their terms. Prices are set by artists in their local currency. TranzartX marks work sold only after the payment provider confirms it. Delivery arrangements are between buyer and artist; contact the artist promptly after any sale or inquiry.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">4. Verification and trust</h2>
        <p>Verified badges reflect checks we performed at review time. Unverified information is self-reported by users — treat it accordingly and do your own diligence before transacting.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">5. Acceptable use</h2>
        <p>No spam, fraud, harassment, hateful content, or interference with the platform. Accounts breaking these rules may be suspended.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">6. Liability</h2>
        <p>The platform is provided as-is. To the extent permitted by law, TranzartX is not liable for disputes between users, including sales, commissions, and collaborations.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">7. Changes and contact</h2>
        <p>We may update these terms; continued use means acceptance. Questions: reach the team via the Contact option on any artwork page.</p>
      </section>
    </div>
  );
}
