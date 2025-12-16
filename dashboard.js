const API_BASE = "https://gtfs-links-be.onrender.com";

let livello = "nazionale";
let valore = null;
let view, layer, chart;

// Calcolo centro GeoJSON
function getCenter(geojson) {
  if (!geojson || !geojson.features.length) return [12, 43];
  const lons = geojson.features.map(f => f.geometry.coordinates[0]);
  const lats = geojson.features.map(f => f.geometry.coordinates[1]);
  const lon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  return [lon, lat];
}

// Carica heatmap
function loadMap(geojson) {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/renderers/HeatmapRenderer"
  ], function(Map, MapView, FeatureLayer, HeatmapRenderer) {

    const map = new Map({ basemap: "gray-vector" });

    if (view) view.destroy();

    view = new MapView({
      container: "mapDiv",
      map: map,
      center: [12, 43],
      zoom: 6
    });

    if (layer) map.remove(layer);

    // Layer heatmap
    layer = new FeatureLayer({
      source: geojson.features.map((f, i) => ({
        geometry: {
          type: "point",
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1]
        },
        attributes: { ObjectID: i }
      })),
      objectIdField: "ObjectID",
      geometryType: "point",
      renderer: new HeatmapRenderer({
        field: "ObjectID",
        colorStops: [
          { ratio: 0, color: "rgba(0,0,255,0)" },
          { ratio: 0.2, color: "blue" },
          { ratio: 0.4, color: "cyan" },
          { ratio: 0.6, color: "lime" },
          { ratio: 0.8, color: "yellow" },
          { ratio: 1, color: "red" }
        ],
        blurRadius: 20,
        maxPixelIntensity: 50
      })
    });

    map.add(layer);

    // Centra e zoom
    const [centerLon, centerLat] = getCenter(geojson);
    let zoomLevel = 6;
    if (livello === "regionale") zoomLevel = 9;
    else if (livello === "comunale") zoomLevel = 13;

    view.goTo({ center: [centerLon, centerLat], zoom: zoomLevel });
  });
}

// Carica statistiche mezzi
async function loadStats() {
  let url = `${API_BASE}/stats/mezzi?livello=${livello}`;
  if (valore) url += `&valore=${encodeURIComponent(valore)}`;

  const res = await fetch(url);
  const data = await res.json();

  const ctx = document.getElementById("mezziBarChart");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.mezzo),
      datasets: [{
        label: "Numero di GTFS",
        data: data.map(d => d.count),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
        x: { title: { display: true, text: "Tipologia di mezzo" } }
      }
    }
  });
}

// Fetch dati GeoJSON e stats
async function loadData() {
  let url = `${API_BASE}/map/${livello}`;
  if (valore) {
    const key = livello === "regionale" ? "regione" : "comune";
    url += `?${key}=${encodeURIComponent(valore)}`;
  }

  const res = await fetch(url);
  const geojson = await res.json();

  document.getElementById("title").innerText = valore || "Italia";
  loadMap(geojson);
  loadStats();
}

// Avvio iniziale
loadData();

const links = document.querySelectorAll(".custom-nav .nav-link");
    links.forEach(link => {
    if(link.href === window.location.href) {
        link.classList.add("active");
    } else {
        link.classList.remove("active");
    }
});