import React from 'react';
import '../../styles/pages.css';
import './About.css';

const About = () => {
  return (
      <div className="page-container about-page">
          <h1 className="about-title">Welcome to Knit To Knit!</h1>
          <p>
              Knitting can involve a lot of detailed calculations and math, my goal is to create a tool to handle the
              math allowing you to focus on the creating. Hi I'm Marco, the creator of Knit To Knit. I wanted to create a tool that
              handles the calculations and resizing so you can dive into your designs and bring your ideas to life
              without worry.
          </p>
          <h4 className="about-subtitle">A little about me</h4>
          <p>
              I’m a senior at Belmont University, trying to balance studies and my passion to
              create. I am also heavily into my academics right now so this project has been pushed to the side for the time being.
              I look forward to coming back and improving this platform. Thank you for checking Knit to Knit out. I am honored you took the time to check out our journey.
          </p>
          <p>
              Thank you for supporting this small project and joining a growing community of knitters. Whether you’re a
              seasoned knitter or just picking up needles for the first time, I hope you find something here that makes
              your experience even better.
          </p>
          <p>Happy knitting!</p>
          <p>— Marco</p>
      </div>

  );
};

export default About;
