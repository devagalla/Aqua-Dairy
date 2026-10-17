import '../styles/globals.css'

export const metadata = {
  title: 'Aqua Diary',
  description: 'Digital Shrimp Farm Diary',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.aquadairy.xyz',
  ),
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
