import React, { useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapClickHandler({ setLat, setLon }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat);
      setLon(e.latlng.lng);
    },
  });
  return null;
}

function App() {
  const [lat, setLat] = useState(28.61);
  const [lon, setLon] = useState(77.23);
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2020);
  const [data, setData] = useState([]);

  const fetchTrend = async () => {
    const res = await axios.post("http://localhost:8000/api/heatwave-trend", {
      lat,
      lon,
      start_year: startYear,
      end_year: endYear,
    });
    setData(res.data);
  };

  const chartData = {
    labels: data.map((item) => item.year),
    datasets: [
      {
        label: "Heatwave Events",
        data: data.map((item) => item.heatwave_events),
        borderColor: "red",
        backgroundColor: "rgba(255,0,0,0.4)",
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Climate Hazard Trend Analyzer</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>Start Year: </label>
        <input type="number" value={startYear} onChange={(e) => setStartYear(parseInt(e.target.value))} />
        <label> End Year: </label>
        <input type="number" value={endYear} onChange={(e) => setEndYear(parseInt(e.target.value))} />
        <button onClick={fetchTrend}>Analyze</button>
      </div>

      <div>
        <strong>Selected Coordinates:</strong> Latitude: {lat.toFixed(4)}, Longitude: {lon.toFixed(4)}
      </div>

      <MapContainer center={[lat, lon]} zoom={4} style={{ height: "400px", width: "100%", marginTop: "20px" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />
        <MapClickHandler setLat={setLat} setLon={setLon} />
        <Marker position={[lat, lon]} />
      </MapContainer>

      <div style={{ marginTop: "40px", width: "90%", maxWidth: "700px" }}>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default App;
