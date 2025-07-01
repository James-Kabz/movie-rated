"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MovieCard } from "@/components/movie-card"
import { Button, Tabs, Tab, Pagination, Skeleton } from "@heroui/react"
import { toast } from "sonner"
import type { Movie } from "@/lib/tmdb"
import { useSession } from "next-auth/react"

export default function MoviesPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [movies, setMovies] = useState<Movie[]>([])
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "popular")

  const categories = [
    { key: "popular", label: "Popular", description: "Most popular movies right now" },
    { key: "top_rated", label: "Top Rated", description: "Highest rated movies of all time" },
    { key: "now_playing", label: "Now Playing", description: "Currently playing in theaters" },
    { key: "upcoming", label: "Upcoming", description: "Coming soon to theaters" },
  ]

  useEffect(() => {
    const category = searchParams.get("category") || "popular"
    const page = Number.parseInt(searchParams.get("page") || "1")
    setActiveCategory(category)
    setCurrentPage(page)
    fetchMovies(category, page)
  }, [searchParams])

  useEffect(() => {
    if (session) {
      fetchWatchlist()
    }
  }, [session])

  const fetchMovies = async (category: string, page: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/movies?category=${category}&page=${page}`)

      if (!response.ok) {
        throw new Error("Failed to fetch movies")
      }

      const data = await response.json()
      setMovies(data.results || [])
      setTotalPages(Math.min(data.total_pages || 1, 500)) // TMDB limits to 500 pages
      setTotalResults(data.total_results || 0)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching movies:", error)
      setError("Failed to load movies")
      toast.error("Error fetching movies", {
        description: "Failed to load movies. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWatchlist = async () => {
    try {
      const response = await fetch("/api/watchlist")
      if (!response.ok) return
      const data = await response.json()
      setWatchlist(data.map((item: any) => item.movieId))
    } catch (error) {
      console.error("Error fetching watchlist:", error)
    }
  }

  const handleAddToWatchlist = async (movieId: number, sendEmail: boolean) => {
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, sendEmail }),
      })

      if (response.ok) {
        setWatchlist([...watchlist, movieId])
        const movie = movies.find((m) => m.id === movieId)
        toast.success("Movie added to watchlist!", {
          description: `${movie?.title || movie?.title || "Movie"} ${sendEmail ? "added and email sent!" : "added to your watchlist!"}`,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add to watchlist")
      }
    } catch (error) {
      toast.error("Error adding to watchlist", {
        description: error instanceof Error ? error.message : "Failed to add movie to watchlist.",
      })
    }
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setCurrentPage(1)
    fetchMovies(category, 1)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set("category", category)
    url.searchParams.delete("page") // Remove page when changing category
    window.history.pushState({}, "", url.toString())
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchMovies(activeCategory, page)
    // Update URL with new page
    const url = new URL(window.location.href)
    url.searchParams.set("page", page.toString())
    window.history.pushState({}, "", url.toString())
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const currentCategoryInfo = categories.find((cat) => cat.key === activeCategory)

  // Render skeleton cards while loading
  const renderSkeletonCards = () => (
    <>
      {[...Array(20)].map((_, i) => (
        <div key={`skeleton-${i}`} className="bg-gray-700 rounded-lg overflow-hidden">
          <div className="relative">
            <Skeleton className="w-full h-64 rounded-none" />
          </div>
          <div className="p-4">
            <Skeleton className="h-6 w-3/4 rounded-lg mb-2" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-4/6 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </>
  )

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h2>
            <p className="text-default-600 mb-6">{error}</p>
            <Button color="primary" onClick={() => fetchMovies(activeCategory, currentPage)}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {loading ? (
            <>
              <Skeleton className="h-10 w-1/4 rounded-lg mb-2" />
              <Skeleton className="h-6 w-1/2 rounded-lg" />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-2">Movies</h1>
              <p className="text-default-600 text-lg">{currentCategoryInfo?.description}</p>
              {totalResults > 0 && (
                <p className="text-sm text-default-500 mt-2">
                  Showing page {currentPage} of {totalPages} ({totalResults.toLocaleString()} total results)
                </p>
              )}
            </>
          )}
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          {loading ? (
            <div className="flex gap-6 border-b border-divider pb-3">
              {categories.map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <Tabs
              selectedKey={activeCategory}
              onSelectionChange={(key) => handleCategoryChange(key as string)}
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
              }}
            >
              {categories.map((category) => (
                <Tab key={category.key} title={category.label} />
              ))}
            </Tabs>
          )}
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {loading
            ? renderSkeletonCards()
            : movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isInWatchlist={watchlist.includes(movie.id)}
                  onAddToWatchlist={handleAddToWatchlist}
                />
              ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex flex-col items-center gap-4">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              showControls
              showShadow
              color="primary"
              size="lg"
              classNames={{
                wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
                item: "w-8 h-8 text-small rounded-none bg-transparent",
                cursor:
                  "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
              }}
            />
            <p className="text-sm text-default-500">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
