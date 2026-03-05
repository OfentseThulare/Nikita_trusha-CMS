import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon, User, Key, Globe } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const apiKey = process.env.PUBLIC_API_KEY
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://nikitatrusha.co.za'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-[#0033A0]" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Email</span>
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Role</span>
            <Badge className="bg-[#E8F0FB] text-[#0033A0] border-[#0033A0]/20">Admin</Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-[#0033A0]" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="py-2 border-b border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Public API Key</p>
            <p className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'Not configured'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Share this with the main website to authenticate API calls</p>
          </div>
          <div className="py-2 border-b border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Allowed Origin</p>
            <p className="text-sm font-medium text-gray-900">{allowedOrigin}</p>
          </div>
          <div className="py-2">
            <p className="text-sm text-gray-600 mb-1">API Base URL</p>
            <p className="text-xs font-mono text-gray-900">{siteUrl}/api/v1</p>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#0033A0]" />
            Public API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { method: 'GET', path: '/api/v1/posts', desc: 'List published posts (paginated)' },
              { method: 'GET', path: '/api/v1/posts/[slug]', desc: 'Single post with HTML content' },
              { method: 'GET', path: '/api/v1/categories', desc: 'All categories' },
              { method: 'GET', path: '/api/v1/availability?date=YYYY-MM-DD', desc: 'Available slots for a date' },
              { method: 'POST', path: '/api/v1/book', desc: 'Create a booking' },
            ].map(ep => (
              <div key={ep.path} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <Badge
                  variant="outline"
                  className={ep.method === 'POST'
                    ? 'text-green-700 border-green-200 bg-green-50 text-xs'
                    : 'text-blue-700 border-blue-200 bg-blue-50 text-xs'
                  }
                >
                  {ep.method}
                </Badge>
                <div>
                  <p className="font-mono text-xs text-gray-900">{ep.path}</p>
                  <p className="text-xs text-gray-500">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">All endpoints require <code className="bg-gray-100 px-1 rounded">x-api-key</code> header</p>
        </CardContent>
      </Card>
    </div>
  )
}
