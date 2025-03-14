import React, { useEffect } from "react";
import FishingMap from "./components/FishingMap";
import Weather from "./components/Weather";
import WeatherDebug from "./components/WeatherDebug";

function App() {
    useEffect(() => {
        const handleReadyStateChange = () => {
            setTimeout(() => {
                console.log(`Ready state changed: ${document.readyState}`);
            }, 0);
        };

        document.addEventListener("readystatechange", handleReadyStateChange);

        return () => {
            document.removeEventListener("readystatechange", handleReadyStateChange);
        };
    }, []);

    return (
        <div className="App">
            <h1>KalastusApp - Sääennuste</h1>
            <Weather />
            <FishingMap />

            {/* 🛠 DEBUG-NÄYTTÖ: TÄMÄ TULOSTAA RAADON JSON-DATAN */}
            <WeatherDebug />
        </div>
    );
}

export default App;


