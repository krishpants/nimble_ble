import React, { useState,useEffect } from 'react';
import Slider from 'react-slider';
import ReactSlider from 'react-slider';
import styled from 'styled-components';

const RangeSlider = styled(ReactSlider)`
    width: 25px; // Adjusted for vertical orientation
    height: 100%; // You can set this to the desired height
    .thumb-0, .thumb-1 {
        appearance: none;
        width: 40px; // Thumb width
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
        width: 15px;
        background: #0a1218;
        margin-left: 12.5px;
        border-radius: 5px;
    }
    .track-1 {
        top: 0;
        bottom: 0;
        width: 15px;
        margin-left: 12.5px;
        background: #e566bc;
        border-radius: 5px;
    }
`;

const StrokeRangeMaxMinSlider = ({minPosition,setMinPosition,minPositionUpper,setMinPositionUpper,maxPositionUpper,setMaxPositionUpper}) => {
  const Thumb = (props, state) => <div {...props}></div>;
  const Track = (props, state) => <div {...props} index={state.index}></div>;
  const handleRangeSliderChange = (values) => {
    const [min, max] = values;
    if (max > maxPositionUpper){
        setMaxPositionUpper(max);
    }
    setMinPositionUpper(max);
    setMinPosition(min);
    
  };
  return(
    <div className='sliderWrapper narrow'>
        <RangeSlider
            min={-1000}
            max={1000}
            step={100}
            defaultValue={[minPosition, minPositionUpper]} // Set to initial positions within your range
            value={[minPosition, minPositionUpper]}
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

export default StrokeRangeMaxMinSlider;