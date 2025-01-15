import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";
import '../styles/MovieDetails.css'; // Zaktualizowany import pliku CSS

function MovieDetails() {
    const { movieTitle } = useParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState("");
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState("");

    useEffect(() => {
        const encodedTitle = encodeURIComponent(movieTitle);
        fetch(`http://localhost:4000/api/v1/movie/title/${encodedTitle}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setMovie(data.movie);
                    fetchReviews(data.movie.movie_id);
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
                setReviews(data.reviews || []); // Ensure reviews are an empty array if none exist
            }

        } catch (error) {
            setError('Connection error with the API.');
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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="movie-details">
            <BackToHomeButton />
            <div className="movie-header">
                <img src={movie.poster_url} alt={movie.title} />
                <h1>{movie.title}</h1>
                <p>{movie.synopsis}</p>
                <p>Rating: {movie.score}</p>
                <p>Number of episodes: {movie.episodes}</p>
            </div>

            {/* Rating submission form */}
            <div className="rating-section">
                <form onSubmit={handleScoreSubmit}>
                    <label>
                        Your rating (1-10):
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

            {/* Review submission form */}
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

            <Footer />
        </div>
    );
}

export default MovieDetails;
