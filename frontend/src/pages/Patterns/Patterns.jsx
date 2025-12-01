import React, { useEffect, useState } from 'react';
import {axiosInstance} from '../../services/auth.service'
import {useNavigate} from "react-router-dom";
import '../../styles/pages.css';
import Card from '../../components/Card/Card';
import AddCard from '../../components/Card/AddCard';

const Patterns = () => {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatterns = async () => {
            try {
                // Use axiosInstance to ensure the Authorization header is sent
                const response = await axiosInstance.get('/user-patterns/');
                setPatterns(response.data);
                setLoading(false);
            } catch (error) {
                setError('Error fetching patterns');
                setLoading(false);
            }
        };

        fetchPatterns();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="page-container centered">
            <h1>Your Patterns</h1>
            <div className="card-container">
                {patterns.map((pattern, index) => (
                    <Card key={pattern.id} index={index} onClick={() => navigate(`/pattern-view/${pattern.id}`)}>
                        <h2>{pattern.name}</h2>
                        <p>{pattern.content}</p>
                        <small>Created at: {new Date(pattern.created_on).toLocaleString()}</small>
                        <small>Last Edited: {new Date(pattern.edited_on).toLocaleString()}</small>
                    </Card>
                ))}
                <AddCard
                    onClick={() => navigate('/create-pattern')}
                    label="New Pattern"
                    index={patterns.length}
                />
            </div>
        </div>
    );
};

export default Patterns;