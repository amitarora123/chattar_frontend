import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Chattar – Real-Time Messaging Made Simple',
  description:
    'Chattar is a fast, secure real-time messaging platform built for seamless and meaningful conversations.',

  keywords: [
    'Chattar',
    'chat app',
    'real-time messaging',
    'secure chat',
    'instant messaging',
    'online chat platform',
  ],

  authors: [{ name: 'Your Name' }],

  creator: 'Chattar',
  applicationName: 'Chattar',

  metadataBase: new URL('https://yourdomain.com'),

  openGraph: {
    title: 'Chattar – Real-Time Messaging',
    description:
      'Fast, secure, and beautifully designed messaging for modern conversations.',
    url: 'https://yourdomain.com',
    siteName: 'Chattar',
    images: [
      {
        url: '/og-image.png', // put inside public folder
        width: 1200,
        height: 630,
        alt: 'Chattar Messaging App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Chattar – Real-Time Messaging',
    description:
      'Chat smarter. Stay connected. Experience modern real-time messaging.',
    images: ['/og-image.png'],
  },

  icons: {
    icon: [{ url: '/favicon.svg' }],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
