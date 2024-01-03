import React from 'react';

const DelayCapButtons = ({
  selectedMode,
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
  cacheValues,
  rampInterval,
  setRampInterval,
  connectToEom,
  eomConnecting,
  eomConnected
}) => {	
  return(
    <>
      {selectedMode === 'default' ? (
        <div className='inputsWrapper'>
          <input className='delay' min='0' type='number' value={loopDelay/1000} onChange={e => setLoopDelay(e.target.value * 1000)}/>
          <input className='strokes' min='0' type='number' value={loopCap} onChange={e => setLoopCap(e.target.value * 1)}/>
        </div>
      ) : selectedMode === 'shuffle' ? (
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
      ) : selectedMode === 'StopGo' ? (
        <div className='inputsWrapper'>
          <input className='interval' type='number' min='0' value={rampInterval} onChange={e => { setRampInterval(e.target.value); }}/>
        </div>
      ) : selectedMode === 'eom' ? (
        <div className='inputsWrapper'>
          <button 
            onClick={!eomConnected && !eomConnecting ? connectToEom : undefined}
            className={`eomConnectButton ${eomConnecting ? 'connecting' : ''} ${eomConnected ? 'connected' : ''}`}
            disabled={eomConnecting || eomConnected}
          >
            {eomConnecting ? 'Connecting' : eomConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
      ) : (null)}
    </>
)}

export default DelayCapButtons;