// src/pages/Contact/Contact.jsx
import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <h1>Contact Us</h1>
      <p>If you have any questions or suggestions, I would love to hear from you!</p>
      <div className="contact-details">
        <p><strong>Company:</strong> Knit To Knit</p>
        <p><strong>Contact Name:</strong> Marco Cassar</p>
        <p><strong>Email:</strong> <a href="mailto:marcocassar@mdcusa.net">marcocassar@mdcusa.net</a></p>
        <p><strong>Phone:</strong> <a href="tel:8052319667">805-231-9667</a></p>
      </div>
    </div>
  );
};

export default Contact;
