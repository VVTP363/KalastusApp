import React, { useState, useEffect } from "react";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const Weather = () => {
  const [forecastData, setForecastData] = useState({});
  const [locationName, setLocationName] = useState("Nykyinen sijainti haetaan...");
  const [searchLocation, setSearchLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moonPhase, setMoonPhase] = useState("");
  
  const weatherDescriptions = {
    "1": "Aurinkoista ☀️",
    "2": "Puolipilvistä ⛅",
    "3": "Pilvistä ☁️",
    "21": "Heikko sadekuuro 🌦",
    "22": "Sadekuuro 🌧",
    "23": "Voimakas sadekuuro ⛈",
    "31": "Heikko vesisade 🌦",
    "32": "Vesisade 🌧",
    "33": "Voimakas vesisade 🌧💦",
    "41": "Heikko lumisade ❄️",
    "42": "Lumisade 🌨",
    "43": "Voimakas lumisade 🌨❄️"
  };

  useEffect(() => {
    getUserLocation();
    calculateMoonPhase();
  }, []);
  
 
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      console.log("🔄 Koordinaatit päivittyivät:", latitude, longitude);
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude]);
  const reverseGeocode = async (lat, lon) => {
  
try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const address = res.data.address;
    const location =
      address.village ||
      address.town ||
      address.city ||
      address.municipality ||
      "Tuntematon paikka";

    console.log("📍 ReverseGeocode päivittää paikan:", location);
    setLocationName(location);
  } catch (error) {
    console.error("❌ Paikan haku epäonnistui:", error);
    setLocationName("Paikan haku epäonnistui");
  }
};
  const [tempLocationName, setTempLocationName] = useState("");

  const searchForLocation = async () => {
    console.log("🔍 Haetaan paikka:", searchLocation); // TULOSTAA HAKUSANAN

  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${searchLocation}`
    );
    console.log("📡 API-vastaus:", res.data); // TULOSTAA NOMINATIM API -VASTAUKSEN

    if (res.data.length > 0) {
      const place = res.data[0];
      const newLat = parseFloat(place.lat);
      const newLon = parseFloat(place.lon);
      const newLocationName = place.display_name.split(",")[0]; // Näytetään vain ensimmäinen osa nimestä
      console.log("📍 Uusi paikka löydetty:", place.display_name); // TULOSTAA LÖYDETYN PAIKAN
      console.log("🌍 Päivitetään koordinaatit:", newLat, newLon); // Tulostaa uudet koordinaatit
      
      setLatitude(newLat);
      setLongitude(newLon);
      setTimeout(() => {
        setLocationName(newLocationName);
      }, 50);
    
      await reverseGeocode(newLat, newLon)
      fetchWeatherData(newLat, newLon);
    } else {
      console.warn("⚠️ Paikkaa ei löydy!");
      setError("Paikkaa ei löydy");
    }
  } catch (error) {
    console.error("❌ Paikkahaun virhe:", error);
    setError("Paikan haku epäonnistui");
  }
};

const getUserLocation = () => {
  if (!navigator.geolocation) {
    setError("❌ Selaimesi ei tue GPS:ää");
    return;
  }

  console.log("📡 Pyydetään GPS-lupaa..."); // 🔥 TULOSTAA DEBUG-VIESTIN

  navigator.permissions
    .query({ name: "geolocation" })
    .then((result) => {
      console.log("📜 GPS-luvan tila:", result.state); // 🔥 TULOSTAA LUVAN TILAN

      if (result.state === "denied") {
        setError("❌ GPS on estetty. Salli selaimen asetuksista!");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;

          console.log("📍 GPS-sijainti saatu:", newLat, newLon); // 🔥 Varmistus että GPS toimii

          setLatitude(newLat);
          setLongitude(newLon);
          setLocationName("Oma sijainti");
          await reverseGeocode(newLat, newLon);
          fetchWeatherData(newLat, newLon);
        },
        (error) => {
          console.error("❌ GPS-virhe:", error);
          setError("📍 GPS ei käytettävissä. Tarkista asetukset.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        
      );
    });
};

  const calculateMoonPhase = () => {
    const today = new Date();
    const lastNewMoon = new Date("2025-02-28");
    const msPerDay = 1000 * 60 * 60 * 24;
    const moonCycle = 29.53;
    let diffDays = Math.floor((today - lastNewMoon) / msPerDay) % moonCycle;
    if (diffDays < 0) diffDays += moonCycle;
    let phaseText = "🌑 Uusikuu";
    if (diffDays < 1.5) phaseText = "🌑 Uusikuu";
    else if (diffDays < 7.5) phaseText = "🌒 Kasvava sirppi 1/4";
    else if (diffDays < 14.5) phaseText = "🌓 Kasvava puolikuu 2/4";
    else if (diffDays < 16.5) phaseText = "🌕 Täysikuu";
    else if (diffDays < 23) phaseText = "🌖 Pienenevä kuu 3/4";
    else phaseText = "🌗 Pienenevä kuu 4/4";
    setMoonPhase(phaseText);
  };

  const fetchWeatherData = async (lat, lon) => {
  if (!lat || !lon) {
    console.error("❌ Koordinaatit puuttuvat, ei voida hakea säätietoja!");
    return;
  }
  setLoading(true);
  setError(null);
  try {
    console.log("📡 Haetaan säätiedot:", lat, lon); // Tulostaa haettavat koordinaatit
    const url = `https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::harmonie::surface::point::simple&latlon=${lat},${lon}&parameters=Temperature,FeelsLike,WindSpeedMS,WindDirection,Pressure,WeatherSymbol3`;
    const response = await axios.get(url);
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsedResult = parser.parse(response.data);
    
    if (!parsedResult?.["wfs:FeatureCollection"]?.["wfs:member"]) {
      throw new Error("Virheellinen XML-muoto");
    }
    console.log("✅ Säädata haettu onnistuneesti!");
    const elements = parsedResult["wfs:FeatureCollection"]["wfs:member"];
    const dataMap = {};
    
    elements.forEach((el) => {
      const element = el["BsWfs:BsWfsElement"];
      const time = new Date(element["BsWfs:Time"]);
      let hourKey = time.getHours();
      if (hourKey === 0) hourKey = 24; // Muunnetaan klo 00 → 24
      
      const dayKey = time.toISOString().split("T")[0];
      const paramName = element["BsWfs:ParameterName"];
      let value = element["BsWfs:ParameterValue"];
      
      const openMap = () => {
        if (!latitude || !longitude) {
        setError("📍 Ei GPS-sijaintia. Käytä 'Oma Paikka' ensin!");
        <button onClick={openMap}>📍 Avaa kartta</button>
        return;
  }

      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      console.log("🗺️ Avataan kartta:", url);
      setTimeout(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, 300);
};
      

      if ([8, 16, 24].includes(hourKey)) { // Nyt mukana myös klo 24
        if (!dataMap[dayKey]) dataMap[dayKey] = {};
        if (!dataMap[dayKey][hourKey]) dataMap[dayKey][hourKey] = {};
        if (paramName === "FeelsLike" || paramName === "Temperature") {
          value = parseFloat(value).toFixed(1);
        }
        dataMap[dayKey][hourKey][paramName] = value;
      }
    });
    console.log("🌦 Päivitetty säädata:", dataMap); // Tulostaa uuden säädatan
    setForecastData(dataMap);

  } catch (error) {
    console.error("❌ Säätiedon haku epäonnistui:", error);
    setError("Säätiedon haku epäonnistui");
  } finally {
    setLoading(false);
  }
};

  return (
    <div key={`${locationName}-${latitude}-${longitude}`}>
      <h2>🌦 Sääennuste</h2>
      <p>📍 {locationName} ({latitude || "-"}, {longitude || "-"})</p>
      <p>🌙 Kuun vaihe: {moonPhase}</p>
      <input
        type="text"
        value={searchLocation}
        onChange={(e) => setSearchLocation(e.target.value)}
        placeholder="Hae paikka..."
      />
      <button onClick={searchForLocation}>🔍 HAE</button>    
      <button onClick={getUserLocation}>OMA PAIKKA</button>
      {loading && <p>⏳ Ladataan säätietoja...</p>}
      {error && <p style={{ color: "red" }}>⚠️ {error}</p>}
      <div>
        {Object.entries(forecastData).map(([date, hours]) => (
          <div key={date}>
            <h3>{date}</h3>
            {Object.entries(hours).map(([hour, data]) => (
              <p key={hour}>
                ⏰ {hour}:00 🌡 {data.Temperature}°C (Tuntuu kuin {data.FeelsLike}°C) 💨 {data.WindSpeedMS}m/s {data.WindDirection}° 🌤 Sää: {weatherDescriptions[data.WeatherSymbol3] || "Tuntematon"}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weather;
