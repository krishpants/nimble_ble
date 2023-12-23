import React, { useState,useEffect } from 'react';
import Slider from 'react-slider';
import ReactSlider from 'react-slider';
import styled from 'styled-components';

const SpeedSlider = styled(ReactSlider)`
    width: 50px; // Adjusted for vertical orientation
    height: 100%; // You can set this to the desired height
    .thumb-0, .thumb-1 {
        appearance: none;
        width: 80px; // Thumb width
        height: 30px; // Thumb height
        background: #436985;
        border-radius: 3px;
        border: 1px solid #729ebe;
        cursor: grab;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #c4d1ec;

    }
    .thumb-0:hover, .thumb-1:hover {
        background: #217bbd;
    }
    .track-1 {
        top: 0;
        bottom: 0;
        width: 30px;
        background: #0a1218;
        margin-left: 25px;
        border-radius: 5px;
    }
    .track-0 {
        top: 0;
        bottom: 0;
        width: 30px;
        margin-left: 25px;
        background: #4c81ed;
        border-radius: 5px;
    }
`;


const StrokeSpeedSlider = ({maxSpeed,setMaxSpeed}) => {
	const speedThumb = (props, state) => <div {...props}>{state.value}%</div>;
	const Track = (props, state) => <div {...props} index={state.index}></div>;
	const handleSpeedSliderChange = (value) => {
      	setMaxSpeed(value)
    };
	return(
		<div className='speedSliderWrapper'>
		    <SpeedSlider
		        min={0}
		        max={100}
		        defaultValue={[maxSpeed]} // Set to initial positions within your range
		        value={maxSpeed}
                renderTrack={Track}
		        renderThumb={speedThumb}
		        orientation="vertical"
		        onChange={handleSpeedSliderChange}
		        invert
		    />
		</div>  
)}


  export default StrokeSpeedSlider;