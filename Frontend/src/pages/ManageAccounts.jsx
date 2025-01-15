import React, { useEffect, useState } from "react";
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

function ManageAccountsPage() {
    const [users, setUsers] = useState([]); // Stan do przechowywania listy użytkowników
    const [loading, setLoading] = useState(true); // Stan ładowania
    const [error, setError] = useState(null); // Stan błędu
    const [newAccount, setNewAccount] = useState({ email: "", username: "", password: "", role: "" }); // Stan formularza
    const [formError, setFormError] = useState(""); // Błąd formularza

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("userToken"); // Pobranie tokena z localStorage

            if (!token) {
                setError("Brak tokenu użytkownika. Zaloguj się ponownie.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("http://localhost:4000/api/v1/user/all", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`, // Dodanie tokena do nagłówka
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setUsers(data.data); // Zapisanie listy użytkowników w stanie
                } else {
                    setError(data.message || "Nie udało się pobrać użytkowników.");
                }
            } catch (error) {
                setError("Błąd podczas pobierania użytkowników.");
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false); // Zakończenie ładowania
            }
        };

        fetchUsers();
    }, []); // Efekt uruchomi się raz przy pierwszym renderze

    const handleDelete = async (username) => {
        const token = localStorage.getItem("userToken"); // Pobranie tokena z localStorage

        if (!token) {
            alert("Brak tokenu użytkownika. Zaloguj się ponownie.");
            return;
        }

        if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika: ${username}?`)) {
            return; // Przerwij jeśli użytkownik anulował
        }

        try {
            const response = await fetch(`http://localhost:4000/api/v1/user/profile/${username}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`, // Dodanie tokena do nagłówka
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Nie udało się usunąć użytkownika.");
            }

            // Usuń użytkownika z lokalnego stanu po pomyślnym usunięciu na serwerze
            setUsers((prevUsers) => prevUsers.filter((user) => user.username !== username));
            alert(`Użytkownik ${username} został usunięty pomyślnie.`);
        } catch (error) {
            alert(`Błąd podczas usuwania użytkownika: ${error.message}`);
            console.error("Error deleting user:", error);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setNewAccount((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const { email, username, password, role } = newAccount;

        // Walidacja formularza
        if (!email || !username || !password || !role) {
            setFormError("Wszystkie pola są wymagane.");
            return;
        }

        setFormError(""); // Reset błędu formularza

        const token = localStorage.getItem("userToken"); // Pobranie tokena z localStorage
        if (!token) {
            alert("Brak tokenu użytkownika. Zaloguj się ponownie.");
            return;
        }

        try {
            const response = await fetch("http://localhost:4000/api/v1/register/admin", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Dodanie tokena do nagłówka
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, username, password, role }), // Ciało zapytania
            });

            const data = await response.json();

            if (response.ok) {
                alert("Konto zostało pomyślnie utworzone!");
                // Reset formularza
                setNewAccount({ email: "", username: "", password: "", role: "" });
            } else {
                alert(data.message || "Wystąpił błąd podczas tworzenia konta.");
            }
        } catch (error) {
            alert("Błąd podczas tworzenia konta.");
            console.error("Error creating account:", error);
        }
    };

    if (loading) {
        return <div>Ładowanie listy użytkowników...</div>;
    }

    if (error) {
        return <div>Błąd: {error}</div>;
    }

    return (
        <div>
            <BackToHomeButton />
            <h1>Lista użytkowników</h1>
            <form onSubmit={handleFormSubmit} style={{ marginBottom: "20px" }}>
                <h2>Tworzenie konta</h2>
                {formError && <div style={{ color: "red" }}>{formError}</div>}
                <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={newAccount.email}
                        onChange={handleFormChange}
                        required
                    />
                </label>
                <br />
                <label>
                    Username:
                    <input
                        type="text"
                        name="username"
                        value={newAccount.username}
                        onChange={handleFormChange}
                        required
                    />
                </label>
                <br />
                <label>
                    Password:
                    <input
                        type="password"
                        name="password"
                        value={newAccount.password}
                        onChange={handleFormChange}
                        required
                    />
                </label>
                <br />
                <label>
                    Role:
                    <select
                        name="role"
                        value={newAccount.role}
                        onChange={handleFormChange}
                        required
                    >
                        <option value="">Wybierz rolę</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                    </select>
                </label>
                <br />
                <button type="submit">Utwórz konto</button>
            </form>

            <table border="1" style={{ width: "100%", textAlign: "left", marginTop: "20px" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Access Level</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id}>
                            <td>{user.user_id}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.access_level}</td>
                            <td>
                                {user.access_level !== "admin" && (
                                    <button
                                        style={{
                                            color: "white",
                                            backgroundColor: "red",
                                            border: "none",
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleDelete(user.username)}
                                    >
                                        X
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Footer />
        </div>
    );
}

export default ManageAccountsPage;
