import { Inter } from 'next/font/google'

import '../../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900`}
    >
      <div className='max-w-md w-full space-y-8 p-8'>{children}</div>
    </div>
  )
}
