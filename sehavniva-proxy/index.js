const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5001;

app.use(cors());

app.get("/tideapi", async (req, res) => {
  const { lat, lon, ...params } = req.query;
  if (!lat || !lon) {
    return res.status(400).send("Missing lat/lon");
  }

  const queryParams = new URLSearchParams({
    lat,
    lon,
    datatype: "tab",
    refcode: "cd",
    place: "",
    file: "",
    lang: "fi",
    interval: "60",
    nr: "1",
    ...params,
  });

  const url = `https://api.sehavniva.no/tideapi.php?${queryParams}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "KalasääApp/1.0 (+https://kalasaapp.example.com)",
        "Accept": "*/*"
      }
    });
    res.send(response.data);
  } catch (error) {
    console.error("❗ Proxy error:", error.message);
    res.status(500).send("Proxy failed to fetch tide data");
  }
});

app.listen(PORT, () => {
  console.log(`🌊 SeHavniva proxy running on http://localhost:${PORT}`);
});
