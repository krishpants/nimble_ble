import React from 'react';

const DisplayScreen = ({
	code,
	remoteRoomId,
  running,
  runStage,
  shuffleMode,
  minLoopCap,
  maxLoopCap,
  loopCap,
  loopCount,
  minSpeed,
  maxSpeed,
  speed,
  minPositionLower,
  minPositionUpper,
  maxPositionLower,
  maxPositionUpper,
  minPosition,
  maxPosition,
  minLoopDelay,
  maxLoopDelay,
  loopDelay,
  airIn,
  airOut,
  totalStrokes
}) => {
	const cRrngV = (value) => {
		const vl = parseInt(value)
		const minInput = -1000;
		const maxInput = 1000;
		const minOutput = 0;
		const maxOutput = 100;
		const clampedValue = Math.max(minInput, Math.min(maxInput, vl));
		const cv = ((clampedValue - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
		return Math.floor(cv);
	}
	return(
		<div className='screen'>
		  <div className={`upper ${running && 'running'} ${runStage === 4 && 'paused'}`}>
		    <div className='status'>{runStage === 2 ? ('Nimble Is Stroking...') : runStage === 4 ? ("Nimble Is Paused...") : ('Nimble Is Stopped...')}</div>
		  	{code ? (<div className='remote_code'>Remote: {code}</div>) : (null)}
		  	{remoteRoomId ? (<div className='remote_code'>Controlling: {remoteRoomId}</div>) : (null)}
		  </div>
		  {shuffleMode ? (
		  <div className='lower'>
		    <div>Shuffle Mode<span className='pushed'><i className="icofont-dice"></i> Selected</span></div>
		    <div className={`${runStage === 2 && 'active'}`}>Strokes: <span className='stroke-color'>{minLoopCap} <i className="icofont-long-arrow-right"></i> {maxLoopCap}</span> <span className='pushed'>{runStage === 2 ? (Math.min(loopCap,loopCap-loopCount+1)):(0)}/{loopCap}</span></div>
		    <div>Stroke Speed: <span className='speed-color'>{minSpeed} <i className="icofont-long-arrow-right"></i> {maxSpeed}</span> <span className='pushed'>{speed}%</span></div>
		    <div>Stroke Range: <span className='min-color'>{cRrngV(minPositionLower)} <i className="icofont-long-arrow-right"></i> {cRrngV(minPositionUpper)}</span> / <span className='max-color'>{cRrngV(maxPositionLower)} <i className="icofont-long-arrow-right"></i> {cRrngV(maxPositionUpper)}</span><span className='pushed'>{cRrngV(minPosition)}<i className="icofont-long-arrow-right"></i>{cRrngV(maxPosition)}</span></div>
		    <div className={`${runStage === 4 && 'active'}`}>Pause Time: <span className='delay-color'>{minLoopDelay/1000}<i className="icofont-long-arrow-right"></i>{maxLoopDelay/1000} seconds</span> <span className='pushed'>{loopDelay/1000}s</span></div>
		  </div>
		    ) : (
		  <div className='lower'>
		    <div>Sequence...</div>
		    <div className={`${runStage === 2 && 'active'}`}>Strokes: <span className='pushed'>{Math.min(loopCap,loopCap-loopCount+1)}/{loopCap}</span></div>
		    <div>Stroke Speed: <span className='pushed'>{speed}%</span></div>
		    <div>Stroke Range: <span className='pushed'>{cRrngV(minPosition)} <i className="icofont-long-arrow-right"></i> {cRrngV(maxPosition)}</span></div>
		    <div className={`${runStage === 4 && 'active'}`}>Pause Time: <span className='pushed'>{loopDelay/1000} seconds</span></div>
		  </div>
		  )}
		  <div className='info'>
		  	<div>Stroke Total: {totalStrokes}</div>
		    {airIn ? (<div><i className="icofont-warning"></i> Slip out risk: Longer Strokes</div>) : (null)}
		    {airOut ? (<div><i className="icofont-info-circle"></i> Slip out risk reducing: Increasing Suction</div>) : (null)}
		  </div>
		</div>   
)}

export default DisplayScreen;