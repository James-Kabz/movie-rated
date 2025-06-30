"use client";

import {HeroUIProvider} from '@heroui/react'
import { SessionProvider } from 'next-auth/react';
import {ThemeProvider as NextThemesProvider} from "next-themes";

export function Providers({children, session}: { children: React.ReactNode, session: any }) {
  return (
    <HeroUIProvider>
      <SessionProvider session={session}>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
      </NextThemesProvider>
      </SessionProvider>
    </HeroUIProvider>
  )
}