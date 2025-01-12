import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

function HomePage() {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]); // Stan do przechowywania filmów
    const [loading, setLoading] = useState(true); // Stan ładowania
    const [error, setError] = useState(null); // Stan błędu
    const [loggedInEmail, setLoggedInEmail] = useState(null); // Stan dla e-maila po zalogowaniu
    const [role, setRole] = useState(null); // Stan dla roli użytkownika

    // Sprawdzamy, czy użytkownik jest zalogowany przy pierwszym renderze lub po wylogowaniu
    useEffect(() => {
        const token = localStorage.getItem("userToken");
        const savedEmail = localStorage.getItem("userEmail");
        const savedRole = localStorage.getItem("userRole");

        console.log(savedEmail, savedRole, token);
        if (token && savedEmail && savedRole) {
            console.log(savedEmail);
            setLoggedInEmail(savedEmail); // Ustawiamy e-mail użytkownika
            setRole(savedRole); // Ustawiamy rolę użytkownika
        } else {
            setLoggedInEmail(null);
            setRole(null);
        }
    }, []); // Efekt odpala się raz, przy pierwszym renderze

    const handleClick = () => {
        navigate('/SignUp');
    };

    const handleLogout = () => {
        // Usuwamy dane z localStorage przy wylogowywaniu
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        setLoggedInEmail(null);
        setRole(null); // Resetujemy rolę
    };

    useEffect(() => {
        // Pobieranie danych z API
        fetch('http://localhost:4000/api/v1/movie/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setMovies(data.movies); // Ustawienie danych filmów
                } else {
                    setError('Błąd podczas pobierania danych.');
                }
            })
            .catch(error => {
                setError('Błąd połączenia z API.');
            })
            .finally(() => {
                setLoading(false); // Zakończenie ładowania
            });
    }, []); // Efekt wywołuje się tylko raz po załadowaniu komponentu

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

            {/* Dodatkowe przyciski dla admina/moderatora */}
            {role === "admin" || role === "moderator" ? (
                <div>
                    <Link to="/ManageMovies">
                        <button>Manage Movies</button>
                    </Link>
                    <Link to="/ManageAccounts">
                        <button>Manage Accounts</button>
                    </Link>
                </div>
            ) : null}

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
