import React from 'react';

const PercentageBar = ({ value }) => {
  // Ensure the value is within the 0-100 range
  const boundedValue = Math.min(100, Math.max(0, value));

  const redOpacity = boundedValue >= 51 ? 0.2 + (0.8 * ((boundedValue - 51) / 49)) : 0.2;

  const blueOpacity = boundedValue <= 49 ? 0.2 + (0.8 * (1 - (boundedValue / 49))) : 0.2;

  // Styles
  const barStyle = {
    width: '100%',
    height: '30px',
    background: `linear-gradient(to right,
                  rgba(88,140,180,${blueOpacity}) 0%,
                  #0c1923 40%,
                  #0c1923 40%,
                  #2a4a65 40.1%,
                  #0c1923 40.2%,
                  #0c1923 59.8%,
                  #2a4a65 59.9%,
                  #0c1923 60%,
                  #0c1923 60%,
                  rgba(187,23,65,${redOpacity}) 100%)`,
    border: '1px solid black',
    borderRadius: '15px',
    marginBottom: '20px',
    overflow: 'hidden'
  };


  const filledStyle = {
    width: `${boundedValue}%`,
    height: '100%',
    borderRight: "10px solid",
    borderColor: "#ff4949",
    transition: 'all 0.3s ease'
  };

  return (
    <div style={barStyle}>
      <div style={filledStyle}></div>
    </div>
  );
};

export default PercentageBar;
