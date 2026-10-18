import '../styles/globals.css'

export const metadata = {
  title: 'Aqua Dairy',
  description: 'A thoughtful farm journal for healthier shrimp ponds.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.aquadairy.xyz',
  ),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
