import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NuovaSolution Inbox',
  description: 'Operator WhatsApp inbox',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-wa-panel">{children}</body>
    </html>
  )
}
