import './globals.css'

export const metadata = {
  title: 'Al Lith Referral',
  description: 'Al Lith Referral System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        {/* HEADER */}
        <div className="app-header">
          <img
            src="/logo.png"
            alt="Al Lith Hospital"
            className="header-logo"
          />

          <div className="header-ar">
            مستشفى الليث
          </div>

          <div className="header-en">
            Al-Lith Hospital
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="app-container">
          {children}
        </div>

      </body>
    </html>
  )
}
