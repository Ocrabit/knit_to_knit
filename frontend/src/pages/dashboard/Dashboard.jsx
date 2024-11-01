import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from "../../services/auth.service";
import './Dashboard.css';
import '../../styles/Cards.css'

const Dashboard = () => {
  const [recentPatterns, setRecentPatterns] = useState([]);
  const [recentGrids, setRecentGrids] = useState([]);

  useEffect(() => {
    fetchRecentPatterns();
    //fetchRecentGrids();
  }, []);

  const fetchRecentPatterns = async () => {
    try {
      const response = await axiosInstance.get('/api/user-patterns/');
      setRecentPatterns(response.data.slice(0, 3)); // Fetch the 3 most recent patterns
    } catch (error) {
      console.error('Error fetching recent patterns:', error);
    }
  };

  const fetchRecentGrids = async () => {
    try {
      const response = await fetch('/api/user-grid-designs'); // Adjust API endpoint
      const data = await response.json();
      setRecentGrids(data.slice(0, 3)); // Fetch the 3 most recent grid designs
    } catch (error) {
      console.error('Error fetching recent grids:', error);
    }
  };

  return (
      <div className="page-container">
          {/* Welcome/Thank You message */}
          <div className="welcome-message">
              <h2>Welcome!</h2>
              <p>Thank you for trying us out! Here’s a quick look at your recent patterns and grid designs.</p>
          </div>
          <h1>Dashboard</h1>
          {/* Recent Patterns Section in Card Format */}
          <div className="recent-section">
              <h3>3 Recent Patterns</h3>
              <div>
                  <div className="card-container">
                      {recentPatterns.map((pattern) => (
                          <div className="card" key={pattern.id}>
                              <h2>{pattern.name}</h2>
                              <p>{pattern.content}</p>
                              <small>Created at: {new Date(pattern.created_on).toLocaleString()}</small>
                              <small>Last Edited: {new Date(pattern.edited_on).toLocaleString()}</small>
                          </div>
                      ))}
                  </div>
              </div>
              <Link to="/create-pattern" className="quick-link">
                  Quick Link to New Pattern
              </Link>
          </div>

          {/* Recent Grid Designs Section in Card Format */}
          <div className="recent-section">
              <h3>3 Recent Grid Designs</h3>
              <div>
                  <div className="card-container">
                      {recentGrids.map((grid) => (
                          <div className="card" key={grid.id}>
                              <h2>{grid.name}</h2>
                              <p>{grid.content}</p>
                              <small>Created at: {new Date(grid.created_on).toLocaleString()}</small>
                              <small>Last Edited: {new Date(grid.edited_on).toLocaleString()}</small>
                          </div>
                      ))}
                  </div>
              </div>
              <Link to="/create-grid" className="quick-link">
                  Quick Link to New Grid Design
              </Link>
          </div>
      </div>
  );
};

export default Dashboard;