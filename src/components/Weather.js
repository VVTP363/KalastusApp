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
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [moonPhase, setMoonPhase] = useState("");

  useEffect(() => {
    setCurrentDayIndex(0); // Pakotetaan aloittamaan alusta, kun data päivittyy
  }, [forecastData]);

  const [locationFetched, setLocationFetched] = useState(false);

  useEffect(() => {
  if (!locationFetched) {
    getUserLocation();
    setLocationFetched(true); // Estetään useampi haku
  }
}, [locationFetched]);


  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    console.log("🔥 Päivämäärä vaihtui:", currentDayIndex);
  }, [currentDayIndex]);

  useEffect(() => {
  if (latitude && longitude && !loading) {
    console.log("📡 Haetaan säädataa sijainnille:", latitude, longitude);
    fetchWeatherData(latitude, longitude);
  }
}, [latitude, longitude]);

  useEffect(() => {
  console.log("🔄 Päivitetty säädata:", forecastData);
}, [forecastData]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError("Selaimesi ei tue GPS-sijaintia");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error("❌ GPS-virhe:", error);
        setError("GPS ei käytettävissä");
      }
    );
  };

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
      setLocationName(location);
    } catch (error) {
      console.error("❌ Paikan haku epäonnistui:", error);
    }
  };

