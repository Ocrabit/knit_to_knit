// src/components/ComingSoonCard/ComingSoonCard.jsx
import React from 'react';
import Card from '../Card/Card';
import './ComingSoonCard.css';

const ComingSoonCard = () => {
  return (
    <Card className="coming-soon-card flex-center text-center" hover={false}>
      <h2>To be added...</h2>
      <p>More features are on the way!</p>
    </Card>
  );
};

export default ComingSoonCard;
