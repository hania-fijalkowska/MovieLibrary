import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

function MovieDetails() {
    const { movieTitle } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        episodes: "",
        synopsis: "",
    });

    useEffect(() => {
        const encodedTitle = encodeURIComponent(movieTitle);

        fetch(`http://localhost:4000/api/v1/movie/title/${encodedTitle}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setMovie(data.movie);
                    setEditFormData({
                        title: data.movie.title,
                        episodes: data.movie.episodes,
                        synopsis: data.movie.synopsis,
                    });
                } else {
                    setError('Błąd podczas pobierania danych filmu.');
                }
            })
            .catch(() => {
                setError('Błąd połączenia z API.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [movieTitle]);

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: name === "episodes" ? parseFloat(value) : value,
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("userToken");

        if (!token) {
            console.error("No user token found in localStorage");
            return;
        }

        const requestBody = {
            newTitle: editFormData.title,
            newEpisodes: editFormData.episodes,
            newSynopsis: editFormData.synopsis,
        };

        try {
            const response = await fetch(`http://localhost:4000/api/v1/movie/${movie.movie_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            if (editFormData.title === movie.title) {
                // Jeśli tytuł się nie zmienił, odśwież stronę
                window.location.reload();
            } else {
                // Jeśli tytuł się zmienił, przekieruj na nową stronę
                const newTitleEncoded = encodeURIComponent(editFormData.title);
                navigate(`/movie/title/${newTitleEncoded}`);
            }
        } catch (error) {
            console.error("Error updating movie:", error);
        }
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
            navigate("/");
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
            <BackToHomeButton />
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

            <Footer />
        </div>
    );
}

export default MovieDetails;
