import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PostStatusBadge } from '@/components/posts/post-status-badge'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { isGoogleConnected } from '@/lib/google/calendar'
import { FileText, BookOpen, Calendar, Plus, CheckCircle, XCircle } from 'lucide-react'
import type { Post, Booking } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: recentPosts },
    { data: upcomingBookings },
    { count: publishedCount },
    { count: monthlyBookingsCount },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, status, published_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('bookings')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .gte('booking_date', new Date().toISOString().split('T')[0])
      .order('booking_date', { ascending: true })
      .limit(5),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('booking_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
  ])

  const googleConnected = await isGoogleConnected()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button size="sm" className="bg-[#0033A0] hover:bg-[#001F6B]" asChild>
            <Link href="/admin/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published Posts</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{publishedCount ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FB]">
                <FileText className="h-5 w-5 text-[#0033A0]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bookings This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{monthlyBookingsCount ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FB]">
                <BookOpen className="h-5 w-5 text-[#0033A0]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Google Calendar</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {googleConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Not connected</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FB]">
                <Calendar className="h-5 w-5 text-[#0033A0]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Posts</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#0033A0] hover:text-[#001F6B]">
              <Link href="/admin/posts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(recentPosts ?? []).length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500 mb-3">No posts yet</p>
                <Button size="sm" className="bg-[#0033A0] hover:bg-[#001F6B]" asChild>
                  <Link href="/admin/posts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create first post
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(recentPosts ?? []).map(post => (
                  <div key={post.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-sm font-medium text-gray-900 hover:text-[#0033A0] truncate block"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-gray-400">{formatDate(post.updated_at)}</p>
                    </div>
                    <PostStatusBadge status={(post as unknown as Post).status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-[#0033A0] hover:text-[#001F6B]">
              <Link href="/admin/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(upcomingBookings ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No upcoming bookings</p>
            ) : (
              <div className="space-y-3">
                {(upcomingBookings ?? []).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(booking as unknown as Booking).client_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate((booking as unknown as Booking).booking_date)} · {formatTime((booking as unknown as Booking).start_time)}
                      </p>
                    </div>
                    <BookingStatusBadge status={(booking as unknown as Booking).status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!googleConnected && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Google Calendar not connected</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Connect your Google account to auto-generate Meet links when you confirm bookings.{' '}
              <Link href="/admin/calendar" className="font-medium underline">
                Set up now
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
