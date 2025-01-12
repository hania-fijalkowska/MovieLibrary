import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

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
                    setError('Błąd podczas pobierania danych.');
                }
            })
            .catch(() => {
                setError('Błąd połączenia z API.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleSearch = () => {
        // Przekierowanie do strony filmu z tytułem wpisanym w input box
        if (searchTitle.trim()) {
            navigate(`/Movie/title/${encodeURIComponent(searchTitle)}`);
        }
    };

    if (loading) {
        return <div>Ładowanie...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <BackToHomeButton />
            <h1>HomePage</h1>

            {/* Wyświetlanie informacji o logowaniu */}
            {loggedInEmail ? (
                <div className="login-status">
                    Witaj, {loggedInEmail} ({role})
                    <button onClick={handleLogout} className="logout-button">
                        Wyloguj się
                    </button>
                </div>
            ) : (
                <button onClick={handleClick}>Przejdź do SignUp</button>
            )}

            {/* Dodatkowe przyciski w zależności od roli */}
            {role === "admin" && (
                <div>
                    <Link to="/ManageAccounts">
                        <button>Manage Accounts</button>
                    </Link>
                </div>
            )}
            {role === "moderator" && (
                <div>
                    <Link to="/ManageMovies">
                        <button>Manage Movies</button>
                    </Link>
                </div>
            )}

            {/* Pasek wyszukiwania */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Wpisz tytuł filmu"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                />
                <button onClick={handleSearch}>Szukaj</button>
            </div>

            <h2>Lista filmów</h2>
            <ul>
                {movies.map((movie) => (
                    <li key={movie.movie_id}>
                        <Link to={`/Movie/title/${encodeURIComponent(movie.title)}`}>
                            <h3>{movie.title} ({movie.episodes} epizodów)</h3>
                        </Link>
                        <p>{movie.synopsis}</p>
                        <p>Ocena: {movie.score}</p>
                    </li>
                ))}
            </ul>

            <Footer />
        </div>
    );
}

export default HomePage;
