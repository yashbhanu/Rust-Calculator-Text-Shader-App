import React, { useState, useEffect } from 'react';

function CalculatorTab() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [calculator, setCalculator] = useState(null);

  // Load WASM module
  useEffect(() => {
    async function loadWasm() {
      try {
        // Dynamic import of the WASM module
        const wasm = await import('../wasm/calculator/pkg/calculator.js');
        await wasm.default();
        setCalculator(wasm);
        setWasmLoaded(true);
      } catch (err) {
        console.error('Failed to load WASM module:', err);
        setError('Failed to load WASM calculator. Please check console for details.');
      }
    }
    
    loadWasm();
  }, []);

  const handleCalculate = () => {
    if (!wasmLoaded) {
      setError('WASM module is not loaded yet.');
      return;
    }

    try {
      const calculationResult = calculator.calculate(expression);
      setResult(calculationResult);
      setError(null);
    } catch (err) {
      setError(err.toString());
      setResult(null);
    }
  };

  return (
    <div className="calculator-container">
      <h2>Rust WASM Calculator</h2>
      
      <div className="input-container">
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter a mathematical expression (e.g., 2+2, 3*4, (5+7)/2)"
          className="expression-input"
        />
        <button 
          onClick={handleCalculate}
          disabled={!wasmLoaded || !expression}
          className="calculate-button"
        >
          Calculate
        </button>
      </div>
      
      {result !== null && (
        <div className="result-container">
          <h3>Result:</h3>
          <div className="result">{result}</div>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <h3>Error:</h3>
          <div className="error">{error}</div>
        </div>
      )}
      
      {!wasmLoaded && !error && (
        <div className="loading">Loading WASM module...</div>
      )}
    </div>
  );
}

export default CalculatorTab;