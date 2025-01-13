import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

function MovieDetails() {
    const { movieTitle } = useParams(); // Pobieramy movieTitle z URL
    const [movie, setMovie] = useState(null); // Stan do przechowywania szczegółów filmu
    const [loading, setLoading] = useState(true); // Stan ładowania
    const [error, setError] = useState(null); // Stan błędu
    const [editFormData, setEditFormData] = useState({
        title: "",
        episodes: "",
        synopsis: "",
    });

    useEffect(() => {
        // Kodowanie tytułu, aby obsłużyć spacje i znaki specjalne
        const encodedTitle = encodeURIComponent(movieTitle);

        // Pobieranie szczegółów filmu z API na podstawie tytułu
        fetch(`http://localhost:4000/api/v1/movie/title/${encodedTitle}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setMovie(data.movie); // Ustawienie danych filmu
                    setEditFormData({
                        title: data.movie.title,
                        episodes: data.movie.episodes,
                        synopsis: data.movie.synopsis,
                    });
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

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: name === "episodes" ? parseFloat(value) : value,
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        // Dodaj logikę aktualizacji szczegółów filmu
        console.log("Edytowanie filmu: ", editFormData);
    };

    const handleDelete = async () => {
        const token = localStorage.getItem("userToken");

        if (!token) {
            console.error("No user token found in localStorage");
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/movie/${movie.movie_id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            console.log("Movie deleted successfully");
            // Additional logic for handling post-deletion, like redirecting or updating state
        } catch (error) {
            console.error("Error deleting movie:", error);
        }
    };

    if (loading) {
        return <div>Ładowanie...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const userRole = localStorage.getItem("userRole");

    return (
        <div>
            <BackToHomeButton/>
            <h1>{movie.title}</h1>
            <p>{movie.synopsis}</p>
            <p>Ocena: {movie.score}</p>
            <p>Liczba epizodów: {movie.episodes}</p>

            {userRole === "moderator" && (
                <div>
                    <h2>Edytuj szczegóły filmu</h2>
                    <form onSubmit={handleEditSubmit}>
                        <div>
                            <label htmlFor="title">Title:</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={editFormData.title}
                                onChange={handleEditInputChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="episodes">Episodes:</label>
                            <input
                                type="number"
                                id="episodes"
                                name="episodes"
                                value={editFormData.episodes}
                                onChange={handleEditInputChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="synopsis">Synopsis:</label>
                            <textarea
                                id="synopsis"
                                name="synopsis"
                                value={editFormData.synopsis}
                                onChange={handleEditInputChange}
                            ></textarea>
                        </div>

                        <button type="submit">Submit</button>
                    </form>

                    <button onClick={handleDelete} style={{ marginTop: "10px", color: "red" }}>
                        Delete Movie
                    </button>
                </div>
            )}

            <Footer/>
        </div>
    );
}

export default MovieDetails;
