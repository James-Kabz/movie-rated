"use client";

import { MovieCard } from "@/components/movie-card";
import { Cast, Credits, Crew, MovieDetails } from "@/lib/tmdb";
import { CalendarIcon, ClockIcon, StarIcon } from "@heroicons/react/24/outline";
import { addToast } from "@heroui/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";


interface MovieData {
    movie: MovieDetails
    credits: Credits
    recommendations: { results: any[] }
}

export default function MovieDetailPage() {
    const { movieId } = useParams();
    const { data: session } = useSession();
    const [movieData, setMovieData] = useState<MovieData | null>(null);
    const [watchlist, setWatchlist] = useState<number[]>([]);
    const [loading, setIsLoading] = useState(true);


    useEffect(() => {
        if (movieId) {
            fetchMovieData()
        }
        if (session) {
            fetchWatchList()
        }
    }, [movieId, session]);

    const fetchMovieData = async () => {
        try {
            const response = await fetch(`/api/movies/${movieId}`);
            const data = await response.json();
            setMovieData(data);
        } catch (error) {
            return addToast({
                title: "Error",
                description: "Error fetching movie data.",
                color: "danger",
            })
        }
    }

    const fetchWatchList = async () => {
        try {
            const response = await fetch("/api/watchlist");
            const data = await response.json();

            setWatchlist(data.map((item: any) => item.movieId))
        } catch (error) {
            return addToast({
                title: "Error",
                description: "Error fetching watchlist.",
                color: "danger",
            })
        }
    }

    const handleAddToWatchlist = async ( movieId: number, sendEmail: boolean) => {
        try {
            const response = await fetch("/api/watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId: movieId, sendEmail: true }),
            })

            if (response.ok) {
                setWatchlist([...watchlist, movieId]);
            } else {
                console.error('movieId is not a string')
            }
        } catch (error) {
            return addToast({
                title: "Error",
                description: "Error adding to watchlist.",
                color: "danger",
            })
        }
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="bg-gray-200 h-96 rounded-lg mb-8"></div>
                    <div className="space-y-4">
                        <div className="bg-gray-200 h-8 w-3/4 rounded"></div>
                        <div className="bg-gray-200 h-4 w-full rounded"></div>
                        <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!movieData) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Movie not found</h1>
                </div>
            </div>
        )
    }

    const { movie, credits, recommendations } = movieData
    const director = credits.crew.find((person: Crew) => person.job === "Director")
    const mainCast = credits.cast.slice(0, 8)
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="relative mb-8">
                {movie.backdrop_path && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                            alt={movie.title}
                            fill
                            className="object-cover opacity-20"
                        />
                    </div>
                )}

                <div className="relative z-10 flex flex-col md:flex-row gap-8 py-8">
                    <div className="flex-shrink-0">
                        <Image
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder-movie.jpg"}
                            alt={movie.title}
                            width={300}
                            height={450}
                            className="rounded-lg shadow-lg"
                        />
                    </div>

                    <div className="flex-1 space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">{movie.title}</h1>

                        {movie.tagline && <p className="text-lg text-gray-600 italic">"{movie.tagline}"</p>}

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <StarIcon className="h-5 w-5 text-yellow-400" />
                                <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                                <span>({movie.vote_count.toLocaleString()} votes)</span>
                            </div>

                            <div className="flex items-center space-x-1">
                                <CalendarIcon className="h-5 w-5" />
                                <span>{new Date(movie.release_date).getFullYear()}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                                <ClockIcon className="h-5 w-5" />
                                <span>{movie.runtime} min</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {movie.genres.map((genre) => (
                                <span key={genre.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        <p className="text-gray-700 leading-relaxed">{movie.overview}</p>

                        {director && (
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold">Director:</span> {director.name}
                            </p>
                        )}

                        {session && (
                            <div className="pt-4">
                                <button
                                    onClick={() => handleAddToWatchlist(movie.id, false)}
                                    disabled={watchlist.includes(movie.id)}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${watchlist.includes(movie.id)
                                            ? "bg-green-500 text-white cursor-not-allowed"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        }`}
                                >
                                    {watchlist.includes(movie.id) ? "In Watchlist" : "Add to Watchlist"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cast Section */}
            {mainCast.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Cast</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {mainCast.map((actor: Cast) => (
                            <div key={actor.id} className="text-center">
                                <Image
                                    src={
                                        actor.profile_path
                                            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                                            : "/placeholder-person.jpg"
                                    }
                                    alt={actor.name}
                                    width={185}
                                    height={278}
                                    className="rounded-lg shadow-md mb-2 w-full h-32 object-cover"
                                />
                                <h3 className="font-semibold text-sm">{actor.name}</h3>
                                <p className="text-xs text-gray-600">{actor.character}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {recommendations.results.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {recommendations.results.slice(0, 10).map((movie: any) => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                isInWatchlist={watchlist.includes(movie.id)}
                                onAddToWatchlist={handleAddToWatchlist}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
