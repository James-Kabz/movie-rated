"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { StarIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { useSession } from "next-auth/react"
import type { Movie } from "@/lib/tmdb"

interface MovieCardProps {
  movie: Movie
  isInWatchlist?: boolean
  onAddToWatchlist?: (movieId: number, sendEmail: boolean) => void
  onRemoveFromWatchlist?: (movieId: number) => void
}

export function MovieCard({ movie, isInWatchlist = false, onAddToWatchlist, onRemoveFromWatchlist }: MovieCardProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailOption, setShowEmailOption] = useState(false)

  const handleWatchlistAction = async (sendEmail = false) => {
    if (!session) return

    setIsLoading(true)
    try {
      if (isInWatchlist && onRemoveFromWatchlist) {
        await onRemoveFromWatchlist(movie.id)
      } else if (onAddToWatchlist) {
        await onAddToWatchlist(movie.id, sendEmail)
      }
    } finally {
      setIsLoading(false)
      setShowEmailOption(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 >= 1

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} className="h-4 w-4 rating-star" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} className="h-4 w-4 rating-star" />)
      } else {
        stars.push(<StarOutlineIcon key={i} className="h-4 w-4 rating-star-empty" />)
      }
    }
    return stars
  }

  return (
    <div className="movie-card rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <Link href={`/movies/${movie.id}`}>
          <Image
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder-movie.jpg"}
            alt={movie.title}
            width={500}
            height={750}
            className="w-full h-64 object-cover movie-poster hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {session && (
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
              >
                {isInWatchlist ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
              </button>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2">
                <button
                  onClick={() => handleWatchlistAction(true)}
                  disabled={isLoading}
                  className="w-full text-xs btn-primary px-3 py-1 rounded"
                >
                  Add + Email
                </button>
                <button
                  onClick={() => handleWatchlistAction(false)}
                  disabled={isLoading}
                  className="w-full text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                >
                  Add Only
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
        <Link href={`/movies/${movie.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
            {movie.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            {renderStars(movie.vote_average)}
            <span className="text-sm ml-1">({movie.vote_average.toFixed(1)})</span>
          </div>
          <span className="text-sm px-2 py-1 rounded-full">
            {movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA"}
          </span>
        </div>

        <p className="text-sm line-clamp-3">{movie.overview}</p>
      </div>
    </div>
  )
}
