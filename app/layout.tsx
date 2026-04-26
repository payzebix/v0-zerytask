import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ZeryTask - Complete Tasks, Earn Rewards, Grow with Web3',
  description: 'ZeryTask helps users discover valuable missions, complete community tasks, earn rewards, and access early opportunities in the Web3 ecosystem.',
  generator: 'v0.app',
  openGraph: {
    title: 'ZeryTask - Complete Tasks, Earn Rewards, Grow with Web3',
    description: 'Join the waitlist for the Web3 productivity platform. Complete missions, earn rewards, and grow with your community.',
    type: 'website',
    url: 'https://zerytask.com',
    images: [
      {
        url: '/logo-zerytask.png',
        width: 400,
        height: 400,
        alt: 'ZeryTask Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZeryTask - Complete Tasks, Earn Rewards, Grow with Web3',
    description: 'Join the waitlist for the ultimate Web3 productivity platform',
    creator: '@ZeryTask',
    images: ['/logo-zerytask.png'],
  },
  icons: {
    icon: '/logo-zerytask.png',
    apple: '/logo-zerytask.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-slate-950 scroll-smooth">
      <body className={`font-sans antialiased bg-slate-950 text-white`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
