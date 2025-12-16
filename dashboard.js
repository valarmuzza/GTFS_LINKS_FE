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

// Carica punti sulla mappa con cluster e numeri
function loadMap(geojson) {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer"
  ], function(Map, MapView, FeatureLayer) {

    const map = new Map({ basemap: "gray-vector" });

    if (view) view.destroy();

    view = new MapView({
      container: "mapDiv",
      map: map,
      center: [12, 43],
      zoom: 6
    });

    if (layer) map.remove(layer);

    layer = new FeatureLayer({
      source: geojson.features.map((f, i) => ({
        geometry: {
          type: "point",
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1]
        },
        attributes: {
          ObjectID: i,
          name: f.properties.name,
          count: f.properties.count,
          level: f.properties.level
        }
      })),
      objectIdField: "ObjectID",
      geometryType: "point",
      fields: [
        { name: "ObjectID", type: "oid" },
        { name: "name", type: "string" },
        { name: "count", type: "integer" },
        { name: "level", type: "string" }
      ],
      popupTemplate: {
        title: "{name}",
        content: "GTFS disponibili: <b>{count}</b>"
      },
      labelingInfo: [{
        labelExpressionInfo: { expression: "Text($feature.count, '#')" },
        symbol: {
          type: "text",
          color: "white",
          haloColor: "black",
          haloSize: "1px",
          font: { size: 12, weight: "bold" }
        },
        labelPlacement: "above-center"
      }],
      featureReduction: {
        type: "cluster",
        clusterRadius: "60px",
        popupTemplate: {
          title: "Cluster",
          content: "GTFS totali: {cluster_count}"
        }
      }
    });

    map.add(layer);

    // Zoom e centro automatico
    const [centerLon, centerLat] = getCenter(geojson);
    let zoomLevel = 6;
    if (livello === "regionale") zoomLevel = 9;
    else if (livello === "comunale") zoomLevel = 13;

    view.goTo({ center: [centerLon, centerLat], zoom: zoomLevel });
  });
}

// Carica grafico a barre con tipologia di mezzi
async function loadStats() {
  let url = `${API_BASE}/stats/mezzi?livello=${livello}`;
  if (valore) url += `&valore=${encodeURIComponent(valore)}`;

  const res = await fetch(url);
  const data = await res.json();

  const canvas = document.getElementById("mezziBarChart");
  if (!canvas) return console.error("Canvas non trovato");

  const ctx = canvas.getContext("2d");

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