const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_API_KEY = process.env.TMDB_API_KEY

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  popularity: number
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[]
  runtime: number
  budget: number
  revenue: number
  production_companies: { id: number; name: string; logo_path: string | null }[]
  production_countries: { iso_3166_1: string; name: string }[]
  spoken_languages: { iso_639_1: string; name: string }[]
  status: string
  tagline: string
}

export interface Cast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface Crew {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface Credits {
  cast: Cast[]
  crew: Crew[]
}

class TMDBService {
  private async fetchFromTMDB(endpoint: string) {
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }
    return response.json()
  }

  async getPopularMovies(page = 1) {
    return this.fetchFromTMDB(`/movie/popular?page=${page}`)
  }

  async getTopRatedMovies(page = 1) {
    return this.fetchFromTMDB(`/movie/top_rated?page=${page}`)
  }

  async getNowPlayingMovies(page = 1) {
    return this.fetchFromTMDB(`/movie/now_playing?page=${page}`)
  }

  async getUpcomingMovies(page = 1) {
    return this.fetchFromTMDB(`/movie/upcoming?page=${page}`)
  }

  async searchMovies(query: string, page = 1) {
    return this.fetchFromTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`)
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.fetchFromTMDB(`/movie/${movieId}`)
  }

  async getMovieCredits(movieId: number): Promise<Credits> {
    return this.fetchFromTMDB(`/movie/${movieId}/credits`)
  }

  async getMovieRecommendations(movieId: number, page = 1) {
    return this.fetchFromTMDB(`/movie/${movieId}/recommendations?page=${page}`)
  }

  async getGenres() {
    return this.fetchFromTMDB("/genre/movie/list")
  }

  async discoverMovies(params: {
    genre?: string
    year?: string
    sortBy?: string
    page?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params.genre) queryParams.append("with_genres", params.genre)
    if (params.year) queryParams.append("year", params.year)
    if (params.sortBy) queryParams.append("sort_by", params.sortBy)
    queryParams.append("page", (params.page || 1).toString())

    return this.fetchFromTMDB(`/discover/movie?${queryParams.toString()}`)
  }

  getImageUrl(path: string | null, size = "w500") {
    if (!path) return "/placeholder-movie.jpg"
    return `https://image.tmdb.org/t/p/${size}${path}`
  }
}

export const tmdbService = new TMDBService()
