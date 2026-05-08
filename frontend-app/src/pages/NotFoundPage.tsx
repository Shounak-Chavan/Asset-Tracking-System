import { useNavigate } from 'react-router-dom'
import { Package2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6" style={{ background: 'linear-gradient(160deg, #eef6ff 0%, #f0f4f8 50%, #f0fdf9 100%)' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.15)' }}>
          <Package2 className="w-10 h-10 text-blue-500" />
        </div>
        <p className="font-black text-gray-200 mb-2" style={{ fontSize: '80px', lineHeight: 1, background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
