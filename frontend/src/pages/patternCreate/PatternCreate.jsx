import React, { useState, useEffect, useRef } from 'react';
import './PatternCreate.css'

const PatternCreate = () => {
  const [pattern, setPattern] = useState('');
  const [swatchInfo, setSwatchInfo] = useState({ width: '', height: '', stitches: '', rows: '', needleSize: '' });
  const [torsoDimensions, setTorsoDimensions] = useState({ width: '', height: '', ribbing: '', taperOffset: '', taperHem: '', neckOffsetWidth: '', neckOffsetHeight: '', neckDepth: '' });
  const [torsoChecks, setTorsoChecks] = useState( { ribbing: false, taper: false, neck: false });
  const [sleeveDimensions, setSleeveDimensions] = useState({ width: '', height: '', ribbing: '', taperOffset: '', taperHem: '', taperStyle: '', neckOffsetWidth: '', neckOffsetHeight: '', neckDepth: '' });
  const [sleeveChecks, setSleeveChecks] = useState( { ribbing: false, taper: false, neck: false });


  const handleSwatchChange = (e) => {
    const { name, value } = e.target;
    setSwatchInfo(prevState => ({ ...prevState, [name]: value }));
  };

  const handleTorsoChange = (e) => {
    const { name, value } = e.target;
    setTorsoDimensions(prevState => ({ ...prevState, [name]: value }));
  };

  const handleTorsoChecks = (e) => {
    const { name, checked } = e.target;
    setTorsoChecks(prevState => ({...prevState, [name]: checked }));
  };

  const handleSleeveChange = (e) => {
    const { name, value } = e.target;
    setSleeveDimensions(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSleeveChecks = (e) => {
    const { name, checked } = e.target;
    setSleeveChecks(prevState => ({...prevState, [name]: checked }));
  };

  return (
      <div className="pattern-card-page">
        <div className="pattern-card-wrapper">
          <div className="pattern-card">
            <h2>Pattern Selection</h2>
            <label>Sweater Type:</label>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
              <option value="">Select</option>
              <option value="basic">Basic</option>
              <option value="dipper">Dipper</option>
              <option value="mable">Mable</option>
            </select>
          </div>
        </div>

        <div className="pattern-card-wrapper" style={{marginBottom: 180}}>
          <div className="pattern-card">
            <h2>Swatch Info</h2>

            <div className="input-group">
              <label>Width:</label>
              <input type="text" name="width" value={swatchInfo.width} onChange={handleSwatchChange}/>
            </div>

            <div className="input-group">
              <label>Height:</label>
              <input type="text" name="height" value={swatchInfo.height} onChange={handleSwatchChange}/>
            </div>

            <div className="input-group">
              <label>Stitches:</label>
              <input type="text" name="stitches" value={swatchInfo.stitches} onChange={handleSwatchChange}/>
            </div>

            <div className="input-group">
              <label>Rows:</label>
              <input type="text" name="rows" value={swatchInfo.rows} onChange={handleSwatchChange}/>
            </div>

            <div className="input-group">
              <label>Needle Size:</label>
              <input type="text" name="needleSize" value={swatchInfo.needleSize} onChange={handleSwatchChange}/>
            </div>
          </div>
        </div>

        <div className="pattern-card-wrapper" style={{marginBottom: 120}}>
          <div className="pattern-card">
            <h2>Torso Dimensions</h2>
            <div className="input-group">
              <label>Width:</label>
              <input type="text" name="width" value={torsoDimensions.width} onChange={handleTorsoChange}/>
            </div>
            <div className="input-group">
              <label>Height:</label>
              <input type="text" name="height" value={torsoDimensions.height} onChange={handleTorsoChange}/>
            </div>
            <div className="input-checkbox-group">
              <label>Ribbing:</label>
              <input type="checkbox" name="ribbing" checked={torsoChecks.ribbing} onChange={handleTorsoChecks}/>
              <label>Taper:</label>
              <input type="checkbox" name="taper" checked={torsoChecks.taper} onChange={handleTorsoChecks}/>
              <label>Neck:</label>
              <input type="checkbox" name="neck" checked={torsoChecks.neck} onChange={handleTorsoChecks}/>
            </div>
          </div>
        </div>

        {torsoChecks.ribbing && (
            <div className="pattern-card-wrapper" style={{marginBottom: "80px"}}>
              <div className="pattern-card">
                <h2>Ribbing Details</h2>
                <div className="input-group">
                  <label>Ribbing Size:</label>
                  <select name="ribbing" value={torsoDimensions.ribbing}
                         onChange={handleTorsoChange} defaultValue="normal">
                    <option value="thin">Thin</option>
                    <option value="normal">Normal</option>
                    <option value="thick">Thick</option>
                  </select>
                </div>
              </div>
            </div>
        )}

        {torsoChecks.taper && (
            <div className="pattern-card-wrapper" style={{marginBottom: "100px"}}>
              <div className="pattern-card">
                <h2>Taper Details</h2>

                <div className="input-group">
                  <label>Taper Offset:</label>
                  <input type="text" name="taperOffset" value={torsoDimensions.taperOffset}
                         onChange={handleTorsoChange}/>
                </div>

                <div className="input-group">
                  <label>Taper Hem:</label>
                  <input type="text" name="taperHem" value={torsoDimensions.taperHem} onChange={handleTorsoChange}/>
                </div>

              </div>
            </div>
        )}

        {torsoChecks.neck && (
            <div className="pattern-card-wrapper" style={{marginBottom: "160px"}}>
              <div className="pattern-card">
                <h2>Neck Details</h2>
                <div className="input-group">
                  <label>Neck Offset Width:</label>
                  <input type="text" name="neckOffsetWidth" value={torsoDimensions.neckOffsetWidth}
                         onChange={handleTorsoChange}/>
                </div>

                <div className="input-group">
                  <label>Neck Offset Height:</label>
                  <input type="text" name="neckOffsetHeight" value={torsoDimensions.neckOffsetHeight}
                         onChange={handleTorsoChange}/>
                </div>

                <div className="input-group">
                  <label>Neck Depth:</label>
                  <input type="text" name="neckDepth" value={torsoDimensions.neckDepth} onChange={handleTorsoChange}/>
                </div>
              </div>
            </div>
        )}

        <div className="pattern-card-wrapper" style={{marginBottom: "120px"}}>
          <div className="pattern-card">
            <h2>Sleeve Dimensions</h2>
            <div className="input-group">
              <label>Width:</label>
              <input type="text" name="width" value={sleeveDimensions.width} onChange={handleSleeveChange}/>
            </div>
            <div className="input-group">
              <label>Height:</label>
              <input type="text" name="height" value={sleeveDimensions.height} onChange={handleSleeveChange}/>
            </div>
            <div className="input-checkbox-group">
              <label>Ribbing:</label>
              <input type="checkbox" name="ribbing" checked={sleeveChecks.ribbing} onChange={handleSleeveChecks}/>
              <label>Taper:</label>
              <input type="checkbox" name="taper" checked={sleeveChecks.taper} onChange={handleSleeveChecks}/>
              <label>Neck:</label>
              <input type="checkbox" name="neck" checked={sleeveChecks.neck} onChange={handleSleeveChecks}/>
            </div>
          </div>
        </div>

        {sleeveChecks.ribbing && (
            <div className="pattern-card-wrapper" style={{marginBottom: "80px"}}>
              <div className="pattern-card">
                <h2>Ribbing Details</h2>
                <div className="input-group">
                  <label>Ribbing Size:</label>
                  <select name="ribbing" value={sleeveDimensions.ribbing}
                          onChange={handleSleeveChange} defaultValue="normal">
                    <option value="thin">Thin</option>
                    <option value="normal">Normal</option>
                    <option value="thick">Thick</option>
                  </select>
                </div>
              </div>
            </div>
        )}

        {sleeveChecks.taper && (
            <div className="pattern-card-wrapper" style={{marginBottom: "100px"}}>
              <div className="pattern-card">
                <h2>Taper Details</h2>

                <div className="input-group">
                  <label>Taper Offset:</label>
                  <input type="text" name="taperOffset" value={sleeveDimensions.taperOffset}
                         onChange={handleSleeveChange}/>
                </div>

                <div className="input-group">
                  <label>Taper Hem:</label>
                  <input type="text" name="taperHem" value={sleeveDimensions.taperHem} onChange={handleSleeveChange}/>
                </div>

              </div>
            </div>
        )}

        {sleeveChecks.neck && (
            <div className="pattern-card-wrapper" style={{marginBottom: "160px"}}>
              <div className="pattern-card">
                <h2>Neck Details</h2>
                <div className="input-group">
                  <label>Neck Offset Width:</label>
                  <input type="text" name="neckOffsetWidth" value={sleeveDimensions.neckOffsetWidth}
                         onChange={handleSleeveChange}/>
                </div>

                <div className="input-group">
                  <label>Neck Offset Height:</label>
                  <input type="text" name="neckOffsetHeight" value={sleeveDimensions.neckOffsetHeight}
                         onChange={handleSleeveChange}/>
                </div>

                <div className="input-group">
                  <label>Neck Depth:</label>
                  <input type="text" name="neckDepth" value={sleeveDimensions.neckDepth} onChange={handleSleeveChange}/>
                </div>
              </div>
            </div>
        )}

        <button style={{marginBottom: "40px", marginTop: "20px"}}> Compile </button>
      </div>
  );
};

export default PatternCreate;