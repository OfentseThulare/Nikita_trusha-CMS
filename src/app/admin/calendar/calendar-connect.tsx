'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Calendar, Link2, Unlink, TestTube } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/dates'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CalendarConnectProps {
  isConnected: boolean
  lastSync?: string
}

export function CalendarConnect({ isConnected: initialConnected, lastSync }: CalendarConnectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(initialConnected)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'google_connected') {
      toast.success('Google Calendar connected!')
      setIsConnected(true)
      router.replace('/admin/calendar')
    }
    if (error) {
      toast.error('Failed to connect Google Calendar. Please try again.')
      router.replace('/admin/calendar')
    }
  }, [searchParams, router])

  async function handleDisconnect() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('google_tokens').delete().eq('user_id', user.id)
    setIsConnected(false)
    toast.success('Google Calendar disconnected')
  }

  async function handleTestEvent() {
    setTesting(true)
    const res = await fetch('/api/admin/calendar/test', { method: 'POST' })
    const result = await res.json()
    if (result.success) {
      toast.success(`Test event created! Meet link: ${result.meetLink || 'not generated'}`)
    } else {
      toast.error('Test event failed. Check your Google Calendar connection.')
    }
    setTesting(false)
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Calendar className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">Google Calendar</h3>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  <XCircle className="mr-1 h-3 w-3" />
                  Not connected
                </Badge>
              )}
            </div>
            {isConnected && lastSync && (
              <p className="text-xs text-gray-500 mt-0.5">
                Last updated: {formatDateTime(lastSync)}
              </p>
            )}
            {!isConnected && (
              <p className="text-sm text-gray-500 mt-0.5">
                Connect to auto-generate Meet links for bookings
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestEvent}
                disabled={testing}
              >
                <TestTube className="mr-2 h-3.5 w-3.5" />
                {testing ? 'Testing...' : 'Test'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="mr-2 h-3.5 w-3.5" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-[#0033A0] hover:bg-[#001F6B]"
              asChild
            >
              <a href="/api/auth/google">
                <Link2 className="mr-2 h-3.5 w-3.5" />
                Connect Google Calendar
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
