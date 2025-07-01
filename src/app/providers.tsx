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
          {children}
        </HeroUIProvider>
      </NextThemesProvider>
    </SessionProvider>
  )
}
