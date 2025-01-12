import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BackToHomeButton.css';  // Dodatkowy plik CSS dla stylów

function BackToHomeButton() {
    const navigate = useNavigate(); // Hook do nawigacji

    const handleClick = () => {
        navigate('/'); // Przechodzi na stronę główną
    };

    return (
        <button onClick={handleClick} className="back-to-home-button">
            Wróć do strony głównej
        </button>
    );
}

export default BackToHomeButton;
