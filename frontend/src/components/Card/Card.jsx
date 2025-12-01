import React from 'react';
import './Card.css';
import { cardColors } from '../../constants/cardColors';

const Card = ({ children, onClick, className = '', hover = true, index = 0 }) => {
  const backgroundColor = cardColors[index % cardColors.length];

  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      onClick={onClick}
      style={{
        ...(onClick ? { cursor: 'pointer' } : {}),
        backgroundColor
      }}
    >
      {children}
    </div>
  );
};

export default Card;
