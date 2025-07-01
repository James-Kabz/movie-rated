"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MagnifyingGlassIcon, FilmIcon, TvIcon, UserIcon } from "@heroicons/react/24/outline"
import { Card, CardBody, Spinner } from "@heroui/react"
import type { MultiSearchResult } from "@/lib/tmdb"

interface SearchSuggestionsProps {
  query: string
  onSelect: () => void
  isVisible: boolean
}

export function SearchSuggestions({ query, onSelect, isVisible }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MultiSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setSuggestions([])
      return
    }

    // Debounce search requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchSuggestions(query.trim())
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, isVisible])

  const searchSuggestions = async (searchQuery: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) return

      const data = await response.json()
      setSuggestions(data.results?.slice(0, 8) || [])
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: MultiSearchResult) => {
    onSelect()

    if (suggestion.media_type === "movie") {
      router.push(`/movies/${suggestion.id}`)
    } else if (suggestion.media_type === "tv") {
      router.push(`/tv/${suggestion.id}`)
    } else if (suggestion.media_type === "person") {
      router.push(`/person/${suggestion.id}`)
    }
  }

  const getDisplayTitle = (item: MultiSearchResult) => {
    return item.title || item.name || "Unknown"
  }

  const getDisplayDate = (item: MultiSearchResult) => {
    const date = item.release_date || item.first_air_date
    return date ? new Date(date).getFullYear() : ""
  }

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "movie":
        return <FilmIcon className="h-4 w-4 text-blue-500" />
      case "tv":
        return <TvIcon className="h-4 w-4 text-green-500" />
      case "person":
        return <UserIcon className="h-4 w-4 text-purple-500" />
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-default-400" />
    }
  }

  const getImageUrl = (item: MultiSearchResult) => {
    const imagePath = item.poster_path || item.profile_path
    return imagePath ? `https://image.tmdb.org/t/p/w92${imagePath}` : "/placeholder-movie.jpg"
  }

  const getAltText = (item: MultiSearchResult) => {
    const title = getDisplayTitle(item)
    const mediaType = item.media_type
    
    if (mediaType === "person") {
      return `${title} profile picture` || "Person profile picture"
    } else if (mediaType === "tv") {
      return `${title} TV show poster` || "TV show poster"
    } else {
      return `${title} movie poster` || "Movie poster"
    }
  }

  if (!isVisible || (!loading && suggestions.length === 0 && query.trim())) {
    return null
  }

  return (
    <div className="search-suggestions">
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-default-600">Searching...</span>
            </div>
          ) : (
            <div className="divide-y divide-default-200">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.media_type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-default-100 transition-colors text-left"
                >
                  <Image
                    src={getImageUrl(suggestion)}
                    alt={getAltText(suggestion)}
                    width={40}
                    height={60}
                    className="rounded object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getMediaIcon(suggestion.media_type)}
                      <h4 className="font-medium text-foreground truncate">{getDisplayTitle(suggestion)}</h4>
                      {getDisplayDate(suggestion) && (
                        <span className="text-sm text-default-500">({getDisplayDate(suggestion)})</span>
                      )}
                    </div>

                    {suggestion.overview && (
                      <p className="text-sm text-default-600 line-clamp-2">{suggestion.overview}</p>
                    )}

                    {suggestion.known_for_department && (
                      <p className="text-sm text-default-500">{suggestion.known_for_department}</p>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-default-400">
                    <span className="capitalize">{suggestion.media_type}</span>
                  </div>
                </button>
              ))}

              {query.trim() && (
                <button
                  onClick={() => {
                    onSelect()
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-default-100 transition-colors text-primary"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  <span>See all results for "{query}"</span>
                </button>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}