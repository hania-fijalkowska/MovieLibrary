import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";
import '../styles/MovieDetails.css';

function MovieDetails() {
    const { movieTitle } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState("");
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState("");
    const [editFormData, setEditFormData] = useState({
        title: "",
        episodes: "",
        synopsis: "",
    });
    const [castMembers, setCastMembers] = useState([]);
    const [newCastName, setNewCastName] = useState("");
    const [personId, setPersonId] = useState("");

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
                    fetchReviews(data.movie.movie_id);
                    fetchCast(data.movie.movie_id);
                } else {
                    setError('Error fetching movie data.');
                }
            })
            .catch(() => {
                setError('Connection error with the API.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [movieTitle]);

    const fetchReviews = async (movieId) => {
        try {
            const response = await fetch(`http://localhost:4000/api/v1/review/${movieId}`);
            const data = await response.json();
            if (data.success) {
                setReviews(data.reviews || []);
            }
        } catch (error) {
            setError('Connection error with the API.');
        }
    };

    const fetchCast = async (movieId) => {
        try {
            const response = await fetch(`http://localhost:4000/api/v1/cast/movie/${movieId}/cast`);
            const data = await response.json();
            if (data.success) {
                setCastMembers(data.data || []);
            }
        } catch (error) {
            setError('Error fetching cast data.');
        }
    };

    const handleAddCast = async (event) => {
        event.preventDefault();

        if (!movie || !personId || !newCastName) {
            setMessage("All fields are required.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/cast/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                    movieId: movie.movie_id,
                    personId: personId,
                    castName: newCastName,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage("Cast member added successfully!");
                fetchCast(movie.movie_id);
                setNewCastName("");
                setPersonId("");
            } else {
                setMessage(data.message || "Error adding cast member.");
            }
        } catch (error) {
            setMessage("Failed to add cast member.");
        }
    };

    const handleDeleteCast = async (personId) => {
        if (!personId) {
            setMessage("Invalid cast member ID.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/cast/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({
                    movieId: movie.movie_id,
                    personId: personId
                }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage("Cast member deleted successfully.");
                fetchCast(movie.movie_id); // Refresh the cast list after deletion
            } else {
                setMessage(data.message || "Error deleting cast member.");
            }
        } catch (error) {
            setMessage("Failed to delete cast member.");
        }
    };

    const handleScoreSubmit = async (event) => {
        event.preventDefault();
        if (score < 1 || score > 10) {
            setMessage("Rating must be a number between 1 and 10.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/score/${movie.movie_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({ score })
            });
            const data = await response.json();
            if (data.success) {
                setMessage("Rating has been successfully added/updated!");
                setMovie(prevMovie => ({
                    ...prevMovie,
                    score: (prevMovie.score * prevMovie.num_scores + score) / (prevMovie.num_scores + 1)
                }));
            } else {
                setMessage(data.message || "Error while adding rating.");
            }
        } catch (error) {
            setMessage("Failed to add rating.");
        }
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault();
        if (!newReview.trim()) {
            setMessage("Review cannot be empty.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/review/${movie.movie_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({ review: newReview })
            });

            const data = await response.json();
            if (data.success) {
                setMessage("Review has been successfully added!");
                setNewReview('');
                fetchReviews(movie.movie_id);
            } else {
                setMessage(data.message || "Error while adding review.");
            }
        } catch (error) {
            setMessage("Failed to add review.");
        }
    };

    // Handle movie deletion
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
            navigate("/"); // Navigate back to home or any other page after deletion
        } catch (error) {
            console.error("Error deleting movie:", error);
            setMessage("Failed to delete movie.");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const userRole = localStorage.getItem("userRole");

    return (
        <div className="movie-details">
            <BackToHomeButton />
            <div className="movie-header">
                <img src={movie.poster_url} alt={movie.title} />
                <h1>{movie.title}</h1>
                <p>{movie.synopsis}</p>
                <p>Rating: {movie.score}</p>
                <p>Episodes: {movie.episodes}</p>
            </div>

            <div className="movie-actions">
                {/* Rating and Review submission form only for users */}
                {userRole === "user" && (
                    <>
                        <div className="rating-section">
                            <form onSubmit={handleScoreSubmit}>
                                <label>Your rating (1-10):
                                    <input
                                        type="number"
                                        value={score}
                                        onChange={(e) => setScore(Number(e.target.value))}
                                        min="1"
                                        max="10"
                                    />
                                </label>
                                <button type="submit">Add/Update Rating</button>
                            </form>
                        </div>

                        <div className="review-section">
                            <h3>Add a Review</h3>
                            <form onSubmit={handleReviewSubmit} className="review-form">
                                <textarea
                                    value={newReview}
                                    onChange={(e) => setNewReview(e.target.value)}
                                    placeholder="Write your review"
                                />
                                <button type="submit">Add Review</button>
                            </form>
                        </div>
                    </>
                )}

                {/* Displaying reviews */}
                <div className="reviews-list">
                    <h3>Reviews:</h3>
                    {reviews.length === 0 ? (
                        <p>No reviews yet. Be the first to write one!</p>
                    ) : (
                        reviews.map((review, index) => (
                            <div key={index} className="review">
                                <p><strong>User {review.user_id}</strong></p>
                                <p>{review.review}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Cast display for all users, edit only for moderators */}
                <div>
                    <h2>Cast Members</h2>
                    {castMembers.length === 0 ? (
                        <p>No cast members added yet.</p>
                    ) : (
                        castMembers.map((cast, index) => (
                            <div key={index}>
                                <p>
                                    <strong>
                                        <Link to={`/person/${cast.person_id}`}>{cast.cast_name}</Link>
                                    </strong>
                                </p>
                                {userRole === "moderator" && (
                                    <button onClick={() => handleDeleteCast(cast.person_id)}>Delete</button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add Cast section for moderators */}
                {userRole === "moderator" && (
                    <div className="add-cast">
                        <h3>Add Cast Member</h3>
                        <form onSubmit={handleAddCast}>
                            <input
                                type="text"
                                value={newCastName}
                                onChange={(e) => setNewCastName(e.target.value)}
                                placeholder="Cast Member Name"
                                required
                            />
                            <input
                                type="text"
                                value={personId}
                                onChange={(e) => setPersonId(e.target.value)}
                                placeholder="Person ID"
                                required
                            />
                            <button type="submit">Add Cast</button>
                        </form>
                    </div>
                )}

                {/* Delete movie section for moderators */}
                {userRole === "moderator" && (
                    <div className="delete-movie">
                        <button onClick={handleDelete} className="delete-movie-button">Delete Movie</button>
                    </div>
                )}
            </div>

            {message && <p>{message}</p>}
            <Footer />
        </div>
    );
}

export default MovieDetails;
