import React from 'react';
import './AddCard.css';
import { cardColors } from '../../constants/cardColors';

const AddCard = ({ onClick, label = 'New', index = 0 }) => {
  const backgroundColor = cardColors[index % cardColors.length];

  return (
    <div className="add-card" onClick={onClick} style={{ backgroundColor }}>
      <div className="add-card-icon">
        <div className="corner-piece top-left"></div>
        <div className="corner-piece top-right"></div>
        <div className="corner-piece bottom-left"></div>
        <div className="corner-piece bottom-right"></div>
        <div className="plus-sign">+</div>
      </div>
      <span className="add-card-label">{label}</span>
    </div>
  );
};

export default AddCard;
