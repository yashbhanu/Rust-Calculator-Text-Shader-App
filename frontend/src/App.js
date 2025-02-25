import logo from "./logo.svg";
import "./App.css";
import { Tab, Tabs } from "./components/Tabs";
import CalculatorTab from "./tabs/CalculatorTab";
import ShaderTab from "./tabs/ShaderTab";
import { useState } from "react";
function App() {
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <div className="app-container">
      <header>
        <h1>WASM + LLM Application</h1>
      </header>

      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tab id="calculator" title="Rust Calculator">
          <CalculatorTab />
        </Tab>
        <Tab id="shader" title="Text-to-Shader">
          <ShaderTab />
        </Tab>
      </Tabs>
    </div>
  );
}

export default App;
