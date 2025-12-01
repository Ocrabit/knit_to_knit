import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/pages.css';
import AddCard from '../../components/Card/AddCard';
import ComingSoonCard from "../../components/ComingSoonCard/ComingSoonCard.jsx";

const Designs = () => {
  const navigate = useNavigate();

  return (
      <div className="page-container centered">
          <h1>Your Designs</h1>
          <ComingSoonCard/>
          <p style={{
              textAlign: 'center',
              color: 'var(--walnut)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '1.125rem',
              marginTop: '1rem',
              marginBottom: '2rem'
          }}>
              But here's a fun little grid to play with!
          </p>
          <div className="card-container">
              <AddCard
                  onClick={() => navigate('/create-design')}
                  label="New Design"
                  index={0}
              />
          </div>
      </div>
  );
};

export default Designs;