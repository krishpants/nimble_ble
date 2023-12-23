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
  airOut
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
		    <div>Shufle...</div>
		    <div className={`${runStage === 2 && 'active'}`}>Strokes: {minLoopCap} <i className="icofont-long-arrow-right"></i> {maxLoopCap} <span>{runStage === 2 ? (Math.min(loopCap,loopCap-loopCount+1)):(0)}/{loopCap}</span></div>
		    <div>Stroke Speed: {minSpeed} <i className="icofont-long-arrow-right"></i> {maxSpeed} <span>{speed}%</span></div>
		    <div>Stroke Range: {cRrngV(minPositionLower)} <i className="icofont-long-arrow-right"></i> {cRrngV(minPositionUpper)} / {cRrngV(maxPositionLower)} <i className="icofont-long-arrow-right"></i> {cRrngV(maxPositionUpper)}<span>{cRrngV(minPosition)}<i className="icofont-long-arrow-right"></i>{cRrngV(maxPosition)}</span></div>
		    <div className={`${runStage === 4 && 'active'}`}>Pause Time: {minLoopDelay/1000}<i className="icofont-long-arrow-right"></i>{maxLoopDelay/1000} seconds <span>{loopDelay/1000}s</span></div>
		  </div>
		    ) : (
		  <div className='lower'>
		    <div>Sequence...</div>
		    <div className={`${runStage === 2 && 'active'}`}>Strokes: <span>{Math.min(loopCap,loopCap-loopCount+1)}/{loopCap}</span></div>
		    <div>Stroke Speed: <span>{speed}%</span></div>
		    <div>Stroke Range: <span>{cRrngV(minPosition)} <i className="icofont-long-arrow-right"></i> {cRrngV(maxPosition)}</span></div>
		    <div className={`${runStage === 4 && 'active'}`}>Pause Time: <span>{loopDelay/1000} seconds</span></div>
		  </div>
		  )}
		  <div className='info'>
		    {airIn ? (<div><i className="icofont-warning"></i> Slip out risk: Longer Strokes</div>) : (null)}
		    {airOut ? (<div><i className="icofont-info-circle"></i> Slip out risk reducing: Increasing Suction</div>) : (null)}
		  </div>
		</div>   
)}

export default DisplayScreen;