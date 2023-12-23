import React from 'react';

const DelayCapButtons = ({
  shuffleMode,
  loopDelay,
  setLoopDelay,
  loopCap,
  setLoopCap,
  minLoopDelay,
  setMinLoopDelay,
  maxLoopDelay,
  setMaxLoopDelay,
  minLoopCap,
  setMinLoopCap,
  maxLoopCap,
  setMaxLoopCap,
  cacheValues
}) => {	
  return(
    <>
      {!shuffleMode ? (
        <div className='inputsWrapper'>
            <input className='delay' min='0' type='number' value={loopDelay/1000} onChange={e => setLoopDelay(e.target.value * 1000)}/>
            <input className='strokes' min='0' type='number' value={loopCap} onChange={e => setLoopCap(e.target.value * 1)}/>
        </div>
        ) : (
        <div className='inputsWrapper'>
          <div className='inputPair delay'>
            <input type='number' min='0' value={minLoopDelay/1000} onChange={e => { setMinLoopDelay(e.target.value * 1000); cacheValues(); }}/>
            <input type='number' min='0' value={maxLoopDelay/1000} onChange={e => { setMaxLoopDelay(e.target.value * 1000); cacheValues(); }}/>
          </div>
          <div className='inputPair strokes'>
            <input type='number' min='0' value={minLoopCap} onChange={e => { setMinLoopCap(e.target.value * 1); cacheValues(); }}/>
            <input type='number' min='0' value={maxLoopCap} onChange={e => { setMaxLoopCap(e.target.value * 1); cacheValues(); }}/>
          </div>
        </div>
      )}
    </>
)}

export default DelayCapButtons;