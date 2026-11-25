import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";
export const metadata = {
    title: "ScholarShield — Scholarship Scam Detection and Verification Portal",
    description: "Protect students from fake grants and advance-fee fraud with ScholarShield. Real-time domain verification, payment demand detection, fake organization inspection, and content similarity analysis.",
    keywords: [
        "scholarship scam detector",
        "scholarship verification",
        "advance fee fraud",
        "student grant safety",
        "educational aid check",
    ],
    authors: [{ name: "ScholarShield Academic Team" }],
};
export default function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark"/>
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>);
}
