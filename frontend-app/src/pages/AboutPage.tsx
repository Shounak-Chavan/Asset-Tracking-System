export function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">About Us</h1>
          <p className="page-subtitle">Building accountable and efficient asset operations.</p>
        </div>
      </div>

      <div className="card flex flex-col gap-4">
        <p className="text-sm text-surface-300">
          AssetFlow helps teams track, book, allocate, and return shared assets through a single platform.
          The system is designed for transparent lifecycle tracking from booking to post-return processing.
        </p>
        <p className="text-sm text-surface-300">
          Our goal is to reduce operational friction, prevent booking conflicts, and improve governance with
          role-based modules for both users and administrators.
        </p>
      </div>
    </div>
  )
}
