import { Inter, Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

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
        {/* Professional toast notifications */}
        <Toaster
          position="top-right"
          gutter={10}
          containerStyle={{ top: 16, right: 16 }}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '14px',
              padding: '14px 18px',
              fontSize: '13.5px',
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12)',
              maxWidth: '380px',
              lineHeight: 1.5,
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#1e293b' },
              style: { borderLeft: '3px solid #34d399' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#1e293b' },
              style: { borderLeft: '3px solid #f87171' },
              duration: 4500,
            },
            loading: {
              iconTheme: { primary: '#60a5fa', secondary: '#1e293b' },
              style: { borderLeft: '3px solid #60a5fa' },
            },
          }}
        />
        {/* The {children} prop is where your pages will be rendered */}
        {children}
      </body>
    </html>
  )
}
