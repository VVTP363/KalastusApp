// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Weather from "./components/Weather";
import VirtavesiView from "./components/VirtavesiView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Weather />} />
        <Route path="/virtavedet" element={<VirtavesiView />} />
      </Routes>
    </Router>
  );
}

export default App;
