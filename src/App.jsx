import React, { useState, useEffect, useRef } from 'react';
import { Film, Clapperboard, Star, HelpCircle, Trophy, AlertCircle, Check, Clock, Play, Tv, Eye } from 'lucide-react';



// --- Constants & Fallback Data ---

const TMDB_BASE_URL ='https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE ='https://image.tmdb.org/t/p/w1280'

// const a = import.meta.env.VITE_TMDB_KEY;








const FALLBACK_MOVIES = [
    {
        id: 1,
        title: "3 Idiots",
        release_date: "2009-12-25",
        overview: "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.",
        poster_path: null,
        backdrop_path: null,
        genres: [{ name: "Comedy" }, { name: "Drama" }],
        cast: ["Aamir Khan", "R. Madhavan", "Sharman Joshi"],
        fallbackImage: "https://d17389e216ygm.cloudfront.net/wp-content/uploads/2015/02/ThreeIdiots-e1424150668976.jpg",
        fallbackPoster: "https://placehold.co/400x600/cc3300/ffffff?text=3+Idiots+Poster",
        mode: "Bollywood" // Added mode for fallback
    },
    {
        id: 2,
        title: "The Lion King",
        release_date: "1994-06-24",
        overview: "A young lion prince is cast out of his pride by his cruel uncle, who claims he killed his father. While the uncle rules with an iron paw, the prince grows up beyond the Savannah.",
        poster_path: null,
        backdrop_path: null,
        genres: [{ name: "Animation" }, { name: "Family" }],
        cast: ["Matthew Broderick", "Jeremy Irons", "James Earl Jones"],
        fallbackImage: "https://www.pluggedin.com/wp-content/uploads/1994/06/web-topper-12-1024x587.png",
        fallbackPoster: "https://placehold.co/400x600/1e40af/ffffff?text=Lion+King+Poster",
        mode: "Animation" // Added mode for fallback
    },
    {
        id: 3,
        title: "Dangal",
        release_date: "2016-12-21",
        overview: "Mahavir Singh Phogat, a former wrestler, decides to fulfill his dream of winning a gold medal for his country by training his daughters for the Commonwealth Games.",
        poster_path: null,
        backdrop_path: null,
        genres: [{ name: "Drama" }, { name: "Family" }],
        cast: ["Aamir Khan", "Sakshi Tanwar", "Fatima Sana Shaikh"],
        fallbackImage: "https://images.hindustantimes.com/rf/image_size_630x354/HT/p2/2016/12/24/Pictures/_9413b048-c999-11e6-ad67-c7f41c1c9a76.jpg",
        fallbackPoster: "https://placehold.co/400x600/001133/ffffff?text=Dangal+Poster",
        mode: "Bollywood" // Added mode for fallback
    },
    {
        id: 4,
        title: "Spider-Man: Into the Spider-Verse",
        release_date: "2018-12-14",
        overview: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
        poster_path: null,
        backdrop_path: null,
        genres: [{ name: "Animation" }, { name: "Action" }],
        cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld"],
        fallbackImage: "https://cdn.mos.cms.futurecdn.net/3JCaEkiSwWKAwgLMjpChF3-1200-80.jpg",
        fallbackPoster: "https://placehold.co/400x600/cc0000/ffffff?text=Spider-Verse+Poster",
        mode: "Superheroes" // Added mode for fallback
    }
];


// --- Main Component: App (formerly MovieGame) ---

