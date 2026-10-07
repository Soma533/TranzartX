/** Privacy policy (required for Google OAuth publishing). Plain-language summary. */
export default function PrivacyPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-4 rounded-3xl border bg-white p-8">
      <p className="text-sm uppercase tracking-widest text-primary">TranzartX</p>
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">What we collect</h2>
        <p>Account details you provide (name, email, profile information, portfolio content) and activity needed to run the platform (opportunity tracking, messages, inquiries, transactions).</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">Google sign-in</h2>
        <p>If you sign in with Google, we receive your name, email address and profile photo from Google, used only to create and identify your TranzartX account. We do not access your emails, contacts or other Google data.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">How we use it</h2>
        <p>To operate your profile, portfolio, marketplace listings, opportunity matching, messages and notifications. We never sell your personal data.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">Payments</h2>
        <p>Purchases are processed by Paystack. We never see or store your card details — only transaction status and references.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">Your control</h2>
        <p>Edit or delete your content anytime in Settings and Portfolio. To delete your account and data, contact us and we will remove it.</p>
      </section>
      <section className="grid gap-2 text-sm">
        <h2 className="font-semibold">Contact</h2>
        <p>Questions about this policy: use the Contact option on any artwork page to reach the team.</p>
      </section>
    </div>
  );
}