const fetchWeatherData = async (lat, lon) => {
  setLoading(true);
  setError(null);
  try {
    const url = `https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::harmonie::surface::point::simple&latlon=${lat},${lon}&parameters=Temperature,WindSpeedMS,WindDirection,Pressure,WeatherSymbol3`;

    console.log("📡 Haetaan säädataa:", url);
    const response = await axios.get(url);
    const xml = response.data;
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsedResult = parser.parse(xml);

    if (!parsedResult?.["wfs:FeatureCollection"]?.["wfs:member"]) {
      throw new Error("Virheellinen XML-muoto");
    }

    const elements = parsedResult["wfs:FeatureCollection"]["wfs:member"];
    const dataMap = {};
    
    const now = new Date();
    const currentHour = now.getHours();

    elements.forEach((el) => {
      const element = el["BsWfs:BsWfsElement"];
      const time = new Date(element["BsWfs:Time"]);
      let hourKey = time.getHours();
      const paramName = element["BsWfs:ParameterName"];
      const value = element["BsWfs:ParameterValue"];

      const dayKey = time.toISOString().split("T")[0];

      if (!dataMap[dayKey]) {
        dataMap[dayKey] = {};
      }

      // 🔹 Muutetaan 00:00 → 24:00 päivän viimeiseksi arvoksi
      if (hourKey === 0) {
        hourKey = 24;
      }

      // 🔹 Jos klo 16 jälkeen, näytä tunnin välein vuorokauden loppuun asti
      if (currentHour >= 16 && hourKey >= currentHour && hourKey <= 24) {
        if (!dataMap[dayKey][hourKey]) {
          dataMap[dayKey][hourKey] = {};
        }
        dataMap[dayKey][hourKey][paramName] = value;
      } 
      // 🔹 Muutoin pidetään 08:00, 16:00 ja 24:00 logiikka
      else if ([8, 16, 24].includes(hourKey)) {
        if (!dataMap[dayKey][hourKey]) {
          dataMap[dayKey][hourKey] = {};
        }
        dataMap[dayKey][hourKey][paramName] = value;
      }
    });

    setForecastData(dataMap);
    setCurrentDayIndex(0);
  } catch (error) {
    console.error("❌ Virhe haettaessa säädataa:", error);
    setError("Säätiedon haku epäonnistui");
  } finally {
    setLoading(false);
  }
};

  const searchForLocation = async () => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchLocation}`
      );
      if (res.data.length > 0) {
        const place = res.data[0];
        setLatitude(place.lat);
        setLongitude(place.lon);
        setLocationName(place.display_name.split(",")[0]);
        fetchWeatherData(place.lat, place.lon);
      } else {
        setError("Paikkaa ei löydy");
      }
    } catch (error) {
      console.error("❌ Paikkahaun virhe:", error);
      setError("Paikan haku epäonnistui");
    }
  };

  const calculateMoonPhase = () => {
    const today = new Date();
    
    // Viimeisin uusikuu ennen tätä päivämäärää
    const lastNewMoon = new Date("2025-02-28"); // Uusikuu ennen täysikuuta 14.3.2025

    const msPerDay = 1000 * 60 * 60 * 24;
    const moonCycle = 29.53; // Kuun kierto päivinä

    // Lasketaan päivät viimeisimmästä uudesta kuusta
    let diffDays = Math.floor((today - lastNewMoon) / msPerDay) % moonCycle;
    if (diffDays < 0) diffDays += moonCycle; // Korjataan mahdollinen negatiivinen arvo

    // Kuun vaiheet:
    if (diffDays < 1.5) setMoonPhase("🌑 Uusikuu");
    else if (diffDays < 7.5) setMoonPhase("🌒 Kasvava sirppi 1/4");
    else if (diffDays < 14.5) setMoonPhase("🌓 Kasvava puolikuu 2/4");
    else if (diffDays < 16.5) setMoonPhase("🌕 Täysikuu"); // Täysikuu kestää 1.5 päivää
    else if (diffDays < 23) setMoonPhase("🌖 Pienenevä kuu 3/4"); // 16.5–23 päivää
    else setMoonPhase("🌗 Pienenevä kuu 4/4"); // 23–29.53 päivää
};

  const changeDay = (direction) => {
  setCurrentDayIndex(prevIndex => {
    const days = Object.keys(forecastData);
    let newIndex = prevIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= days.length) newIndex = days.length - 1;
    
    console.log("🔄 Vaihdetaan päivä ->", newIndex, "Päivämäärä:", days[newIndex]); 
    return newIndex;
  });
};

  const weatherIcons = {
    "1": "☀️ Aurinkoista",
    "2": "🌤️ Puolipilvistä",
    "3": "☁️ Pilvistä",
    "21": "🌧️ Sade",
    "22": "🌨️ Lumisade",
    "23": "🌧️🌨️ Räntäsade",
  };

  const days = Object.keys(forecastData);
  const currentDay = days[currentDayIndex];
  const currentData = forecastData[currentDay];

  return (
    <div>
      <h2>🌦 Sääennuste</h2>
      <p>📍 {locationFetched ? `${locationName} (${latitude}, ${longitude})` : "Paikka haetaan..."} </p>
      <p>🌙 Kuun vaihe: {moonPhase}</p>

      <div>
        <input
  type="text"
  id="location-search"
  name="location"
  placeholder="Syötä paikkakunta..."
  value={searchLocation}
  onChange={(e) => setSearchLocation(e.target.value)}
/>

        <button type="button" onClick={searchForLocation}>🔍 Hae</button>
        <button type="button" onClick={getUserLocation}>📍 Oma paikka</button>

      </div>

      {loading && <p>⏳ Ladataan säätietoja...</p>}
      {error && <p style={{ color: "red" }}>⚠️ {error}</p>}

      {currentData && (
        <div key={currentDay}> // Pakottaa Reactin re-rendaamaan UI:n
          <h3>📅 {currentDay}</h3>
          {Object.keys(currentData).map((hour) => (
            <div key={hour}>
              <h4>🕒 Klo {hour}:00</h4>
              <p>🌡 Lämpötila: {currentData[hour].Temperature}°C</p>
              <p>💨 Tuulen nopeus: {currentData[hour].WindSpeedMS} m/s</p>
              <p>🧭 Tuulen suunta: {currentData[hour].WindDirection}°</p>
              <p>🔽 Ilmanpaine: {currentData[hour].Pressure} hPa</p>
              <p>🌥️ Sää: {weatherIcons[currentData[hour].WeatherSymbol3] || "?"}</p>
            </div>
          ))}
          <button onClick={() => changeDay(-1)}>⬅ Edellinen</button>
          <button onClick={() => changeDay(1)}>Seuraava ➡</button>
        </div>
      )}
    </div>
  );
};

export default Weather;
