export function TermsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Terms and Conditions</h1>
          <p className="page-subtitle">Rules that govern asset bookings and usage.</p>
        </div>
      </div>

      <div className="card flex flex-col gap-4">
        <section>
          <h2 className="section-title">Booking and Payment</h2>
          <p className="text-sm text-surface-300 mt-2">
            Deposit payment is mandatory to confirm a booking. Deposits are non-refundable.
            Rental charges must be fully paid before return request is allowed.
          </p>
        </section>

        <section>
          <h2 className="section-title">Date Availability</h2>
          <p className="text-sm text-surface-300 mt-2">
            Once a booking is confirmed for selected dates, those dates are blocked for that asset.
            Overlapping bookings for the same asset are not permitted.
          </p>
        </section>

        <section>
          <h2 className="section-title">Asset Returns</h2>
          <p className="text-sm text-surface-300 mt-2">
            Return requests can be raised only after rent payment is complete.
            Late returns and damage may attract additional charges.
          </p>
        </section>
      </div>
    </div>
  )
}
