import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import '../styles/HomePage.css'; // Import pliku CSS dla HomePage

function HomePage() {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loggedInEmail, setLoggedInEmail] = useState(null);
    const [role, setRole] = useState(null);
    const [searchTitle, setSearchTitle] = useState(""); // Stan dla paska wyszukiwania

    useEffect(() => {
        const token = localStorage.getItem("userToken");
        const savedEmail = localStorage.getItem("userEmail");
        const savedRole = localStorage.getItem("userRole");

        if (token && savedEmail && savedRole) {
            setLoggedInEmail(savedEmail);
            setRole(savedRole);
        } else {
            setLoggedInEmail(null);
            setRole(null);
        }
    }, []);

    const handleClick = () => {
        navigate('/SignUp');
    };

    const handleLogout = () => {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        setLoggedInEmail(null);
        setRole(null);
    };

    useEffect(() => {
        fetch('http://localhost:4000/api/v1/movie/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setMovies(data.movies);
                } else {
                    setError('Error fetching data.');
                }
            })
            .catch(() => {
                setError('Connection error with the API.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleSearch = () => {
        if (searchTitle.trim()) {
            navigate(`/Movie/title/${encodeURIComponent(searchTitle)}`);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="home-page">

            <h1 className="page-title">Welcome to the Home Page!</h1>

            {/* Display login information */}
            {loggedInEmail ? (
                <div className="login-status">
                    Welcome, {loggedInEmail} ({role})
                    <button onClick={handleLogout} className="logout-button">
                        Log out
                    </button>
                </div>
            ) : (
                <button onClick={handleClick} className="signup-button">Go to SignUp</button>
            )}

            {/* Additional buttons based on role */}
            {role === "admin" && (
                <div className="admin-buttons">
                    <Link to="/ManageAccounts">
                        <button className="admin-button">Manage Accounts</button>
                    </Link>
                </div>
            )}
            {role === "moderator" && (
                <div className="moderator-buttons">
                    <Link to="/ManageMovies">
                        <button className="moderator-button">Manage Movies</button>
                    </Link>
                </div>
            )}

            {/* Search bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Enter movie title"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="search-input"
                />
                <button onClick={handleSearch} className="search-button">Search</button>
            </div>

            <h2>Movie List</h2>
            <ul className="movies-list">
                {movies.map((movie) => (
                    <li key={movie.movie_id} className="movie-item">
                        <Link to={`/Movie/title/${encodeURIComponent(movie.title)}`} className="movie-link">
                            <h3 className="movie-title">{movie.title} ({movie.episodes} episodes)</h3>
                        </Link>
                        <p className="movie-synopsis">{movie.synopsis}</p>
                        <p className="movie-score">Rating: {movie.score}</p>
                    </li>
                ))}
            </ul>

            <Footer />
        </div>
    );
}

export default HomePage;
