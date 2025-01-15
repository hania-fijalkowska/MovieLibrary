import React, { useState } from "react";
import Footer from "../components/Footer.jsx";
import BackToHomeButton from "../components/BackToHomeButton.jsx";

function ManageMoviesPage() {
    const [formData, setFormData] = useState({
        title: "",
        episodes: "",
        synopsis: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "episodes" ? parseFloat(value) : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("userToken");

        if (!token) {
            console.error("No user token found in localStorage");
            return;
        }

        try {
            const response = await fetch("http://localhost:4000/api/v1/movie/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Movie added successfully:", data);
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <div>
            <BackToHomeButton />
            <h1>Manage Movies Page</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        maxLength="100"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                    />
                </div>

                <div>
                    <label htmlFor="episodes">Episodes:</label>
                    <input
                        type="number"
                        id="episodes"
                        name="episodes"
                        value={formData.episodes}
                        onChange={handleInputChange}
                    />
                </div>

                <div>
                    <label htmlFor="synopsis">Synopsis:</label>
                    <textarea
                        id="synopsis"
                        name="synopsis"
                        value={formData.synopsis}
                        onChange={handleInputChange}
                    ></textarea>
                </div>

                <button type="submit">Submit</button>
            </form>
            <Footer />
        </div>
    );
}

export default ManageMoviesPage;
