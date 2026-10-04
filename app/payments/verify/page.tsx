export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-xl font-bold">Payment verification</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paystack redirects here after checkout. The webhook finalizes the transaction server-side and marks the artwork SOLD.
      </p>
    </div>
  );
}
