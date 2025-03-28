import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import proj4 from "proj4";
import "proj4leaflet";
import { useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";

const OmaPaikkaKohdistus = ({ trigger }) => {
  const map = useMap();

  useEffect(() => {
    if (trigger) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 13);
            L.marker([latitude, longitude])
              .addTo(map)
              .bindPopup("Oma sijaintisi")
              .openPopup();
          },
          (error) => {
            console.error("Sijainnin haku epäonnistui:", error);
          }
        );
      } else {
        alert("Selaimesi ei tue paikkatietoa.");
      }
    }
  }, [trigger, map]);

  return null;
};

const ClickableMap = ({ setCoords }) => {
  useMapEvents({
    click(e) {
      setCoords(e.latlng);
      console.log("Karttapohja valinta käytössä, sijainti:", e.latlng);
    },
  });
  return null;
};

const MapZoomer = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (coords?.lat && coords?.lng) {
      map.flyTo([coords.lat, coords.lng], 13);
    }
  }, [coords, map]);

  return null;
};

const VirtavesiView = ({ tideHour = 6 }) => {
  const mouthCoords = { lat: 69.0, lng: 25.0 };
  const [coords, setCoords] = useState(mouthCoords);
  const [tideAdjust, setTideAdjust] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [haeOmaPaikka, setHaeOmaPaikka] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHaeOmaPaikka(true);
    const timer = setTimeout(() => setHaeOmaPaikka(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json`
      );
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
      }
    } catch (error) {
      console.error("Paikkahaku epäonnistui:", error);
    }
  };

  const distanceKm = 0; // Korvaa oikealla laskennalla tarvittaessa
  const adjustedTideHour = (parseInt(tideHour) + tideAdjust) % 24;

  const baseLayerUrl = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  const crs = L.CRS.EPSG3857;

  return (
    <div>
      <h2>🎣 Virtavesien ottiaikaikkuna</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', marginBottom: '1em' }}>
        <input
          type="text"
          placeholder="Hae paikka (esim. Näätämö)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '0.5em' }}
        />
        <button onClick={handleSearch} style={{ padding: '0.5em' }}>🔍 HAE</button>
        <button onClick={() => navigate("/")} style={{ padding: '0.5em' }}>↩️ VAIHDA JÄRVI- / MERIVETEEN</button>
      </div>

      <p>Nousuveden huippu: klo {adjustedTideHour}:00</p>
      <label>
        ⏱ Säädä huippua: {tideAdjust >= 0 ? "+" : ""}{tideAdjust} h
        <input
          type="range"
          min="-3"
          max="3"
          step="1"
          value={tideAdjust}
          onChange={(e) => setTideAdjust(parseInt(e.target.value))}
        />
      </label>
      <p>📍 Valittu etäisyys jokisuusta: {distanceKm.toFixed(2)} km</p>

      <div style={{ height: "300px", marginTop: "1em" }}>
        <MapContainer center={[coords.lat, coords.lng]} zoom={9} style={{ height: "100%" }} crs={crs}>
          <TileLayer url={baseLayerUrl["osm"]} attribution="&copy; OpenStreetMap contributors" />
          <MapZoomer coords={coords} />
          <OmaPaikkaKohdistus trigger={haeOmaPaikka} />
          <ClickableMap setCoords={setCoords} />
          <Marker
            position={[coords.lat, coords.lng]}
            icon={L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            })}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default VirtavesiView;
