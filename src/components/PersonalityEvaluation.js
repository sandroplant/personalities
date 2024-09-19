import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PersonalityEvaluation = () => {
    const [evaluations, setEvaluations] = useState([]);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                const { data } = await axios.get('/api/evaluations');
                setEvaluations(data);
            } catch (error) {
                console.error('Error fetching evaluations:', error);
            }
        };

        fetchEvaluations();
    }, []);

    return (
        <div>
            <h1>Personality Evaluations</h1>
            <ul>
                {evaluations.map((evaluation) => (
                    <li key={evaluation.id}>
                        <h3>{evaluation.name}</h3>
                        <p>Score: {evaluation.score}</p>
                        <p>Criteria: {evaluation.criteria}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PersonalityEvaluation;
