"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { StarIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type { Movie } from "@/lib/tmdb"

interface MovieCardProps {
  movie: Movie & {
    name?: string // For TV shows
    first_air_date?: string // For TV shows
    media_type?: "movie" | "tv" | "person"
  }
  isInWatchlist?: boolean
  onAddToWatchlist?: (movieId: number, sendEmail: boolean) => void
  onRemoveFromWatchlist?: (movieId: number) => void
}

export function MovieCard({ movie, isInWatchlist = false, onAddToWatchlist, onRemoveFromWatchlist }: MovieCardProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailOption, setShowEmailOption] = useState(false)

  // Helper functions to handle both movies and TV shows
  const getTitle = () => {
    return movie.title || movie.name || "Unknown Title"
  }

  const getReleaseDate = () => {
    return movie.release_date || movie.first_air_date || ""
  }

  const getYear = () => {
    const date = getReleaseDate()
    return date ? new Date(date).getFullYear() : "TBA"
  }

  const getDetailUrl = () => {
    if (movie.media_type === "tv" || (!movie.media_type && movie.name)) {
      return `/tv/${movie.id}`
    }
    return `/movies/${movie.id}`
  }

  const getMediaType = () => {
    if (movie.media_type === "tv" || (!movie.media_type && movie.name)) {
      return "TV Show"
    }
    return "Movie"
  }

  const handleWatchlistAction = async (sendEmail = false) => {
    if (!session) {
      toast.warning("Sign in required", {
        description: "Please sign in to add content to your watchlist.",
      })
      return
    }

    setIsLoading(true)
    setShowEmailOption(false)
    try {
      if (isInWatchlist && onRemoveFromWatchlist) {
        await onRemoveFromWatchlist(movie.id)
        toast.success("Removed from watchlist", {
          description: `${getTitle()} removed from your watchlist.`,
        })
      } else if (onAddToWatchlist) {
        await onAddToWatchlist(movie.id, sendEmail)
        // Toast is handled in the parent component
      } else {
        // Default watchlist action when no custom handler is provided
        const mediaType = movie.media_type === "tv" || (!movie.media_type && movie.name) ? "tv" : "movie"

        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: movie.id,
            mediaType,
            sendEmail,
          }),
        })

        if (response.ok) {
          toast.success(`${getMediaType()} added to watchlist!`, {
            description: `${getTitle()} ${sendEmail ? "added and email sent!" : "added to your watchlist!"}`,
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to add to watchlist")
        }
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 >= 1

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-warning rating-star" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-warning rating-star" />)
      } else {
        stars.push(<StarOutlineIcon key={i} className="h-4 w-4 rating-star-empty" />)
      }
    }
    return stars
  }

  return (
    <div className="movie-card rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <Link href={getDetailUrl()}>
          <Image
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder-movie.jpg"}
            alt={`${getTitle()} poster - ${getMediaType()} from ${getYear()}`}
            width={500}
            height={750}
            className="w-full h-64 object-cover movie-poster hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {session && movie.media_type !== "person" && (
          <div className="absolute top-2 right-2">
            {!showEmailOption ? (
              <button
                onClick={() => {
                  if (isInWatchlist) {
                    handleWatchlistAction()
                  } else {
                    setShowEmailOption(true)
                  }
                }}
                disabled={isLoading}
                className={`p-2 rounded-full shadow-lg transition-colors ${
                  isInWatchlist
                    ? "btn-success"
                    : "bg-white/90 hover:bg-white text-gray-700 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:text-gray-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={isInWatchlist ? `Remove ${getTitle()} from watchlist` : `Add ${getTitle()} to watchlist`}
              >
                {isInWatchlist ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
              </button>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2">
                {/* <button
                  onClick={() => handleWatchlistAction(true)}
                  disabled={isLoading}
                  className="w-full text-xs btn-primary px-3 py-1 rounded"
                >
                  Add + Email
                </button> */}
                <button
                  onClick={() => handleWatchlistAction(false)}
                  disabled={isLoading}
                  className="w-full text-xs btn-primary px-3 py-1 rounded"
                >
                  Add To Watchlist
                </button>
                <button
                  onClick={() => setShowEmailOption(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <Link href={getDetailUrl()}>
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
            {getTitle()}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            {movie.vote_average !== undefined && (
              <>
                {renderStars(movie.vote_average)}
                <span className="text-sm ml-1">({movie.vote_average.toFixed(1)})</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">{getYear()}</span>
            {movie.media_type && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {movie.media_type === "tv" ? "TV" : movie.media_type === "movie" ? "Movie" : "Person"}
              </span>
            )}
          </div>
        </div>

        {movie.overview && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{movie.overview}</p>}
      </div>
    </div>
  )
}
