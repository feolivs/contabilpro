import { Inter } from 'next/font/google'

import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.className} min-h-screen bg-background`}>{children}</div>
}
