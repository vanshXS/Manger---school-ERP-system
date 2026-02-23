import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-mono'
})

export const metadata = {
  title: 'Manger: Virtual Manager of School',
  description: 'The complete school management system.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-background`}>
        {/* Wrap entire app with AuthProvider for secure authentication */}
        <AuthProvider>
          {/* This component allows toast notifications to work anywhere in the app */}
          <Toaster position="top-center" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '14px 18px' } }} />
          {/* The {children} prop is where your pages will be rendered */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
