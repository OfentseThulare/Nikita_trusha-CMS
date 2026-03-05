import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

interface BookingEmailData {
  client_name: string
  client_email: string
  client_phone: string | null
  booking_date: string
  start_time: string
  end_time: string
  inquiry_type: string | null
  notes: string | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

/**
 * Send confirmation email to the prospect who booked.
 */
export async function sendProspectConfirmation(booking: BookingEmailData) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  return getResend().emails.send({
    from: `Nikita Naidoo Financial Advisory <${from}>`,
    to: booking.client_email,
    subject: 'Booking Confirmation — Nikita Naidoo Financial Advisory',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #0033A0, #001F6B); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Booking Confirmed</h1>
        </div>
        <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${booking.client_name},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for booking a consultation. Here are your booking details:
          </p>
          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Date</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formatDate(booking.booking_date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}</td>
              </tr>
              ${booking.inquiry_type ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Inquiry</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${booking.inquiry_type}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Nikita will be in touch shortly to confirm your appointment and share meeting details.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            If you need to make any changes, please reply to this email or contact Nikita directly.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; text-align: center;">
            Nikita Naidoo — Sanlam Financial Adviser<br/>
            FSP 3780 | Sanlam Life Insurance Limited
          </p>
        </div>
      </div>
    `,
  })
}

/**
 * Send notification email to Nikita about a new booking.
 */
export async function sendNikitaNotification(booking: BookingEmailData) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  const nikitaEmail = process.env.NIKITA_EMAIL || 'nikita.naidoo@sanlam4u.co.za'

  return getResend().emails.send({
    from: `Nikita Naidoo CMS <${from}>`,
    to: nikitaEmail,
    subject: `New Booking: ${booking.client_name} — ${formatDate(booking.booking_date)}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #0033A0, #001F6B); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Website Booking</h1>
        </div>
        <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi Nikita, you've got a new booking from your website.
          </p>

          <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Client</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${booking.client_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Email</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                  <a href="mailto:${booking.client_email}" style="color: #0033A0;">${booking.client_email}</a>
                </td>
              </tr>
              ${booking.client_phone ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Phone</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                  <a href="tel:${booking.client_phone}" style="color: #0033A0;">${booking.client_phone}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Date</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formatDate(booking.booking_date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}</td>
              </tr>
              ${booking.inquiry_type ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Inquiry</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${booking.inquiry_type}</td>
              </tr>
              ` : ''}
              ${booking.notes ? `
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; vertical-align: top;">Notes</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${booking.notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Please check your CMS to confirm details and book via Google Meet locally on your PC.
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://nikita-trusha-cms.vercel.app/admin/bookings"
               style="display: inline-block; background: #0033A0; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View in CMS
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; text-align: center;">
            This is an automated notification from your website CMS.
          </p>
        </div>
      </div>
    `,
  })
}
