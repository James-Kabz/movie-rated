"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { StarIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/solid"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button, Chip, Skeleton, Card, CardBody } from "@heroui/react"
import type { MovieDetails, Credits, Cast, Crew } from "@/lib/tmdb"
import { MovieCard } from "@/components/movie-card"

interface MovieData {
    movie: MovieDetails
    credits: Credits
    recommendations: { results: any[] }
}

interface WatchlistItem {
    movieId: number
    mediaType: string
}

export default function MovieDetailPage() {
    const { movieId } = useParams()
    const { data: session } = useSession()
    const [movieData, setMovieData] = useState<MovieData | null>(null)
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (movieId) {
            fetchMovieData()
        }
        if (session) {
            fetchWatchlist()
        }
    }, [movieId, session])

    const fetchMovieData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/movies/${movieId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Check if the data structure matches what we expect
            if (!data.movie && !data.movieDetails) {
                throw new Error("Invalid movie data structure");
            }

            // Normalize the data structure
            const normalizedData = {
                movie: data.movie || data.movieDetails,
                credits: data.credits,
                recommendations: data.recommendations
            };

            setMovieData(normalizedData);
        } catch (error) {
            console.error("Error fetching movie data:", error);
            setError("Failed to load movie details. Please try again later.");
            toast.error("Error fetching movie details", {
                description: error instanceof Error ? error.message : "Failed to fetch movie details.",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchWatchlist = async () => {
        try {
            const response = await fetch("/api/watchlist")
            if (!response.ok) {
                throw new Error("Failed to fetch watchlist")
            }
            const data = await response.json()
            setWatchlist(data.map((item: any) => ({ movieId: item.movieId, mediaType: item.mediaType })))
        } catch (error) {
            console.error("Error fetching watchlist:", error)
            toast.error("Error fetching watchlist", {
                description: "Failed to fetch your watchlist.",
            })
        }
    }

    const isInWatchlist = (movieId: number, mediaType = "movie") => {
        return watchlist.some((item) => item.movieId === movieId && item.mediaType === mediaType)
    }

    const handleAddToWatchlist = async (movieId: number, sendEmail: boolean) => {
        try {
            const response = await fetch("/api/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId, sendEmail, mediaType: "movie" }),
            })

            if (response.ok) {
                setWatchlist([...watchlist, { movieId, mediaType: "movie" }])
                toast.success("Movie added to watchlist!")
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to add to watchlist")
            }
        } catch (error) {
            console.error("Error adding to watchlist:", error)
            toast.error("Error adding to watchlist", {
                description: error instanceof Error ? error.message : "Failed to add movie to watchlist.",
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Hero Section Skeleton */}
                    <div className="relative mb-8">
                        {/* Backdrop Skeleton */}
                        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 py-8">
                            {/* Poster Skeleton */}
                            <div className="flex-shrink-0">
                                <Skeleton className="rounded-lg w-[300px] h-[450px]" />
                            </div>

                            {/* Content Skeleton */}
                            <div className="flex-1 space-y-4">
                                <Skeleton className="h-10 w-3/4 rounded-lg" />
                                <Skeleton className="h-6 w-1/2 rounded-lg" />

                                {/* Ratings/Info Skeleton */}
                                <div className="flex items-center space-x-6">
                                    <Skeleton className="h-5 w-24 rounded-lg" />
                                    <Skeleton className="h-5 w-20 rounded-lg" />
                                    <Skeleton className="h-5 w-16 rounded-lg" />
                                </div>

                                {/* Genres Skeleton */}
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-6 w-14 rounded-full" />
                                </div>

                                {/* Overview Skeleton */}
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full rounded-lg" />
                                    <Skeleton className="h-4 w-5/6 rounded-lg" />
                                    <Skeleton className="h-4 w-4/6 rounded-lg" />
                                    <Skeleton className="h-4 w-3/6 rounded-lg" />
                                </div>

                                {/* Director Skeleton */}
                                <Skeleton className="h-4 w-1/3 rounded-lg" />

                                {/* Buttons Skeleton */}
                                <div className="pt-4 flex gap-3">
                                    <Skeleton className="h-10 w-32 rounded-lg" />
                                    <Skeleton className="h-10 w-36 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cast Section Skeleton */}
                    <div className="mb-12">
                        <Skeleton className="h-8 w-32 rounded-lg mb-6" />
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="text-center">
                                    <CardBody className="p-3">
                                        <Skeleton className="rounded-lg w-full h-32 mb-2" />
                                        <Skeleton className="h-4 w-3/4 rounded-lg mx-auto mb-1" />
                                        <Skeleton className="h-3 w-1/2 rounded-lg mx-auto" />
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations Skeleton */}
                    <div>
                        <Skeleton className="h-8 w-48 rounded-lg mb-6" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="rounded-lg h-96" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !movieData?.movie) {
        return (
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <h1 className="text-2xl font-bold text-foreground mb-4">{error || "Movie not found"}</h1>
                        <Button color="primary" onPress={fetchMovieData} className="mt-4">
                            Try Again
                        </Button>
                    </CardBody>
                </Card>
            </div>
        )
    }

    const { movie, credits, recommendations } = movieData
    const director = credits?.crew?.find((person: Crew) => person.job === "Director")
    const mainCast = credits?.cast?.slice(0, 8) || []

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="relative mb-8">
                    {movie?.backdrop_path && (
                        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
                            <Image
                                src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                                alt={movie.title || "Movie backdrop"}
                                fill
                                className="object-cover opacity-20"
                                priority
                            />
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 py-8">
                        <div className="flex-shrink-0">
                            <Image
                                src={
                                    movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder-movie.jpg"
                                }
                                alt={movie.title || "Movie poster"}
                                width={300}
                                height={450}
                                className="rounded-lg shadow-lg"
                                priority
                            />
                        </div>

                        <div className="flex-1 space-y-4">
                            <h1 className="text-4xl font-bold text-foreground">{movie.title}</h1>

                            {movie.tagline && <p className="text-lg text-default-600 italic">"{movie.tagline}"</p>}

                            <div className="flex items-center space-x-6 text-sm text-default-600">
                                <div className="flex items-center space-x-1">
                                    <StarIcon className="h-5 w-5 text-warning" />
                                    <span className="font-semibold">{movie.vote_average?.toFixed(1)}</span>
                                    <span>({movie.vote_count?.toLocaleString()} votes)</span>
                                </div>

                                {movie.release_date && (
                                    <div className="flex items-center space-x-1">
                                        <CalendarIcon className="h-5 w-5" />
                                        <span>{new Date(movie.release_date).getFullYear()}</span>
                                    </div>
                                )}

                                {movie.runtime && (
                                    <div className="flex items-center space-x-1">
                                        <ClockIcon className="h-5 w-5" />
                                        <span>{movie.runtime} min</span>
                                    </div>
                                )}
                            </div>

                            {movie.genres?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {movie.genres.map((genre) => (
                                        <Chip key={genre.id} color="primary" variant="flat" size="sm">
                                            {genre.name}
                                        </Chip>
                                    ))}
                                </div>
                            )}

                            {movie.overview && <p className="text-default-700 leading-relaxed">{movie.overview}</p>}

                            {director && (
                                <p className="text-sm text-default-600">
                                    <span className="font-semibold">Director:</span> {director.name}
                                </p>
                            )}

                            {session && (
                                <div className="pt-4 flex gap-3">
                                    <Button
                                        className="px-4 py-2 rounded-lg text-lg font-bold"
                                        color={isInWatchlist(movie.id, "movie") ? "success" : "secondary"}
                                        variant={isInWatchlist(movie.id, "movie") ? "flat" : "solid"}
                                        onPress={() => handleAddToWatchlist(movie.id, false)}
                                        disabled={isInWatchlist(movie.id, "movie")}
                                        size="lg"
                                    >
                                        {isInWatchlist(movie.id, "movie") ? "✓ In Watchlist" : "Add to Watchlist"}
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
                            {mainCast.map((actor: Cast) => (
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
                            {recommendations.results.slice(0, 10).map((movie: any) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    isInWatchlist={isInWatchlist(movie.id, "movie")}
                                    onAddToWatchlist={handleAddToWatchlist}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
