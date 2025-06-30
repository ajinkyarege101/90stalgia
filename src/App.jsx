
import { useState, useEffect } from 'react'
import './App.css'

// You'll need to get a TMDB API key from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error("TMDB API key is missing! Make sure it's set on Vercel.");
}
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

export default function App() {
  const [currentPair, setCurrentPair] = useState([])
  const [selectedMovies, setSelectedMovies] = useState([])
  const [allMovies, setAllMovies] = useState([])
  const [usedMovies, setUsedMovies] = useState([])
  const [gamePhase, setGamePhase] = useState('loading') // 'loading', 'playing', 'results'
  const [roundCount, setRoundCount] = useState(0)

  // Fetch Indian movies from TMDB
  useEffect(() => {
    fetchIndianMovies()
  }, [])

  const fetchIndianMovies = async () => {
    try {
      let allFetchedMovies = []
      
      // Fetch movies from multiple pages and different decades for variety
      const fetchPromises = []
      
      // 90s movies - 3 pages
      for (let page = 1; page <= 3; page++) {
        fetchPromises.push(
          fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31&sort_by=popularity.desc&page=${page}`)
        )
      }
      
      // Also include 80s and early 2000s for more variety
      for (let page = 1; page <= 2; page++) {
        fetchPromises.push(
          fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&primary_release_date.gte=1985-01-01&primary_release_date.lte=1989-12-31&sort_by=popularity.desc&page=${page}`)
        )
        fetchPromises.push(
          fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&primary_release_date.gte=2000-01-01&primary_release_date.lte=2005-12-31&sort_by=popularity.desc&page=${page}`)
        )
      }

      const responses = await Promise.all(fetchPromises)
      
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json()
          if (data.results) {
            allFetchedMovies.push(...data.results)
          }
        }
      }
      
      // Filter movies with posters and remove duplicates
      const uniqueMovies = allFetchedMovies
        .filter(movie => movie.poster_path && movie.title)
        .filter((movie, index, self) => 
          index === self.findIndex(m => m.id === movie.id)
        )
      
      if (uniqueMovies.length > 0) {
        setAllMovies(uniqueMovies)
        setGamePhase('playing')
        selectRandomPair(uniqueMovies)
      } else {
        setGamePhase('error')
      }
    } catch (error) {
      console.error('Error fetching movies:', error)
      setGamePhase('error')
    }
  }

  const selectRandomPair = (movies) => {
    // Filter out movies that have already been used in pairs
    const availableMovies = movies.filter(movie => 
      !usedMovies.some(used => used.id === movie.id)
    )
    
    // If we have less than 2 available movies, reset the used movies pool
    if (availableMovies.length < 2) {
      setUsedMovies([])
      const shuffled = [...movies].sort(() => 0.5 - Math.random())
      setCurrentPair([shuffled[0], shuffled[1]])
      setUsedMovies([shuffled[0], shuffled[1]])
    } else {
      const shuffled = [...availableMovies].sort(() => 0.5 - Math.random())
      setCurrentPair([shuffled[0], shuffled[1]])
      setUsedMovies(prev => [...prev, shuffled[0], shuffled[1]])
    }
  }

  const handleMovieSelection = (selectedMovie) => {
    setSelectedMovies(prev => [...prev, selectedMovie])
    setRoundCount(prev => prev + 1)

    if (roundCount >= 9) { // After 10 rounds, show results
      setGamePhase('results')
    } else {
      // Select a new random pair from all available movies
      selectRandomPair(allMovies)
    }
  }

  const restartGame = () => {
    setSelectedMovies([])
    setUsedMovies([])
    setRoundCount(0)
    setGamePhase('playing')
    selectRandomPair(allMovies)
  }

  if (gamePhase === 'loading') {
    return (
      <div className="app">
        <div className="loading">
          <h1>90stalgia</h1>
          <p>Loading your nostalgic movie journey...</p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'error') {
    return (
      <div className="app">
        <div className="error">
          <h1>90stalgia</h1>
          <p>Please add your TMDB API key to start the game!</p>
          <p>Get one from <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">TMDB</a></p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'results') {
    return (
      <div className="app">
        <div className="results">
          <h1>Your 90s Favorites!</h1>
          <p>Based on your choices, here are your nostalgic picks:</p>
          <div className="favorites-grid">
            {selectedMovies.map((movie, index) => (
              <div key={movie.id} className="favorite-movie">
                <img 
                  src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} 
                  alt={movie.title}
                  className="favorite-poster"
                />
                <h3>{movie.title}</h3>
                <p>{movie.release_date?.split('-')[0]}</p>
              </div>
            ))}
          </div>
          <button onClick={restartGame} className="restart-btn">
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>90stalgia</h1>
        <p>Choose your favorite! Round {roundCount + 1}/10</p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((roundCount) / 10) * 100}%` }}
          ></div>
        </div>
      </header>

      <div className="game-container">
        <div className="movie-selection">
          {currentPair.map((movie, index) => (
            <div 
              key={movie.id} 
              className="movie-card"
              onClick={() => handleMovieSelection(movie)}
            >
              <img 
                src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`} 
                alt={movie.title}
                className="movie-poster"
              />
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <p>{movie.release_date?.split('-')[0]}</p>
                <p className="rating">⭐ {movie.vote_average?.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="vs-divider">
          <span>VS</span>
        </div>
      </div>
    </div>
  )
}
