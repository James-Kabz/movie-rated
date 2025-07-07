"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { CalendarIcon, UserIcon } from "@heroicons/react/24/solid"
import { Skeleton, Card, CardBody, Button } from "@heroui/react"
import { MovieCard } from "@/components/movie-card"
import { toast } from "sonner"

interface PersonData {
  person: any
  movieCredits: any
  tvCredits: any
}

export default function PersonDetailPage() {
  const { personId } = useParams()
  const [personData, setPersonData] = useState<PersonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies")

  useEffect(() => {
    if (personId) {
      fetchPersonData()
    }
  }, [personId])

  const fetchPersonData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/person/${personId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setPersonData(data)
    } catch (error) {
      console.error("Error fetching person data:", error)
      setError("Failed to load person details. Please try again later.")
      toast.error("Error fetching person details", {
        description: error instanceof Error ? error.message : "Failed to fetch person details.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8 py-8">
            <div className="flex-shrink-0">
              <Skeleton className="rounded-lg w-[300px] h-[450px]" />
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4 rounded-lg" />
              <Skeleton className="h-6 w-1/2 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
                <Skeleton className="h-4 w-4/6 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !personData?.person) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mx-auto">
          <CardBody className="text-center py-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">{error || "Person not found"}</h1>
            <Button color="primary" onPress={fetchPersonData} className="mt-4">
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  const { person, movieCredits, tvCredits } = personData
  const knownForMovies = movieCredits?.cast?.slice(0, 10) || []
  const knownForTV = tvCredits?.cast?.slice(0, 10) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8 py-8">
          <div className="flex-shrink-0">
            <Image
              src={
                person.profile_path
                  ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
                  : "/placeholder-person.jpg"
              }
              alt={person.name || "Person"}
              width={300}
              height={450}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-4xl font-bold text-foreground">{person.name}</h1>

            <div className="flex items-center space-x-6 text-sm text-default-600">
              {person.birthday && (
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Born {new Date(person.birthday).toLocaleDateString()}</span>
                </div>
              )}

              {person.known_for_department && (
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-5 w-5" />
                  <span>{person.known_for_department}</span>
                </div>
              )}
            </div>

            {person.place_of_birth && (
              <p className="text-sm text-default-600">
                <span className="font-semibold">Born in:</span> {person.place_of_birth}
              </p>
            )}

            {person.biography && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Biography</h3>
                <p className="text-default-700 leading-relaxed">{person.biography}</p>
              </div>
            )}
          </div>
        </div>

        {/* Known For Section */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Known For</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                color={activeTab === "movies" ? "secondary" : "default"}
                variant={activeTab === "movies" ? "solid" : "bordered"}
                onPress={() => setActiveTab("movies")}
              >
                Movies ({knownForMovies.length})
              </Button>
              <Button
                size="sm"
                color={activeTab === "tv" ? "secondary" : "default"}
                variant={activeTab === "tv" ? "solid" : "bordered"}
                onPress={() => setActiveTab("tv")}
              >
                TV Shows ({knownForTV.length})
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {activeTab === "movies"
              ? knownForMovies.map((movie: any) => <MovieCard key={movie.id} movie={movie} />)
              : knownForTV.map((show: any) => <MovieCard key={show.id} movie={show} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
