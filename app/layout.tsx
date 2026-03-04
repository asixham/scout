import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Dela_Gothic_One } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const delaGothic = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: 'Scout - Find Tech Jobs & Internships',
  icons: {
    icon: [
      {
        url: '/favicon/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/favicon/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        url: '/favicon/android-chrome-192x192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        url: '/favicon/android-chrome-512x512.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
    apple: '/favicon/apple-touch-icon.png',
    other: [
      {
        rel: 'manifest',
        url: '/favicon/site.webmanifest',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#16142a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${delaGothic.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
