import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

function MovieDetails() {
    const { movieTitle } = useParams(); // Pobieramy movieTitle z URL
    const [movie, setMovie] = useState(null); // Stan do przechowywania szczegółów filmu
    const [loading, setLoading] = useState(true); // Stan ładowania
    const [error, setError] = useState(null); // Stan błędu

    useEffect(() => {
        // Kodowanie tytułu, aby obsłużyć spacje i znaki specjalne
        const encodedTitle = encodeURIComponent(movieTitle);

        // Pobieranie szczegółów filmu z API na podstawie tytułu
        fetch(`http://localhost:4000/api/v1/movie/title/${encodedTitle}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setMovie(data.movie); // Ustawienie danych filmu
                } else {
                    setError('Błąd podczas pobierania danych filmu.');
                }
            })
            .catch(error => {
                setError('Błąd połączenia z API.');
            })
            .finally(() => {
                setLoading(false); // Zakończenie ładowania
            });
    }, [movieTitle]); // Efekt wywołuje się przy każdej zmianie movieTitle

    if (loading) {
        return <div>Ładowanie...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <BackToHomeButton/>
            <h1>{movie.title}</h1>
            <p>{movie.synopsis}</p>
            <p>Ocena: {movie.score}</p>
            <p>Liczba epizodów: {movie.episodes}</p>
            <Footer/>
        </div>
    );
}

export default MovieDetails;
