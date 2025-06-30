import Loading from "@/app/loading";
import { Movie } from "@/lib/tmdb";
import { CheckIcon, PlusIcon, StarIcon } from "@heroicons/react/24/outline";
import { div } from "framer-motion/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface MovieCardProps {
    movie: Movie
    isInWatchlist: boolean,
    onAddToWatchlist?: (movieId: number, sendEmail: boolean) => void
    onRemoveFromWatchlist?: (movieId: number) => void
}

export function MovieCard({ movie, isInWatchlist = false, onAddToWatchlist, onRemoveFromWatchlist }: MovieCardProps) {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailOption, setShowEmailOption] = useState(false);

    const handleWatchlistAction = async (sendMail = false) => {
        if (!session) return;

        setIsLoading(true);
        try {
            if (isInWatchlist && onRemoveFromWatchlist) {
                await onRemoveFromWatchlist(movie.id);
            } else if (onAddToWatchlist) {
                await onAddToWatchlist(movie.id, sendMail);
            }
        } finally {
            setIsLoading(false);
            setShowEmailOption(false);
        }
    }

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating / 2);
        const hasHalfStar = rating % 2 >= 1;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-500" />)
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-500" />)
            } else {
                stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-400" />)
            }
        }

        return stars;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <Loading
                    message="Please wait..."
                    className="bg-gray/50"
                    spinnerClassName="text-blue-600 h-16 w-16"
                    messageClassName="text-xl"
                />
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
                <Link href={`/movies/${movie.id}`}>
                    <Image
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.jpg'}
                        alt={movie.title}
                        width={500}
                        height={500}
                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    />
                </Link>

                {session && (
                    <div className="absolute top-2 right-2">
                        {!showEmailOption ? (
                            <button onClick={() => {
                                if (isInWatchlist) {
                                    handleWatchlistAction()
                                } else {
                                    setShowEmailOption
                                }
                            }}
                                disabled={isLoading}
                                className={`p-2 rounded-full shadow-lg transition-colors ${isInWatchlist
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-white hover:bg-gray-100 text-gray-700"
                                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>

                                {isInWatchlist ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                            </button>
                        ) : (
                            <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
                                <button
                                    onClick={() => handleWatchlistAction(true)}
                                    disabled={isLoading}
                                    className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">
                                    Add + Email
                                </button>
                                <button
                                    onClick={() => handleWatchlistAction(false)}
                                    disabled={isLoading}
                                    className="w-full text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded">
                                    Add Only
                                </button>
                                <button
                                    onClick={() => setShowEmailOption(false)}
                                    className="w-full text-xs text-gray-500 hover:text-gray-700">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4">
                <Link href={`/movies/${movie.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-indigo-600 transition-colors line-clamp-2">
                        {movie.title}
                    </h3>
                </Link>

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                        {renderStars(movie.vote_average)}
                        <span className="text-sm text-gray-600 ml-1">({movie.vote_average.toFixed(1)})</span>
                    </div>
                    <span className="text-sm text-gray-500">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA"}
                    </span>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3">{movie.overview}</p>
            </div>
        </div>
    )

}