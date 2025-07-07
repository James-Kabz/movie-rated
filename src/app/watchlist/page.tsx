"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { TrashIcon, CheckIcon, FilmIcon, TvIcon, ClockIcon } from "@heroicons/react/24/outline"
import { Button, Tabs, Tab } from "@heroui/react"
import { toast } from "sonner"

interface WatchlistItem {
  id: string
  movieId: number
  mediaType: string
  movieTitle: string
  moviePoster: string | null
  movieYear: string
  rating: number
  genre: string
  addedAt: string
  watched: boolean
  watchedAt: string | null
}

interface RecentlyViewedItem {
  id: string
  movieId: number
  mediaType: string
  movieTitle: string
  moviePoster: string | null
  movieYear: string
  rating: number
  genre: string
  viewedAt: string
}

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unwatched" | "watched">("all")
  const [activeTab, setActiveTab] = useState<"watchlist" | "recently-viewed">("watchlist")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (session) {
      fetchWatchlist()
      fetchRecentlyViewed()
    }
  }, [session, status, router])

  const fetchWatchlist = async () => {
    try {
      const response = await fetch("/api/watchlist")
      const data = await response.json()
      setWatchlist(data)
    } catch (error) {
      console.error("Error fetching watchlist:", error)
      toast.error("Error fetching watchlist", {
        description: error instanceof Error ? error.message : "Failed to fetch watchlist.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentlyViewed = async () => {
    try {
      const response = await fetch("/api/recently-viewed")
      const data = await response.json()
      setRecentlyViewed(data)
    } catch (error) {
      console.error("Error fetching recently viewed:", error)
    }
  }

  const handleRemoveFromWatchlist = async (itemId: string) => {
    try {
      const response = await fetch(`/api/watchlist/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWatchlist(watchlist.filter((item) => item.id !== itemId))
        toast.success("Removed from watchlist!")
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      toast.error("Error removing from watchlist", {
        description: error instanceof Error ? error.message : "Failed to remove from watchlist.",
      })
    }
  }

  const handleToggleWatched = async (itemId: string, watched: boolean) => {
    try {
      const response = await fetch(`/api/watchlist/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watched }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setWatchlist(watchlist.map((item) => (item.id === itemId ? updatedItem : item)))
        toast.success("Watched status updated!")
      }
    } catch (error) {
      console.error("Error updating watchlist item:", error)
      toast.error("Error updating watchlist item", {
        description: error instanceof Error ? error.message : "Failed to update watchlist item.",
      })
    }
  }

  const handleClearAllWatchlist = async () => {
    if (!confirm("Are you sure you want to clear your entire watchlist? This action cannot be undone.")) {
      return
    }

    try {
      const deletePromises = watchlist.map((item) => fetch(`/api/watchlist/${item.id}`, { method: "DELETE" }))

      await Promise.all(deletePromises)
      setWatchlist([])
      toast.success("Watchlist cleared!")
    } catch (error) {
      console.error("Error clearing watchlist:", error)
      toast.error("Error clearing watchlist", {
        description: "Failed to clear watchlist.",
      })
    }
  }

  const handleClearRecentlyViewed = async () => {
    if (!confirm("Are you sure you want to clear your recently viewed history?")) {
      return
    }

    try {
      const response = await fetch("/api/recently-viewed", {
        method: "DELETE",
      })

      if (response.ok) {
        setRecentlyViewed([])
        toast.success("Recently viewed cleared!")
      }
    } catch (error) {
      console.error("Error clearing recently viewed:", error)
      toast.error("Error clearing recently viewed", {
        description: "Failed to clear recently viewed.",
      })
    }
  }

  const getDetailUrl = (item: WatchlistItem | RecentlyViewedItem) => {
    return item.mediaType === "tv" ? `/tv/${item.movieId}` : `/movies/${item.movieId}`
  }

  const getMediaIcon = (mediaType: string) => {
    return mediaType === "tv" ? (
      <TvIcon className="h-4 w-4 text-green-500" />
    ) : (
      <FilmIcon className="h-4 w-4 text-blue-500" />
    )
  }

  const filteredWatchlist = watchlist.filter((item) => {
    if (filter === "watched") return item.watched
    if (filter === "unwatched") return !item.watched
    return true
  })

  const stats = {
    total: watchlist.length,
    watched: watchlist.filter((item) => item.watched).length,
    unwatched: watchlist.filter((item) => !item.watched).length,
    movies: watchlist.filter((item) => item.mediaType === "movie").length,
    tvShows: watchlist.filter((item) => item.mediaType === "tv").length,
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">You are not logged in</h2>
          <p className="text-gray-600 mb-4">Please log in to view your watchlist.</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-800">
            Log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Lists</h1>

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as "watchlist" | "recently-viewed")}
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
          }}
        >
          <Tab key="watchlist" title={`Watchlist (${watchlist.length})`} />
          <Tab key="recently-viewed" title={`Recently Viewed (${recentlyViewed.length})`} />
        </Tabs>
      </div>

      {activeTab === "watchlist" ? (
        <>
          {watchlist.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-400 mb-2">Your watchlist is empty</h2>
              <p className="mb-4">Add movies to your watchlist to get started.</p>
              <Link href="/" className="text-indigo-600 hover:text-indigo-800">
                Explore Movies
              </Link>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                  <span className="font-medium">Total: {stats.total}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  <span className="font-medium">To Watch: {stats.unwatched}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  <span className="font-medium">Watched: {stats.watched}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  <FilmIcon className="h-4 w-4" />
                  <span className="font-medium">Movies: {stats.movies}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  <TvIcon className="h-4 w-4" />
                  <span className="font-medium">TV Shows: {stats.tvShows}</span>
                </div>
              </div>

              {/* Filter Tabs and Clear All Button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-1 p-1 rounded-lg w-fit">
                  {[
                    { key: "all", label: "All" },
                    { key: "unwatched", label: "To Watch" },
                    { key: "watched", label: "Watched" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key as any)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        filter === tab.key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <Button
                  color="danger"
                  variant="bordered"
                  size="sm"
                  onClick={handleClearAllWatchlist}
                  disabled={watchlist.length === 0}
                >
                  Clear All
                </Button>
              </div>

              {filteredWatchlist.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold mb-2">
                    {filter === "all" ? "Your watchlist is empty" : `No ${filter} movies`}
                  </h2>
                  <p className="mb-4">
                    {filter === "all"
                      ? "Start adding movies to keep track of what you want to watch!"
                      : `You don't have any ${filter} movies yet.`}
                  </p>
                  <Link
                    href="/movies"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  >
                    Browse Movies
                  </Link>
                </div>
              ) : (
                <div className="movie-card space-y-4">
                  {filteredWatchlist.map((item) => (
                    <div
                      key={item.id}
                      className={`movie-card rounded-lg shadow-md p-6 flex items-center space-x-4 ${
                        item.watched ? "opacity-40" : ""
                      }`}
                    >
                      <Link href={getDetailUrl(item)}>
                        <Image
                          src={item.moviePoster || "/placeholder-movie.jpg"}
                          alt={item.movieTitle}
                          width={80}
                          height={120}
                          className="rounded-md shadow-sm hover:scale-105 transition-transform"
                        />
                      </Link>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getMediaIcon(item.mediaType)}
                          <Link href={getDetailUrl(item)}>
                            <h3 className="text-lg font-semibold hover:text-indigo-600 transition-colors">
                              {item.movieTitle}
                            </h3>
                          </Link>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {item.mediaType === "tv" ? "TV Show" : "Movie"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                          <span>{item.movieYear}</span>
                          <span>•</span>
                          <span>{item.genre}</span>
                          <span>•</span>
                          <span>★ {item.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                          {item.watched && item.watchedAt && (
                            <span className="text-green-500">
                              {" "}
                              • Watched {new Date(item.watchedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleWatched(item.id, !item.watched)}
                          className={`p-2 rounded-full transition-colors ${
                            item.watched
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={item.watched ? "Mark as unwatched" : "Mark as watched"}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleRemoveFromWatchlist(item.id)}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Remove from watchlist"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {/* Recently Viewed Tab */}
          {recentlyViewed.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No recently viewed items</h2>
              <p className="mb-4">Start browsing movies and TV shows to see your viewing history here.</p>
              <Link href="/" className="text-indigo-600 hover:text-indigo-800">
                Explore Movies
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Your recently viewed movies and TV shows</p>
                <Button color="danger" variant="bordered" size="sm" onClick={handleClearRecentlyViewed}>
                  Clear History
                </Button>
              </div>

              <div className="movie-card space-y-4">
                {recentlyViewed.map((item) => (
                  <div key={item.id} className="movie-card rounded-lg shadow-md p-6 flex items-center space-x-4">
                    <Link href={getDetailUrl(item)}>
                      <Image
                        src={item.moviePoster || "/placeholder-movie.jpg"}
                        alt={item.movieTitle}
                        width={80}
                        height={120}
                        className="rounded-md shadow-sm hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getMediaIcon(item.mediaType)}
                        <Link href={getDetailUrl(item)}>
                          <h3 className="text-lg font-semibold hover:text-indigo-600 transition-colors">
                            {item.movieTitle}
                          </h3>
                        </Link>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {item.mediaType === "tv" ? "TV Show" : "Movie"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                        <span>{item.movieYear}</span>
                        <span>•</span>
                        <span>{item.genre}</span>
                        <span>•</span>
                        <span>★ {item.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        Viewed {new Date(item.viewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
