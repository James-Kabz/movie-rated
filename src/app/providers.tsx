"use client"

import type React from "react"

import { HeroUIProvider, ToastProvider } from "@heroui/react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function Providers({ children, session }: { children: React.ReactNode; session: any }) {
  return (
    <SessionProvider session={session}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={true}
        disableTransitionOnChange={false}
        storageKey="movie-tracker-theme"
      >
        <HeroUIProvider>
          <ToastProvider
            toastProps={{
              radius: "full",
              color: "primary",
              variant: "flat",
              timeout: 1000,
              hideIcon: true,
              classNames: {
                closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
              },
            }}
          />
          {children}
        </HeroUIProvider>
      </NextThemesProvider>
    </SessionProvider>
  )
}
