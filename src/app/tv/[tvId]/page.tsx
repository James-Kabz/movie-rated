"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { StarIcon, CalendarIcon, TvIcon } from "@heroicons/react/24/solid"
import { useSession } from "next-auth/react"
import { Button, Chip, Skeleton, Card, CardBody } from "@heroui/react"
import { MovieCard } from "@/components/movie-card"
import { toast } from "sonner"

interface TVShowData {
  tv: any
  credits: any
  recommendations: { results: any[] }
}

export default function TVShowDetailPage() {
  const { tvId } = useParams()
  const { data: session } = useSession()
  const [tvData, setTvData] = useState<TVShowData | null>(null)
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tvId) {
      fetchTVData()
    }
    if (session) {
      fetchWatchlist()
    }
  }, [tvId, session])

  useEffect(() => {
    if (tvData?.tv && session && tvId) {
      trackRecentlyViewed(Number(tvId), "tv")
    }
  }, [tvData, session, tvId])

  const trackRecentlyViewed = async (movieId: number, mediaType: string) => {
    try {
      await fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, mediaType }),
      })
    } catch (error) {
      console.error("Error tracking recently viewed:", error)
    }
  }

  const fetchTVData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/tv/${tvId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTvData(data)
    } catch (error) {
      console.error("Error fetching TV show data:", error)
      setError("Failed to load TV show details. Please try again later.")
      toast.error("Error fetching TV show details", {
        description: error instanceof Error ? error.message : "Failed to fetch TV show details.",
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

  const handleAddToWatchlist = async (tvId: number, sendEmail: boolean) => {
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: tvId,
          mediaType: "tv",
          sendEmail,
        }),
      })

      if (response.ok) {
        setWatchlist([...watchlist, tvId])
        toast.success("TV show added to watchlist!", {
          description: "TV show added to your watchlist!",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add to watchlist")
      }
    } catch (error) {
      toast.error("Error adding to watchlist", {
        description: error instanceof Error ? error.message : "Failed to add TV show to watchlist.",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 z-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row gap-8 py-8">
              <div className="flex-shrink-0">
                <Skeleton className="rounded-lg w-[300px] h-[450px]" />
              </div>
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-6 w-1/2 rounded-lg" />
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-lg" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-5/6 rounded-lg" />
                  <Skeleton className="h-4 w-4/6 rounded-lg" />
                </div>
                <div className="pt-4 flex gap-3">
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-36 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tvData?.tv) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-md mx-auto">
          <CardBody className="text-center py-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">{error || "TV show not found"}</h1>
            <Button color="primary" onPress={fetchTVData} className="mt-4">
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  const { tv, credits, recommendations } = tvData
  const creator = tv.created_by?.[0]
  const mainCast = credits?.cast?.slice(0, 8) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-8">
          {tv?.backdrop_path && (
            <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
              <Image
                src={`https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`}
                alt={tv.name || "TV show backdrop"}
                fill
                className="object-cover opacity-20"
                priority
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col md:flex-row gap-8 py-8">
            <div className="flex-shrink-0">
              <Image
                src={tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : "/placeholder-movie.jpg"}
                alt={tv.name || "TV show poster"}
                width={300}
                height={450}
                className="rounded-lg shadow-lg"
                priority
              />
            </div>

            <div className="flex-1 space-y-4">
              <h1 className="text-4xl font-bold text-foreground">{tv.name}</h1>

              {tv.tagline && <p className="text-lg text-default-600 italic">"{tv.tagline}"</p>}

              <div className="flex items-center space-x-6 text-sm text-default-600">
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-5 w-5 text-warning" />
                  <span className="font-semibold">{tv.vote_average?.toFixed(1)}</span>
                  <span>({tv.vote_count?.toLocaleString()} votes)</span>
                </div>

                {tv.first_air_date && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-5 w-5" />
                    <span>{new Date(tv.first_air_date).getFullYear()}</span>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <TvIcon className="h-5 w-5" />
                  <span>
                    {tv.number_of_seasons} Season{tv.number_of_seasons !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {tv.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tv.genres.map((genre: any) => (
                    <Chip key={genre.id} color="primary" variant="flat" size="sm">
                      {genre.name}
                    </Chip>
                  ))}
                </div>
              )}

              {tv.overview && <p className="text-default-700 leading-relaxed">{tv.overview}</p>}

              {creator && (
                <p className="text-sm text-default-600">
                  <span className="font-semibold">Creator:</span> {creator.name}
                </p>
              )}

              {session && (
                <div className="pt-4 flex gap-3">
                  <Button
                    className="px-4 py-2 rounded-lg text-lg font-bold"
                    color={watchlist.includes(tv.id) ? "success" : "secondary"}
                    variant={watchlist.includes(tv.id) ? "flat" : "solid"}
                    onPress={() => handleAddToWatchlist(tv.id, false)}
                    disabled={watchlist.includes(tv.id)}
                    size="lg"
                  >
                    {watchlist.includes(tv.id) ? "✓ In Watchlist" : "Add to Watchlist"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cast Section */}
        {mainCast.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Cast</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {mainCast.map((actor: any) => (
                <Card key={actor.id} className="text-center">
                  <CardBody className="p-3">
                    <Image
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : "/placeholder-person.jpg"
                      }
                      alt={actor.name || "Actor"}
                      width={185}
                      height={278}
                      className="rounded-lg mb-2 w-full h-32 object-cover"
                    />
                    <h3 className="font-semibold text-sm text-foreground">{actor.name}</h3>
                    <p className="text-xs text-default-600">{actor.character}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations?.results?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recommendations.results.slice(0, 10).map((show: any) => (
                <MovieCard
                  key={show.id}
                  movie={{ ...show, media_type: "tv" }}
                  isInWatchlist={watchlist.includes(show.id)}
                  onAddToWatchlist={(id, email) => handleAddToWatchlist(id, email)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
