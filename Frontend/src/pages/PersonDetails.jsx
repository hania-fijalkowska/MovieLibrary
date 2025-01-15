import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/PersonDetails.css';  // Importowanie zewnętrznych stylów

function PersonDetails() {
    const { personId } = useParams();
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:4000/api/v1/person/${personId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setPerson(data.data);
                } else {
                    setError('Error fetching person details.');
                }
            })
            .catch(() => {
                setError('Connection error with the API.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [personId]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="person-details-container">
            <div className="person-details">
                <h1 className="person-name">{person.first_name} {person.last_name}</h1>
                <div className="person-info">
                    <div className="person-info-item">
                        <strong>Gender:</strong> {person.gender}
                    </div>
                    <div className="person-info-item">
                        <strong>Birth Year:</strong> {person.birth_year}
                    </div>
                    <div className="person-info-item">
                        <strong>Birth Country:</strong> {person.birth_country}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PersonDetails;
