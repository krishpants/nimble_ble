import React, { useState,useEffect } from 'react';
import Slider from 'react-slider';
import ReactSlider from 'react-slider';
import styled from 'styled-components';

const RangeSlider = styled(ReactSlider)`
    width: 50px; // Adjusted for vertical orientation
    height: 100%; // You can set this to the desired height
    .thumb-0, .thumb-1 {
        appearance: none;
        width: 80px; // Thumb width
        height: 15px; // Thumb height
        background: #436985;
        border-radius: 3px;
        border: 1px solid #729ebe;
        cursor: grab;
    }
    .thumb-0:hover, .thumb-1:hover {
        background: #217bbd;
    }
    .track-0,.track-2 {
        top: 0;
        bottom: 0;
        width: 30px;
        background: #0a1218;
        margin-left: 25px;
        border-radius: 5px;
    }
    .track-1 {
        top: 0;
        bottom: 0;
        width: 30px;
        margin-left: 25px;
        background: #db8a50;
        border-radius: 5px;
    }
`;

const StrokeRangeSlider = ({minPosition,setMinPosition,maxPosition,setMaxPosition}) => {
  const Thumb = (props, state) => <div {...props}></div>;
  const Track = (props, state) => <div {...props} index={state.index}></div>;
  const handleRangeSliderChange = (values) => {
    const [min, max] = values;
    setMinPosition(min);
    setMaxPosition(max);
  };
  return(
    <div className='sliderWrapper'>
        <RangeSlider
            min={-1000}
            max={1000}
            step={100}
            defaultValue={[minPosition, maxPosition]} // Set to initial positions within your range
            value={[minPosition, maxPosition]}
            renderTrack={Track}
            renderThumb={Thumb}
            orientation="vertical"
            onChange={handleRangeSliderChange}
            minDistance={200}
            invert
            pearling
            thumbActiveClassName="active"
        />
    </div>    
)}

export default StrokeRangeSlider;