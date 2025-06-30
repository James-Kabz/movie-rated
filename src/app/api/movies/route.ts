import { tmdbService } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export default function GET (request: NextRequest) {
    const {searchParams} = new URL(request.url)
    const query = searchParams.get('q');
    const category = searchParams.get('category') || 'popular';
    const page = Number.parseInt(searchParams.get('page') || '1');

    try{
        let movies

        if (query) {
            movies = tmdbService.searchMovies(query, page)
        } else {
            switch (category) {
                case 'top_rated':
                    movies = tmdbService.getTopRatedMovies(page)
                    break;
                case 'now_playing':
                    movies = tmdbService.getNowPlayingMovies(page)
                    break;
                case 'upcoming':
                    movies = tmdbService.getUpcomingMovies(page)
                    break;
                default:
                    movies = tmdbService.getPopularMovies(page)
                    // break;
            }
        }

        return NextResponse.json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
    }
}