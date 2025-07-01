"use client"

import { useEffect, useState } from "react"
import { MovieCard } from "@/components/movie-card"
import type { Movie } from "@/lib/tmdb"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const { data: session } = useSession()
  const [movies, setMovies] = useState<Movie[]>([])
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMovies()
    if (session) {
      fetchWatchlist()
    }
  }, [session])

  const fetchMovies = async () => {
    try {
      const response = await fetch("/api/movies?category=popular")
      const data = await response.json()
      setMovies(data.results || [])
    } catch (error) {
      console.error("Error fetching movies:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWatchlist = async () => {
    try {
      const response = await fetch("/api/watchlist")
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
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error)
    }
  }

  if (loading) {
    return (
      <div className="">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-96"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Popular Movies</h1>
          <p className="">Discover the most popular movies right now</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isInWatchlist={watchlist.includes(movie.id)}
              onAddToWatchlist={handleAddToWatchlist}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
