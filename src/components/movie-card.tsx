"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { StarIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react"
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
    try {
      if (isInWatchlist && onRemoveFromWatchlist) {
        await onRemoveFromWatchlist(movie.id)
        toast.success("Removed from watchlist", {
          description: `${getTitle()} removed from your watchlist.`,
        })
      } else if (onAddToWatchlist) {
        await onAddToWatchlist(movie.id, sendEmail)
        // Toast is handled in the parent component
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
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
        stars.push(<StarIcon key={i} className="h-4 w-4 text-warning" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-warning" />)
      } else {
        stars.push(<StarOutlineIcon key={i} className="h-4 w-4 text-default-300" />)
      }
    }
    return stars
  }

  return (
    <Card className="w-full h-full hover:scale-105 transition-transform duration-300">
      <CardBody className="p-0 relative">
        <Link href={getDetailUrl()}>
          <Image
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder-movie.jpg"}
            alt={`${getTitle()} poster - ${getMediaType()} from ${getYear()}`}
            width={500}
            height={750}
            className="w-full h-64 object-cover"
          />
        </Link>

        {session && movie.media_type !== "person" && (
          <div className="absolute top-2 right-2 z-10">
            {isInWatchlist ? (
              <Button
                isIconOnly
                color="success"
                variant="shadow"
                size="sm"
                onClick={() => handleWatchlistAction()}
                isLoading={isLoading}
                aria-label={`Remove ${getTitle()} from watchlist`}
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    color="primary"
                    variant="shadow"
                    size="sm"
                    isLoading={isLoading}
                    aria-label={`Add ${getTitle()} to watchlist`}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Add to watchlist options">
                  <DropdownItem key="add-with-email" onClick={() => handleWatchlistAction(true)} startContent="📧">
                    Add + Send Email
                  </DropdownItem>
                  <DropdownItem key="add-only" onClick={() => handleWatchlistAction(false)} startContent="➕">
                    Add to Watchlist
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        )}
      </CardBody>

      <CardFooter className="flex flex-col items-start gap-2 p-4">
        <Link href={getDetailUrl()}>
          <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">{getTitle()}</h3>
        </Link>

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            {movie.vote_average !== undefined && (
              <>
                {renderStars(movie.vote_average)}
                <span className="text-sm text-default-500 ml-1">({movie.vote_average.toFixed(1)})</span>
              </>
            )}
          </div>
          <div className="flex gap-1">
            <Chip size="sm" variant="flat">
              {getYear()}
            </Chip>
            {movie.media_type && (
              <Chip size="sm" variant="flat" color="secondary">
                {movie.media_type === "tv" ? "TV" : movie.media_type === "movie" ? "Movie" : "Person"}
              </Chip>
            )}
          </div>
        </div>

        {movie.overview && <p className="text-default-600 text-sm line-clamp-3">{movie.overview}</p>}
      </CardFooter>
    </Card>
  )
}
