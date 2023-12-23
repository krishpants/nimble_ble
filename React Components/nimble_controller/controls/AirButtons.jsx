import React from 'react';

const AirButtons = ({airIn,airOut,setAirIn,setAirOut}) => {
	return(
        <div className='air_button_wrapper'>
          <button 
              onMouseDown={() => {
                  setAirIn(true);
              }} 
              onMouseUp={() => {
                  setAirIn(false);
              }}
              className={`airInButton ${airIn ? 'active' : ''}`}
          >
              <i className="icofont-long-arrow-down"></i>
          </button>
          <button 
              onMouseDown={() => {
                  setAirOut(true);
              }} 
              onMouseUp={() => {
                  setAirOut(false);
              }}
              className={`airOutButton ${airOut ? 'active' : ''}`}
          >
              <i className="icofont-long-arrow-up"></i>
          </button>
        </div>
)}

export default AirButtons;