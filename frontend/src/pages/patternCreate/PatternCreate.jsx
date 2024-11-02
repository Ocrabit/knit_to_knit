import React, { useState, useEffect, useRef } from 'react';
import './PatternCreate.css'
import { compilePattern } from '../../services/data.service.ts'
import { useNavigate } from 'react-router-dom';

const PatternCreate = () => {
  const navigate = useNavigate(); //Initialize navigate
  const [isLoading, setIsLoading] = useState(false); //Loading state

  const [pattern, setPattern] = useState({
    name: '',
    content: '',
    sweater_type: 'Basic',
  });
  const [swatchInfo, setSwatchInfo] = useState({ width: '', height: '', stitches: '', rows: '', needle_size: '' });
  const [torsoDimensions, setTorsoDimensions] = useState({ width: '', height: '', ribbing: '', taper_offset: '', taper_hem: '', neck_offset_width: '', neck_offset_height: '', neck_depth: '' });
  const [torsoChecks, setTorsoChecks] = useState( { ribbing: false, taper: false, neck: false });
  const [sleeveDimensions, setSleeveDimensions] = useState({ width: '', height: '', ribbing: '', taper_offset: '', taper_hem: '', taper_style: '', neck_offset_width: '', neck_offset_height: '', neck_depth: '' });
  const [sleeveChecks, setSleeveChecks] = useState( { ribbing: false, taper: false, neck: false });

  const handlePatternChange = (e) => {
    const { name, value } = e.target;
    setPattern(prevState => ({ ...prevState, [name]: value }));
  };

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

  const handleCompileClick = async () => {
    // Validate and convert required fields to appropriate types
    const swatchWidth = parseFloat(swatchInfo.width);
    const swatchHeight = parseFloat(swatchInfo.height);
    const swatchStitches = parseInt(swatchInfo.stitches, 10);
    const swatchRows = parseInt(swatchInfo.rows, 10);
    const swatchNeedleSize = parseFloat(swatchInfo.needle_size);
    const torsoWidth = parseFloat(torsoDimensions.width);
    const torsoHeight = parseFloat(torsoDimensions.height);
    const sleeveWidth = parseFloat(sleeveDimensions.width);
    const sleeveHeight = parseFloat(sleeveDimensions.height);

    // Check for invalid values (e.g., NaN) or missing fields
    if (
      !pattern.name || !pattern.content || !pattern.sweater_type ||
      isNaN(swatchWidth) || isNaN(swatchHeight) || isNaN(swatchStitches) || isNaN(swatchRows) || isNaN(swatchNeedleSize) ||
      isNaN(torsoWidth) || isNaN(torsoHeight) ||
      isNaN(sleeveWidth) || isNaN(sleeveHeight)
    ) {
      alert("Please fill out all required fields with valid numbers.");
      return;
    }

    // Prepare the converted data to send to the API
    const data = {
      ...pattern,
      swatch: {
        width: swatchWidth,
        height: swatchHeight,
        stitches: swatchStitches,
        rows: swatchRows,
        needle_size: swatchNeedleSize,
      },
      torso_projection: {
        ...torsoDimensions,
        width: torsoWidth,
        height: torsoHeight,
      },
      sleeve_projection: {
        ...sleeveDimensions,
        width: sleeveWidth,
        height: sleeveHeight,
      },
    };

    setIsLoading(true);

    try {
      // Call the TypeScript service function to compile the pattern
      const response = await compilePattern(data);
      alert(response.message || "Pattern compiled successfully!");
      console.log(response.pattern);
      const patternId = response.pattern_id;

      navigate(`/pattern-view/${patternId}`);
    } catch (error) {
      alert(error.message || "An error occurred while compiling the pattern.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Compiling your pattern, please wait...</p>
      </div>
    );
  } else {
    return (
        <div className="pattern-card-page">
          <div className="pattern-card-wrapper">
            <div className="pattern-card">
              <h2>Pattern Selection</h2>

              {/* Name Field */}
              <div className="input-group">
                <label htmlFor="patternName">Pattern Name:</label>
                <input
                    type="text"
                    id="patternName"
                    name="name"
                    placeholder="Enter pattern name"
                    value={pattern.name}
                    onChange={(e) => setPattern({...pattern, name: e.target.value})}
                />
              </div>

              {/* Content Field */}
              <div className="input-group">
                <label htmlFor="patternContent">Pattern Content:</label>
                <textarea
                    id="patternContent"
                    name="content"
                    placeholder="Enter pattern content"
                    value={pattern.content}
                    onChange={(e) => setPattern({...pattern, content: e.target.value})}
                ></textarea>
              </div>

              <div className="input-group">
                {/* Sweater Type Selection */}
                <label>Sweater Type:</label>
                <select
                    value={pattern.sweater_type}
                    onChange={(e) => setPattern({...pattern, sweater_type: e.target.value})}
                >
                  <option value="">Select</option>
                  <option value="basic">Basic</option>
                  <option value="dipper">Dipper</option>
                  <option value="mable">Mable</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pattern-card-wrapper">
            <div className="pattern-card">
              <h2>Swatch Info</h2>

              <div className="input-group">
                <label>Width:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                    title="Width: inches. Typically 4x4"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 4in"} name="width" value={swatchInfo.width}
                    onChange={handleSwatchChange}/>
              </div>

              <div className="input-group">
                <label>Height:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                    title="Height: inches. Typically 4x4"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 4in"} name="height" value={swatchInfo.height}
                    onChange={handleSwatchChange}/>
              </div>

              <div className="input-group">
                <label>Stitches:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/", "."].includes(evt.key) && evt.preventDefault()}
                    title="Stitches: integer. The width in terms of stitches of the swatch"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 20stitches"} name="stitches" value={swatchInfo.stitches}
                    onChange={handleSwatchChange}/>
              </div>

              <div className="input-group">
                <label>Rows:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/", "."].includes(evt.key) && evt.preventDefault()}
                    title="Rows: integer. The height in terms of rows of the swatch"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 28rows"} name="rows" value={swatchInfo.rows}
                    onChange={handleSwatchChange}/>
              </div>

              <div className="input-group">
                <label>Needle Size:</label>
                <input onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                       title="Needle Size: float. The size of the needle in terms of mm"
                        onWheel={(e) => e.target.blur()}
                       type="number" min="0" placeholder={"Ex. 3.5mm"} name="needle_size" value={swatchInfo.needle_size}
                       onChange={handleSwatchChange}/>
              </div>
            </div>
          </div>

          <div className="pattern-card-wrapper">
            <div className="pattern-card">
              <h2>Torso Dimensions</h2>
              <div className="input-group">
                <label>Width:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                    title="Torso Width: inches. The width of the chest peice of the pattern (shoulder-to-shoulder)"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 17in"} name="width" value={torsoDimensions.width}
                    onChange={handleTorsoChange}/>
              </div>
              <div className="input-group">
                <label>Height:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                    title="Torso Height: inches. The length of the chest peice of the pattern (shoulder-to-waist)"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 23in"} name="height" value={torsoDimensions.height}
                    onChange={handleTorsoChange}/>
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
              <div className="pattern-card-wrapper">
                <div className="pattern-card">
                  <h2>Ribbing Details</h2>
                  <div className="input-group">
                    <label>Ribbing Size:</label>
                    <select name="ribbing" value={torsoDimensions.ribbing}
                            onChange={handleTorsoChange}>
                      <option value="">-----</option>
                      <option value="thin">Thin</option>
                      <option value="normal">Normal</option>
                      <option value="thick">Thick</option>
                    </select>
                  </div>
                </div>
              </div>
          )}

          {torsoChecks.taper && (
              <div className="pattern-card-wrapper">
                <div className="pattern-card">
                  <h2>Taper Details</h2>

                  <div className="input-group">
                    <label>Taper Offset:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Torso Taper Offset: inches. How far to go down the side of the torso length before beginning the tapering"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 3in"} name="taper_offset"
                        value={torsoDimensions.taper_offset} onChange={handleTorsoChange}/>
                  </div>

                  <div className="input-group">
                    <label>Taper Hem:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Torso Taper Hem: inches. How wide do you want the torso to taper to (tapered waist size)"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 16in"} name="taper_hem"
                        value={torsoDimensions.taper_hem} onChange={handleTorsoChange}/>
                  </div>

                </div>
              </div>
          )}

          {torsoChecks.neck && (
              <div className="pattern-card-wrapper">
                <div className="pattern-card">
                  <h2>Neck Details</h2>
                  <div className="input-group">
                    <label>Neck Offset Width:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Torso Neck Offset Width: inches. How far into the width of the shoulder do you want to go before beginning your neckline"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 6.5in"} name="neck_offset_width"
                        value={torsoDimensions.neck_offset_width}
                        onChange={handleTorsoChange}/>
                  </div>

                  <div className="input-group">
                    <label>Neck Offset Height:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Torso Neck Offset Height: inches. The height of how far you want to do you want to go before beginning your neckline"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 2.5in"} name="neck_offset_height"
                        value={torsoDimensions.neck_offset_height}
                        onChange={handleTorsoChange}/>
                  </div>

                  <div className="input-group">
                    <label>Neck Depth:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Torso Neck Depth: inches. The depth of the neckline. How deep you want the neck to be"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 3.5in"} name="neck_depth"
                        value={torsoDimensions.neck_depth} onChange={handleTorsoChange}/>
                  </div>
                </div>
              </div>
          )}

          <div className="pattern-card-wrapper">
            <div className="pattern-card">
              <h2>Sleeve Dimensions</h2>
              <div className="input-group">
                <label>Width:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                    title="Sleeve Width: inches. The width of the arm of the pattern (just counts one side. width not circumference)"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 6.5in"} name="width" value={sleeveDimensions.width}
                    onChange={handleSleeveChange}/>
              </div>
              <div className="input-group">
                <label>Height:</label>
                <input
                    onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                    title="Sleeve Height: inches. The height of the arm of the pattern (shoulder-to-wrist)"
                    onWheel={(e) => e.target.blur()}
                    type="number" min="0" placeholder={"Ex. 18in"} name="height" value={sleeveDimensions.height}
                    onChange={handleSleeveChange}/>
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
              <div className="pattern-card-wrapper">
                <div className="pattern-card">
                  <h2>Ribbing Details</h2>
                  <div className="input-group">
                    <label>Ribbing Size:</label>
                    <select name="ribbing" value={sleeveDimensions.ribbing}
                            onChange={handleSleeveChange} >
                      <option value="">-----</option>
                      <option value="thin">Thin</option>
                      <option value="normal">Normal</option>
                      <option value="thick">Thick</option>
                    </select>
                  </div>
                </div>
              </div>
          )}

          {sleeveChecks.taper && (
              <div className="pattern-card-wrapper">
                <div className="pattern-card">
                  <h2>Taper Details</h2>

                  <div className="input-group">
                    <label>Taper Offset:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Sleeve Taper Offset: inches. How far to go down the side of the sleeve length before beginning the tapering"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 1in"} name="taper_offset"
                        value={sleeveDimensions.taper_offset} onChange={handleSleeveChange}/>
                  </div>

                  <div className="input-group">
                    <label>Taper Hem:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Sleeve Taper Hem: inches. How wide do you want the sleeve to taper to (tapered wrist size)"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 5in"} name="taper_hem"
                        value={sleeveDimensions.taper_hem}
                        onChange={handleSleeveChange}/>
                  </div>

                  <div className="input-group">
                    <label>Taper Style:</label>
                    <select
                        title="Sleeve Taper Style: selection. This determines if you slope from the top or bottom or both sides of the sleeve"
                        onWheel={(e) => e.target.blur()}
                        name="taper_style" value={sleeveDimensions.taper_style}
                        onChange={handleSleeveChange}>
                      <option value="both">Both</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>

                </div>
              </div>
          )}

          {sleeveChecks.neck && (
              <div className="pattern-card-wrapper">
                <div className="pattern-card">
                  <h2>Neck Details</h2>
                  <div className="input-group">
                    <label>Neck Offset Width:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Sleeve Neck Offset Width: inches. Put a value in here if you want the neck to cut into the sleeve (I recommend not putting a value here)"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 0in"} name="neck_offset_width"
                        value={sleeveDimensions.neck_offset_width}
                        onChange={handleSleeveChange}/>
                  </div>

                  <div className="input-group">
                    <label>Neck Offset Height:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Sleeve Neck Offset Width: inches. Put a value in here if you want the neck to cut into the sleeve (I recommend not putting a value here)"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 0in"} name="neck_offset_height"
                        value={sleeveDimensions.neck_offset_height}
                        onChange={handleSleeveChange}/>
                  </div>

                  <div className="input-group">
                    <label>Neck Depth:</label>
                    <input
                        onKeyDown={(evt) => ["e", "E", "+", "-", "/"].includes(evt.key) && evt.preventDefault()}
                        title="Sleeve Neck Offset Width: inches. Put a value in here if you want the neck to cut into the sleeve (I recommend not putting a value here)"
                        onWheel={(e) => e.target.blur()}
                        type="number" min="0" placeholder={"Ex. 0in"} name="neck_depth"
                        value={sleeveDimensions.neck_depth} onChange={handleSleeveChange}/>
                  </div>
                </div>
              </div>
          )}

          <button style={{fontSize: "2rem"}} onClick={handleCompileClick}> Compile</button>
        </div>
    );
  }
};


export default PatternCreate;