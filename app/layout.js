import './globals.css'

export const metadata = {
  title: 'Al Lith Referral',
  description: 'Al Lith Referral System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
