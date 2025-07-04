"use client"

import type React from "react"
import { Fragment, useRef, useEffect } from "react"
import { Disclosure, Menu, Transition } from "@headlessui/react"
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline"
import { useSession, signIn, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { SearchSuggestions } from "./search-suggestions"

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export function Navigation() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [watchlistCount, setWatchlistCount] = useState(0)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch watchlist count when user is logged in
  useEffect(() => {
    if (session) {
      fetchWatchlistCount()
    } else {
      setWatchlistCount(0)
    }
  }, [session])

  const fetchWatchlistCount = async () => {
    try {
      const response = await fetch("/api/watchlist")
      if (response.ok) {
        const data = await response.json()
        setWatchlistCount(data.length)
      }
    } catch (error) {
      console.error("Error fetching watchlist count:", error)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSuggestions(value.trim().length >= 2)
  }

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(true)
    }
  }

  const closeSuggestions = () => {
    setShowSuggestions(false)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navigation = [
    { name: "Home", href: "/", current: false },
    { name: "Movies", href: "/movies", current: false },
    { name: "TV Shows", href: "/tv", current: false },
    { name: "Top Rated", href: "/movies?category=top_rated", current: false },
    { name: "Now Playing", href: "/movies?category=now_playing", current: false },
  ]

  if (!mounted) {
    return (
      <Disclosure as="nav" className="nav-bg">
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-shrink-0 items-center">
              <Image src={"/favicon.ico"} alt="Movie Rated" width={32} height={32} className="rounded-full" />
              <span className="hidden sm:block text-xl font-bold text-blue-600 ml-2">Movie Rated</span>
            </div>
          </div>
        </div>
      </Disclosure>
    )
  }

  return (
    <Disclosure as="nav" className="nav-bg">
      {({ open }) => (
        <>
          <div className="mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={"/favicon.ico"}
                      alt="Movie Rated"
                      width={32}
                      height={32}
                      className="rounded-full ml-10 sm:ml-0"
                    />
                    <Link href="/" className="hidden sm:block text-xl font-bold text-blue-600 dark:text-blue-400">
                      Movie Rated
                    </Link>
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-gray-900 dark:bg-gray-700"
                            : "hover:bg-gray-500 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Search */}
              <div className="hidden sm:flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
                <div className="max-w-lg w-full lg:max-w-xs relative" ref={searchRef}>
                  <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    </div>
                    <input
                      className="search-input block w-full pl-10 pr-3 py-2 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                      placeholder="Search movies, TV shows, people..."
                      type="search"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onFocus={handleSearchFocus}
                    />
                  </form>

                  <SearchSuggestions query={searchQuery} onSelect={closeSuggestions} isVisible={showSuggestions} />
                </div>
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <SunIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <MoonIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                {session ? (
                  <>
                    <Link
                      href="/watchlist"
                      className="hidden sm:flex items-center gap-1 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      My Watchlist
                      {watchlistCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {watchlistCount}
                        </span>
                      )}
                    </Link>
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Open user menu</span>
                          <Image
                            className="h-8 w-8 rounded-full"
                            src={session.user?.image || "/default-avatar.png"}
                            alt=""
                            width={32}
                            height={32}
                          />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={classNames(
                                  active ? "bg-gray-100 dark:bg-gray-600" : "",
                                  "block px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                                )}
                              >
                                Your Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/watchlist"
                                className={classNames(
                                  active ? "bg-gray-100 dark:bg-gray-600" : "",
                                  "flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 sm:hidden",
                                )}
                              >
                                <span>My Watchlist</span>
                                {watchlistCount > 0 && (
                                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                    {watchlistCount}
                                  </span>
                                )}
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => signOut()}
                                className={classNames(
                                  active ? "bg-gray-100 dark:bg-gray-600" : "",
                                  "block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </>
                ) : (
                  <button
                    onClick={() => signIn("google")}
                    className="btn-primary px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            {/* Mobile Search - Moved to top of mobile menu */}
            <div className="px-2 pt-2 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative" ref={mobileSearchRef}>
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  </div>
                  <input
                    className="search-input block w-full pl-10 pr-3 py-3 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Search movies, TV shows, people..."
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchFocus}
                  />
                </form>

                <SearchSuggestions query={searchQuery} onSelect={closeSuggestions} isVisible={showSuggestions} />
              </div>
            </div>

            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-gray-900 dark:bg-gray-700"
                      : "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium transition-colors duration-200",
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}

              <Disclosure.Button
                as="button"
                onClick={toggleTheme}
                className="w-full flex items-center text-left rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
              >
                {theme === "dark" ? (
                  <>
                    <SunIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Dark Mode
                  </>
                )}
              </Disclosure.Button>

              {session && (
                <Disclosure.Button
                  as={Link}
                  href="/watchlist"
                  className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
                >
                  <span>My Watchlist</span>
                  {watchlistCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {watchlistCount}
                    </span>
                  )}
                </Disclosure.Button>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
