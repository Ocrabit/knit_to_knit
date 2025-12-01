import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from "../../services/auth.service";
import '../../styles/pages.css';
import Card from '../../components/Card/Card';
import AddCard from '../../components/Card/AddCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentPatterns, setRecentPatterns] = useState([]);
  const [recentGrids, setRecentGrids] = useState([]);

  useEffect(() => {
    fetchRecentPatterns();
    //fetchRecentGrids();
  }, []);

  const fetchRecentPatterns = async () => {
    try {
      const response = await axiosInstance.get('/user-patterns/');
      setRecentPatterns(response.data.slice(0, 3)); // Fetch the 3 most recent patterns
    } catch (error) {
      console.error('Error fetching recent patterns:', error);
    }
  };

  const fetchRecentGrids = async () => {
    try {
      const response = await fetch('/user-grid-designs'); // Adjust API endpoint
      const data = await response.json();
      setRecentGrids(data.slice(0, 3)); // Fetch the 3 most recent grid designs
    } catch (error) {
      console.error('Error fetching recent grids:', error);
    }
  };

  return (
      <div className="page-container centered">
          <h1>Your Dashboard</h1>
          {/* Recent Patterns Section in Card Format */}
          <div className="recent-section">
              <h3>Recent Patterns</h3>
              <div className="card-container">
                  {recentPatterns.map((pattern, index) => (
                      <Card key={pattern.id} index={index} onClick={() => navigate(`/pattern-view/${pattern.id}`)}>
                          <h2>{pattern.name}</h2>
                          <p>{pattern.content}</p>
                          <small>Created: {new Date(pattern.created_on).toLocaleDateString()}</small>
                          <small>Edited: {new Date(pattern.edited_on).toLocaleDateString()}</small>
                      </Card>
                  ))}
                  <AddCard onClick={() => navigate('/create-pattern')} label="New Pattern" index={recentPatterns.length} />
              </div>
          </div>

          {/* Recent Grid Designs Section in Card Format */}
          <div className="recent-section">
              <h3>Recent Designs</h3>
              <div className="card-container">
                  {recentGrids.map((grid, index) => (
                      <Card key={grid.id} index={index} onClick={() => navigate(`/design-view/${grid.id}`)}>
                          <h2>{grid.name}</h2>
                          <p>{grid.content}</p>
                          <small>Created: {new Date(grid.created_on).toLocaleDateString()}</small>
                          <small>Edited: {new Date(grid.edited_on).toLocaleDateString()}</small>
                      </Card>
                  ))}
                  <AddCard onClick={() => navigate('/create-design')} label="New Design" index={recentGrids.length} />
              </div>
          </div>
      </div>
  );
};

export default Dashboard;