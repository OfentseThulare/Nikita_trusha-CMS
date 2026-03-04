export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001F6B] via-[#0033A0] to-[#1A56DB] p-4">
      {children}
    </div>
  )
}
