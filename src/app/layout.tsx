import "./globals.css";

export const metadata = { title: "Mars Survival", description: "NASA Exercise" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="bg-[#0a0a0a]"> 
      <body className="bg-[#0a0a0a] antialiased">
        {children}
      </body>
    </html>
  );
}

export const viewport = {
  themeColor: '#0a0a0a', 
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
};