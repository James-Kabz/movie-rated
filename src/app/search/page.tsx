"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MovieCard } from "@/components/movie-card"
import { Button, Spinner, Input, Pagination } from "@heroui/react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"
import type { Movie } from "@/lib/tmdb"
import { useSession } from "next-auth/react"

export default function SearchPage() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const [movies, setMovies] = useState<Movie[]>([])
    const [watchlist, setWatchlist] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalResults, setTotalResults] = useState(0)

    useEffect(() => {
        const query = searchParams.get("q")
        if (query) {
            setSearchQuery(query)
            searchMovies(query, 1)
        }
    }, [searchParams])

    useEffect(() => {
        if (session) {
            fetchWatchlist()
        }
    }, [session])

    const searchMovies = async (query: string, page: number) => {
        if (!query.trim()) return

        try {
            setLoading(true)
            const response = await fetch(`/api/movies?q=${encodeURIComponent(query)}&page=${page}`)

            if (!response.ok) {
                throw new Error("Failed to search movies")
            }

            const data = await response.json()
            setMovies(data.results || [])
            setTotalPages(Math.min(data.total_pages || 1, 500))
            setTotalResults(data.total_results || 0)
            setCurrentPage(page)
        } catch (error) {
            console.error("Error searching movies:", error)
            toast.error("Search failed", {
                description: "Failed to search movies. Please try again.",
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            searchMovies(searchQuery.trim(), 1)
            // Update URL
            const url = new URL(window.location.href)
            url.searchParams.set("q", searchQuery.trim())
            window.history.pushState({}, "", url.toString())
        }
    }

    const handlePageChange = (page: number) => {
        searchMovies(searchQuery, page)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-6">Search Movies</h1>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="max-w-2xl rounded-lg p-4 shadow-lg">
                        <Input
                            size="lg"
                            placeholder="Search for movies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
                            endContent={
                                <Button type="submit" size="sm" isLoading={loading}>
                                    <span className="text-sm font-bold">SCAN</span>
                                </Button>
                            }
                            classNames={{
                                input: "text-lg text-default-200 bg-transparent border-transparent focus:ring-2 focus:ring-default-400",
                                inputWrapper: "h-14 flex justify-between items-center",
                            }}
                        />
                        <div className="mt-2 text-default-400 text-sm">
                            <span>Search for movies, actors, or directors</span>
                        </div>
                    </form>
                </div>

                {/* Search Results */}
                {searchParams.get("q") && (
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center min-h-[50vh]">
                                <Spinner size="lg" label="Searching movies..." />
                            </div>
                        ) : (
                            <>
                                {/* Results Info */}
                                <div className="mb-6">
                                    <p className="text-default-600">
                                        {totalResults > 0
                                            ? `Found ${totalResults.toLocaleString()} results for "${searchParams.get("q")}"`
                                            : `No results found for "${searchParams.get("q")}"`}
                                    </p>
                                </div>

                                {movies.length > 0 ? (
                                    <>
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
                                    </>
                                ) : searchParams.get("q") && !loading ? (
                                    <div className="text-center py-12">
                                        <h3 className="text-xl font-semibold text-foreground mb-2">No movies found</h3>
                                        <p className="text-default-600 mb-4">
                                            Try searching with different keywords or check your spelling.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </>
                )}

                {/* Popular Movies when no search */}
                {!searchParams.get("q") && !loading && (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-foreground mb-2">Start searching for movies</h3>
                        <p className="text-default-600">Enter a movie title, actor, or director to find movies.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
