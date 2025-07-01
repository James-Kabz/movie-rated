"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MovieCard } from "@/components/movie-card"
import { Button, Spinner, Tabs, Tab, Pagination, Skeleton, Card, CardBody } from "@heroui/react"
import { toast } from "sonner"
import type { Movie } from "@/lib/tmdb"
import { useSession } from "next-auth/react"

export default function MoviesPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [movies, setMovies] = useState<Movie[]>([])
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "popular")

  const categories = [
    { key: "popular", label: "Popular", description: "Most popular movies right now" },
    { key: "top_rated", label: "Top Rated", description: "Highest rated movies of all time" },
    { key: "now_playing", label: "Now Playing", description: "Currently playing in theaters" },
    { key: "upcoming", label: "Upcoming", description: "Coming soon to theaters" },
  ]

  useEffect(() => {
    const category = searchParams.get("category") || "popular"
    setActiveCategory(category)
    setCurrentPage(1)
    fetchMovies(category, 1)
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
          description: `${movie?.title || "Movie"} ${sendEmail ? "added and email sent!" : "added to your watchlist!"}`,
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
    window.history.pushState({}, "", url.toString())
  }

  const handlePageChange = (page: number) => {
    fetchMovies(activeCategory, page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const currentCategoryInfo = categories.find((cat) => cat.key === activeCategory)

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-1/4 rounded-lg mb-2" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
          </div>

          {/* Tabs Skeleton */}
          <div className="mb-8 flex gap-6">
            {categories.map((_, i) => (
              <Skeleton key={i} className="h-12 w-24 rounded-lg" />
            ))}
          </div>

          {/* Movies Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {[...Array(20)].map((_, i) => (
              <Card key={i} className="h-full">
                <CardBody className="p-0">
                  <Skeleton className="rounded-lg w-full aspect-[2/3]" />
                  <div className="p-3">
                    <Skeleton className="h-5 w-3/4 rounded-lg mb-2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16 rounded-lg" />
                      <Skeleton className="h-4 w-10 rounded-lg" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Movies</h1>
          <p className="text-default-600 text-lg">{currentCategoryInfo?.description}</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
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
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isInWatchlist={watchlist.includes(movie.id)}
              onAddToWatchlist={handleAddToWatchlist}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              showControls
              showShadow
              color="primary"
            />
          </div>
        )}
      </div>
    </div>
  )
}