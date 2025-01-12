import React, { useState } from "react";
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";
import { useNavigate } from "react-router-dom";

function SignUpPage() {
    const [email, setEmail] = useState(""); // Stan dla email
    const [password, setPassword] = useState(""); // Stan dla hasła
    const [username, setUsername] = useState(""); // Stan dla username
    const [isLogin, setIsLogin] = useState(true); // Określamy, czy formularz jest dla logowania czy rejestracji
    const [loading, setLoading] = useState(false); // Stan ładowania
    const [error, setError] = useState(null); // Stan błędu

    const navigate = useNavigate(); // Hook do nawigacji

    const fetchUserDetails = async () => {

            const url = "http://localhost:4000/api/v1/user/profile/" // API do logowania

            fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.userToken}`,
                    "Content-Type": "application/json",
                }
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {

                        localStorage.setItem("userRole", data.data.access_level);
                        navigate("/"); // Przekierowanie na stronę główną


                    } else {
                        setError(data.message || "Błąd podczas pobierania detali uzytkownika.");
                    }
                })
                .catch(() => setError("Błąd połączenia z serwerem."))
                .finally(() => setLoading(false));
        };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const url = isLogin
            ? "http://localhost:4000/api/v1/login" // API do logowania
            : "http://localhost:4000/api/v1/register"; // API do rejestracji

        const userData = isLogin
            ? { email, password }
            : { email, password, username }; // Dodanie username przy rejestracji

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        })
            .then((response) => response.json())
            .then(async(data) => {
                if (data.success) {
                    // Zapisanie tokenu, e-maila i roli w localStorage
                    localStorage.setItem("userToken", data.token);
                    localStorage.setItem("userEmail", email);
                    await fetchUserDetails();

                } else {
                    setError(data.message || "Błąd podczas logowania/rejestracji.");
                }
            })
            .catch(() => setError("Błąd połączenia z serwerem."))
            .finally(() => setLoading(false));
    };

    const handleLogout = () => {
        // Usuwamy dane z localStorage przy wylogowywaniu
        localStorage.removeItem("userToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        navigate("/"); // Po wylogowaniu przekierowujemy na stronę główną
    };

    return (
        <div>
            <BackToHomeButton />
            <h1>{isLogin ? "Logowanie" : "Rejestracja"}</h1>

            {/* Jeśli użytkownik jest zalogowany, wyświetlamy email */}
            {localStorage.getItem("userEmail") ? (
                <div className="login-status">
                    Witaj, {localStorage.getItem("userEmail")} ({localStorage.getItem("userRole")})
                    <button onClick={handleLogout} className="logout-button">
                        Wyloguj się
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="form">
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <div>
                        <label htmlFor="email">E-mail</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Hasło</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Pole dla username tylko w przypadku rejestracji */}
                    {!isLogin && (
                        <div>
                            <label htmlFor="username">Nazwa użytkownika</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading
                            ? isLogin
                                ? "Logowanie..."
                                : "Rejestracja..."
                            : isLogin
                                ? "Zaloguj się"
                                : "Zarejestruj się"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="toggle-form"
                    >
                        {isLogin
                            ? "Nie masz konta? Zarejestruj się"
                            : "Masz już konto? Zaloguj się"}
                    </button>
                </form>
            )}

            <Footer />
        </div>
    );
}

export default SignUpPage;
