import "./globals.css";
export const metadata = { title: "Mars Survival", description: "NASA Exercise" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}