const API_BASE = "https://gtfs-links-be.onrender.com";
let livello = "nazionale";
let valore = null;
let view, layer, chart;

// Funzione iniziale
async function loadData() {
  let url = `${API_BASE}/map/${livello}`;
  if (valore) {
    const key = livello === "regionale" ? "regione" : "comune";
    url += `?${key}=${encodeURIComponent(valore)}`;
  }

  const res = await fetch(url);
  const geojson = await res.json();
  loadMap(geojson);
  loadStats();
}

// Mappa ArcGIS
function loadMap(geojson) {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer"
  ], function(Map, MapView, FeatureLayer) {

    const map = new Map({ basemap: "gray-vector" });

    if (view) {
      view.destroy();
    }

    view = new MapView({
      container: "mapDiv",
      map: map,
      center: [12, 43],
      zoom: 6
    });

    if (layer) {
      map.remove(layer);
    }

    layer = new FeatureLayer({
      source: geojson.features.map((f, i) => ({
        geometry: { type: "point", longitude: f.geometry.coordinates[0], latitude: f.geometry.coordinates[1] },
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
      featureReduction: { type: "cluster", clusterRadius: "80px" }
    });

    map.add(layer);

    // Click sulla mappa
    view.on("click", async (event) => {
      const hit = await view.hitTest(event);
      const g = hit.results?.[0]?.graphic;
      if (!g) return;

      const lvl = g.attributes.level;
      const name = g.attributes.name;

      if (lvl === "regionale") { livello = "regionale"; valore = name; }
      else if (lvl === "comunale") { livello = "comunale"; valore = name; }
      else return;

      document.getElementById("title").innerText = name;
      loadData();
    });
  });
}

// Grafico mezzi
async function loadStats() {
  let url = `${API_BASE}/stats/mezzi?livello=${livello}`;
  if (valore) url += `&valore=${encodeURIComponent(valore)}`;

  const res = await fetch(url);
  const data = await res.json();

  const ctx = document.getElementById("mezziChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(d => d.mezzo),
      datasets: [{ data: data.map(d => d.count) }]
    }
  });
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