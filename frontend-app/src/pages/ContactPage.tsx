export function ContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">Reach the Asset Operations team for support.</p>
        </div>
      </div>

      <div className="card flex flex-col gap-3">
        <p className="text-sm text-surface-300"><strong>Email:</strong> support@assetflow.local</p>
        <p className="text-sm text-surface-300"><strong>Phone:</strong> +91 90000 00000</p>
        <p className="text-sm text-surface-300"><strong>Hours:</strong> Mon-Sat, 9:00 AM to 6:00 PM</p>
        <p className="text-sm text-surface-400 mt-2">
          Include your booking ID or asset code when reporting booking, payment, or return issues.
        </p>
      </div>
    </div>
  )
}
