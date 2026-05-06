import { useNavigate } from 'react-router-dom'
import { Package2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
          <Package2 className="w-10 h-10 text-blue-400" />
        </div>
        <p className="text-7xl font-black text-gray-200 mb-2">404</p>
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
