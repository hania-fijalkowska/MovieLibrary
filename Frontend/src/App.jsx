import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './styles/App.css';
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ManageMoviesPage from "./pages/ManageMovies.jsx";
import ManageAccountsPage from "./pages/ManageAccounts.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import PersonDetails from './pages/PersonDetails';

function App() {
    const token = localStorage.getItem("userToken");
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={<HomePage token={token} email={email} role={role} />}
                />
                <Route path="/SignUp" element={<SignUpPage />} />
                <Route path="/Movie/title/:movieTitle" element={<MovieDetails />} />
                <Route path="/ManageMovies" element={<ManageMoviesPage />} />
                <Route path="/ManageAccounts" element={<ManageAccountsPage />} />
                <Route path="/person/:personId" element={<PersonDetails />} />

            </Routes>
        </Router>
    );
}

export default App;