export default function App() {
    // --- State ---
    const [hasStarted, setHasStarted] = useState(false);
    // API Key should be handled securely, using a mock one here for structure
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_TMDB_KEY); 
    const [useApi, setUseApi] = useState(false);
    
    const [currentMovie, setCurrentMovie] = useState(null);
    const [options, setOptions] = useState([]);

    const [loading, setLoading] = useState(false);
    // Feedback is now only used for Game Over / Time Out messages
    const [feedback, setFeedback] = useState(null); 
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    
    // State to track the last clicked option ID for visual feedback (red/green)
    const [guessedOptionId, setGuessedOptionId] = useState(null);
    
    // State to manage the transition period after a correct guess
    const [isGuessedCorrectly, setIsGuessedCorrectly] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(10);
    const audioCtx = useRef(null);

    // --- Sound Effects Helper ---
    const playSound = (type) => {
        try {
            // Check if context is initialized and ready
            if (!audioCtx.current || audioCtx.current.state === 'suspended') return;

            const ctx = audioCtx.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'tick') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'alarm') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
            } else if (type === 'success') {
                // New success sound effect
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch (e) {
            console.error("Audio initialization error. Ensure user interaction has occurred.", e);
        }
    };

    // --- Helpers ---
    const shuffleArray = (array) => {
        return array.sort(() => Math.random() - 0.5);
    };

    // --- Timer Logic ---
    useEffect(() => {
        // Stop timer if game is over, loading, or a correct guess was just made
        if (!hasStarted || loading || gameOver || !currentMovie || isGuessedCorrectly) return; 

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                if (prev <= 4) { // Only tick for the last 4 seconds
                    playSound('tick');
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [hasStarted, loading, gameOver, currentMovie, isGuessedCorrectly]); // Added isGuessedCorrectly

    const handleTimeout = () => {
        playSound('alarm');
        // Setting lives to 0 immediately triggers game over logic
        setLives(0); 
        setGameOver(true);
        setFeedback({ type: 'error', message: `Time's Up! The movie was: "${currentMovie.title}".` });
    };

    // --- API / Data Fetching ---

    const fetchRandomMovie = async () => {
        setLoading(true);
        setFeedback(null);
        setTimeLeft(10);
        // Reset visual feedback states for the new round
        setGuessedOptionId(null);
        setIsGuessedCorrectly(false); // Reset correct guess status
        
        // --- NEW MODE SELECTION LOGIC ---
        const modeOptions = ['Bollywood', 'Animation', 'Superheroes'];
        const selectedMode = modeOptions[Math.floor(Math.random() * modeOptions.length)];

        // Fallback Mode
        if (!useApi || !apiKey) {
            setTimeout(() => {
                const target = FALLBACK_MOVIES.find(m => m.mode === selectedMode) || FALLBACK_MOVIES[0];
                const distractors = FALLBACK_MOVIES.filter(m => m.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
                const allOptions = shuffleArray([target, ...distractors]);
                // Set the mode property based on the fallback definition
                setCurrentMovie(target);
                setOptions(allOptions);
                setLoading(false);
            }, 600);
            return;
        }

        try {
            const cleanKey = apiKey.trim();
            const randomPage = Math.floor(Math.random() * 20) + 1;

            let discoveryUrl;
            let genreName;

            if (selectedMode === 'Animation') {
                // Discover animated films (Genre ID 16)
                discoveryUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${cleanKey}&language=en-US&sort_by=popularity.desc&with_genres=16&page=${randomPage}`;
                genreName = 'Animation';
            } else if (selectedMode === 'Superheroes') {
                // Discover popular Action/Adventure/Sci-Fi movies (Genre ID 28: Action)
                discoveryUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${cleanKey}&language=en-US&sort_by=popularity.desc&with_genres=28&page=${randomPage}`;
                genreName = 'Superheroes';
            } else { // Bollywood
                // Discover popular Hindi (Bollywood) films
                discoveryUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${cleanKey}&language=en-US&sort_by=popularity.desc&with_original_language=hi&primary_release_date.gte=2001-01-01&page=${randomPage}`;
                genreName = 'Bollywood';
            }

            const response = await fetch(discoveryUrl);

            if (!response.ok) {
                if (response.status === 401) throw new Error("Invalid API Key");
                throw new Error("Network Error");
            }

            const data = await response.json();
            // Filter for movies with backdrop path
            const validMovies = data.results.filter(m => m.backdrop_path);

            if (validMovies.length < 4) throw new Error("Not enough valid movies on page");

            const targetBasic = validMovies[Math.floor(Math.random() * validMovies.length)];

            const distractors = validMovies
                .filter(m => m.id !== targetBasic.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            // Fetch detailed information for the target movie
            const detailsRes = await fetch(`${TMDB_BASE_URL}/movie/${targetBasic.id}?api_key=${cleanKey}&append_to_response=credits,images&include_image_language=null,en`);
            const detailsData = await detailsRes.json();

            let bestBackdrop = detailsData.backdrop_path;
            if (detailsData.images && detailsData.images.backdrops && detailsData.images.backdrops.length > 0) {
                // Try to find a textless backdrop image for a cleaner guessing experience
                const textless = detailsData.images.backdrops.find(img => img.iso_639_1 === null);
                if (textless) {
                    bestBackdrop = textless.file_path;
                }
            }

            const targetFull = {
                ...detailsData,
                backdrop_path: bestBackdrop,
                cast: detailsData.credits?.cast?.slice(0, 3).map(c => c.name) || [],
                mode: genreName // Set the mode here
            };

            setCurrentMovie(targetFull);
            setOptions(shuffleArray([targetFull, ...distractors]));

        } catch (err) {
            console.error(err);
            setUseApi(false);
            // Fall back to demo mode on API failure
            const target = FALLBACK_MOVIES[0];
            const distractors = FALLBACK_MOVIES.slice(1, 4);
            setCurrentMovie(target);
            setOptions(shuffleArray([target, ...distractors]));
            setFeedback({ type: 'error', message: `API Error. Switched to Demo Mode.` });
        } finally {
            setLoading(false);
        }
    };

    // --- Game Logic ---

    const startGame = () => {
        // Initialize AudioContext on user interaction
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        } else if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
        }

        // --- Explicit State Reset for clean restart ---
        setScore(0);
        setLives(3);
        setGameOver(false);
        setFeedback(null); // Clear any lingering messages like "Game Over" or "Wrong!"
        setGuessedOptionId(null); // Reset visual feedback state
        setIsGuessedCorrectly(false); // New reset
        // ---------------------------------------------

        setHasStarted(true);

        if (apiKey && apiKey.length > 20) {
            setUseApi(true);
        }
        fetchRandomMovie();
    };

    const handleGuess = (selectedMovie) => {
        // Block interaction if game is over, loading, or waiting for the next round
        if (gameOver || loading || isGuessedCorrectly) return;
        
        // Track the clicked button for visual feedback (red or green)
        setGuessedOptionId(selectedMovie.id);

        if (selectedMovie.id === currentMovie.id) {
            playSound('success'); 
            
            const points = 2; // Fixed points per user request

            setScore(s => s + points);
            if (score + points > highScore) setHighScore(score + points);

            // Signal correct guess to stop timer and disable buttons
            setIsGuessedCorrectly(true);
            
            // Start the next round after a delay
            setTimeout(() => {
                // fetchRandomMovie will reset loading, guessedOptionId, and isGuessedCorrectly
                fetchRandomMovie();
            }, 1500);
        } else {
            playSound('alarm');
            
            // Remove error text feedback (per user request)
            setFeedback(null);

            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameOver(true);
                    // Set game over feedback message
                    setFeedback({ type: 'error', message: `Game Over! The movie was "${currentMovie.title}".` });
                }
                return newLives;
            });
        }
    };

    // --- Render Helpers ---

    const getImageUrl = () => {
        if (!currentMovie) return '';
        // Always use backdrop paths
        if (useApi && currentMovie.id > 10) {
            const path = currentMovie.backdrop_path;
            return path ? `${TMDB_IMAGE_BASE}${path}` : currentMovie.fallbackImage;
        }
        return currentMovie.fallbackImage;
    };

    // --- RENDER START SCREEN ---

    if (!hasStarted) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gray-900 text-white relative overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 bg-grid-white/[0.05]"></div>

                <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-gray-800/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-fuchsia-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)]">

                    {/* Logo/Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-cyan-600 rounded-full shadow-xl shadow-cyan-500/50 transform hover:scale-105 transition-transform duration-300">
                            <Clapperboard size={36} color="white" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-center text-white mb-2 tracking-tight">Guess the Movie </h1>
                    <p className="text-lg font-semibold text-center text-fuchsia-400 mb-6 uppercase tracking-wider">Bolly, Toons, & Heroes Edition</p>

                    {/* Info List */}
                    <div className="space-y-3 mb-8 text-left text-gray-300 border-t border-b border-gray-700 py-4">
                        <div className="flex items-center gap-3">
                            <Check size={18} className="text-emerald-400 flex-shrink-0" />
                            <span>Focus on **Bollywood**, **Animation**, and **Superheroes**</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-red-400 flex-shrink-0" />
                            <span>**10 Seconds** time limit per round</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Trophy size={18} className="text-yellow-400 flex-shrink-0" />
                            <span>**2 Points** awarded for every correct guess</span>
                        </div>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xl rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl shadow-cyan-600/40 transform hover:scale-[1.01] active:scale-[0.98]"
                    >
                        <Play size={24} fill="currentColor" />
                        Start Guessing
                    </button>
                    <p className="text-xs text-gray-500 mt-4">don't give up</p>
                </div>
            </div>
        );
    }

    // --- RENDER MAIN GAME ---
    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-gray-950 text-white relative">
            {/* Header / Scoreboard */}
            <header className="sticky top-0 z-50 w-full bg-gray-900/95 backdrop-blur-sm shadow-xl border-b border-fuchsia-700/30">
                <div className="max-w-7xl mx-auto flex justify-between items-center p-3 sm:p-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Clapperboard size={28} className="text-cyan-400" />
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                            MovieGuess
                        </h1>
                        <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                             {currentMovie?.mode}
                        </span>
                    </div>

                    {/* Status Area (Timer & Score) */}
                    <div className="flex items-center gap-3 sm:gap-5">
                        {/* Timer */}
                        <div className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all duration-500
                            ${timeLeft <= 4
                                ? 'bg-red-800 border-2 border-red-500 text-red-100 shadow-md shadow-red-500/30 animate-pulse-fast'
                                : 'bg-gray-800 border border-gray-700 text-gray-300'
                            }
                        `}>
                            <Clock size={16} />
                            <span className="text-lg font-mono">{timeLeft}s</span>
                        </div>

                        {/* Score (Now always visible but smaller on mobile) */}
                        <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold">
                            <Trophy size={20} className="fill-yellow-400" />
                            <span className="text-lg sm:text-xl">{score}</span>
                        </div>

                        {/* Lives */}
                        <div className="flex items-center gap-1 ml-2 sm:ml-0">
                            {[...Array(3)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={20}
                                    className={`
                                        transition-colors duration-300
                                        ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700 fill-gray-800'}
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content container width reduced to max-w-lg (shorter image) */}
            <main className="w-full max-w-lg mx-auto p-4 flex flex-col items-center gap-4 sm:gap-6 flex-grow">

                {/* Headline & Mode Badge (Title Shortened to "Guess!") */}
                <div className="text-center mt-2 w-full">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                      
                    </h2>
                    {/* Mode badge updated with Cyan/Fuchsia scheme */}
                    {currentMovie?.mode && currentMovie.mode !== 'Bollywood' && (
                        <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full border 
                            ${currentMovie.mode === 'Animation' ? 'text-fuchsia-300 bg-fuchsia-900/50 border-fuchsia-600' : 'text-cyan-300 bg-cyan-900/50 border-cyan-600'}
                        `}>
                            {currentMovie.mode === 'Animation' ? <Tv size={12} /> : <Eye size={12} />} {currentMovie.mode} Mode
                        </span>
                    )}
                </div>

                {/* Movie Frame (Image size fixed to 16:9) */}
                <div className="
                    w-full relative rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/50 transition-all duration-500
                    aspect-[16/9] max-w-full
                    mx-auto
                ">
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        {loading ? (
                            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : currentMovie ? (
                            <img
                                src={getImageUrl()}
                                alt="Guess the movie visual clue"
                                className="w-full h-full object-cover transition-opacity duration-700"
                                onError={(e) => { e.target.src = "https://placehold.co/1280x720/1f2937/ffffff?text=Image+Not+Found"; }}
                            />
                        ) : null}

                        {/* Game Over Overlay */}
                        {gameOver && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm p-4 animate-fadeIn z-20">
                                <h2 className="text-4xl font-black text-red-500 mb-3 drop-shadow-lg">GAME OVER</h2>
                                <p className="text-xl text-gray-300 mb-6">Final Score: <span className="text-yellow-400 font-extrabold">{score}</span></p>
                                <button onClick={startGame} className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full text-lg transition-all duration-200 shadow-xl shadow-cyan-600/40">
                                    <Play size={20} fill="currentColor" />
                                    Play Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Bar */}
                {/* Now only shows Game Over / Time Out messages */}
                {feedback && !loading && feedback.type === 'error' && gameOver && (
                    <div className={`
                        w-full p-3 rounded-xl text-center font-semibold text-lg animate-slideDown shadow-lg
                        bg-red-600/20 text-red-300 border border-red-500/50
                    `}>
                        {feedback.message}
                    </div>
                )}

                {/* Multiple Choice Buttons */}
                {!gameOver && !loading && (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 animate-slideUp">
                        {options.map((movie) => {
                            const isCorrect = movie.id === currentMovie.id;
                            const isGuessed = guessedOptionId === movie.id;
                            const isSuccessfulGuess = isGuessed && isCorrect;
                            const isFailedGuess = isGuessed && !isCorrect;
                            const disableAll = gameOver || isGuessedCorrectly; // Disable all buttons on successful guess

                            let buttonClasses = "w-full h-20 p-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center gap-3 active:scale-[0.99] transform";

                            // Disable interaction globally on success or game over
                            if (disableAll) {
                                buttonClasses += " pointer-events-none opacity-80";
                            }
                            
                            // Apply specific colors based on guess status
                            if (isSuccessfulGuess) {
                                // Green color applied for correct guess 
                                buttonClasses += " bg-emerald-600 border-2 border-emerald-400 text-white shadow-emerald-500/50";
                            } else if (isFailedGuess) {
                                // Red color applied only for the wrong option
                                buttonClasses += " bg-red-700 border-2 border-red-500 text-white shadow-red-500/50 pointer-events-none"; // Also disable the button after clicking wrong
                            } else {
                                // Default non-selected/non-disabled style (New Cyan theme)
                                buttonClasses += " bg-gray-800 border border-gray-700 text-white hover:bg-cyan-900/50 hover:border-cyan-500";
                            }

                            return (
                                <button
                                    key={movie.id}
                                    onClick={() => handleGuess(movie)}
                                    className={buttonClasses}
                                >
                                    <div className="flex-shrink-0 p-2 bg-fuchsia-600 rounded-full text-white">
                                        <Film size={18} />
                                    </div>
                                    <span className="line-clamp-2 flex-grow text-left">{movie.title}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
                
            </main>

            {/* Footer */}
            <footer className="w-full p-4 text-center text-sm text-gray-500 border-t border-gray-800 mt-auto">
                <p>copyright by Vijay</p>
            </footer>
        </div>
    );
}

// Custom CSS for the pulse effect in the timer and the background grid
// This minimal CSS is kept outside the component for global application of animations.
const tailwindCSSLikeStyles = `
/* Custom animation for urgency */
@keyframes pulse-fast {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
}

.animate-pulse-fast {
    animation: pulse-fast 1s infinite;
}

/* Custom background grid pattern for Start Screen */
.bg-grid-white\/[0\.05] {
    background-image: linear-gradient(0deg, transparent 24px, rgba(255, 255, 255, 0.05) 25px), linear-gradient(90deg, transparent 24px, rgba(255, 255, 255, 0.05) 25px);
    background-size: 25px 25px;
}

/* Custom fade in animation for elements */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
}

/* Custom slide down animation for feedback */
@keyframes slideDown { 
    from { opacity: 0; transform: translateY(-10px); } 
    to { opacity: 1; transform: translateY(0); } 
}
.animate-slideDown {
    animation: slideDown 0.3s ease-out;
}

/* Custom slide up animation for options */
@keyframes slideUp { 
    from { opacity: 0; transform: translateY(10px); } 
    to { opacity: 1; transform: translateY(0); } 
}
.animate-slideUp {
    animation: slideUp 0.5s ease-out;
}

.user-select-none {
    user-select: none;
}
`;
// Appending the minimal CSS for animations/effects
if (typeof window !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = tailwindCSSLikeStyles;
    document.head.appendChild(styleSheet);
}