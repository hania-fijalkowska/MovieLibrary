import React from 'react';
import '../styles/Footer.css';  // Dodatkowy plik CSS dla stylów

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-logo">
                    <h2>MovieDB</h2>
                    <p>Explore the world of movies!</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2025 MovieDB. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
