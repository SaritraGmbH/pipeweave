import { NavigationLoadingBar } from "@/components/NavigationLoadingBar";
import CookieConsent from "@/components/blocks/cookie-consent";
import MainLayout from "@/components/layouts/MainLayout";
import ModalProvider from "@/context/ModalProvider";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { ThemeProvider } from "next-themes";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    // If the locale is not supported, you can choose to redirect or show a 404 page
    console.error(`Locale not supported: ${locale}`);
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="GridExtract" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <script
          async
          defer
          crossOrigin="anonymous"
          src="https://accounts.google.com/gsi/client"
          type="module"
        />
      </head>

      <body className={`bg-white dark:bg-neutral-900 antialiased h-full overflow-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ModalProvider>
            <NextIntlClientProvider>
              <MainLayout>
                <NavigationLoadingBar />
                <Toaster
                  position="top-center"
                  toastOptions={{
                    className:
                      "max-w-sm dark:bg-neutral-900! bg-white! dark:text-neutral-200! text-neutral-900! border dark:border-neutral-700! border-neutral-200!",
                    classNames: {
                      success: "[&_svg]:text-green-500",
                      error: "[&_svg]:text-red-500",
                      warning: "[&_svg]:text-yellow-500",
                      info: "[&_svg]:text-blue-500",
                    },
                  }}
                />
                {children}
              </MainLayout>
              <CookieConsent />
            </NextIntlClientProvider>
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
