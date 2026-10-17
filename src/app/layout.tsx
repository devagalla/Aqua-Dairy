import '../styles/globals.css'

export const metadata = {
  title: 'Aqua Diary',
  description: 'Digital Shrimp Farm Diary',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
