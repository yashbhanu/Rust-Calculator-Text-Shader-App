import React, { useState, useEffect, useRef } from 'react';
function ShaderTab() {
  const [prompt, setPrompt] = useState('');
  const [shaderCode, setShaderCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  
  // WebGL context and shader program references
  const glRef = useRef(null);
  const programRef = useRef(null);
  
  // Initialize WebGL context
  useEffect(() => {
    if (!canvasRef.current) return;
    
    try {
      const gl = canvasRef.current.getContext('webgl');
      if (!gl) {
        throw new Error('WebGL not supported');
      }
      glRef.current = gl;
    } catch (err) {
      setError(`WebGL initialization error: ${err.message}`);
    }
    
    // Clean up on unmount
    return () => {
      if (programRef.current && glRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
    };
  }, []);
  
  // Function to compile and run shader
  const compileAndRunShader = (vertexShaderSource, fragmentShaderSource) => {
    const gl = glRef.current;
    if (!gl) return false;
    
    // Delete previous program if exists
    if (programRef.current) {
      gl.deleteProgram(programRef.current);
    }
    
    try {
      // Create shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      
      // Check vertex shader compilation
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(vertexShader);
        gl.deleteShader(vertexShader);
        throw new Error(`Vertex shader compilation failed: ${info}`);
      }
      
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      
      // Check fragment shader compilation
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(`Fragment shader compilation failed: ${info}`);
      }
      
      // Create program and link shaders
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      // Check program linking
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(`Shader program linking failed: ${info}`);
      }
      
      // Clean up shaders
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      
      // Save program reference
      programRef.current = program;
      
      // Set up geometry (a simple quad)
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]), gl.STATIC_DRAW);
      
      // Set up render loop
      const render = (time) => {
        time *= 0.001; // Convert to seconds
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        
        // Set up attributes
        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms if they exist
        const timeLocation = gl.getUniformLocation(program, "u_time");
        if (timeLocation) gl.uniform1f(timeLocation, time);
        
        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        if (resolutionLocation) gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Continue render loop
        requestAnimationFrame(render);
      };
      
      // Start rendering
      requestAnimationFrame(render);
      
      return true;
    } catch (err) {
      setError(`Shader error: ${err.message}`);
      return false;
    }
  };
  
  // Handle generating shader from user prompt
  const handleGenerateShader = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4000/api/generate-shader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setShaderCode(data.shader);
      
      // Try to compile and run the shader
      const success = compileAndRunShader(data.vertexShader, data.fragmentShader);
      
      if (!success) {
        // Error already set by compileAndRunShader
        console.error('Failed to compile/run shader');
      }
    } catch (err) {
      setError(`Failed to generate shader: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="shader-container">
      <h2>Text-to-Shader Generator</h2>
      
      <div className="input-container">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the shader you want (e.g., A rotating cube with a gradient background)"
          className="prompt-input"
        />
        <button 
          onClick={handleGenerateShader}
          disabled={isLoading || !prompt.trim()}
          className="generate-button"
        >
          {isLoading ? 'Generating...' : 'Generate Shader'}
        </button>
      </div>
      
      <div className="display-container">
        <div className="canvas-container">
          <h3>Shader Preview</h3>
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={300}
            className="webgl-canvas"
          />
        </div>
        
        <div className="code-container">
          <h3>Shader Code</h3>
          <pre className="shader-code">{shaderCode || 'No shader generated yet'}</pre>
        </div>
      </div>
      
      {error && (
        <div className="error-container">
          <h3>Error:</h3>
          <div className="error">{error}</div>
        </div>
      )}
    </div>
  );
}

export default ShaderTab;