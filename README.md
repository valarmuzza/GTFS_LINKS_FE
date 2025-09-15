# GTFS_LINKS_FE

Frontend del progetto **GTFS Links**, un’applicazione web che mostra in forma tabellare i dataset GTFS disponibili in Italia.

## 🌐 Tecnologie utilizzate
- **HTML5** e **JavaScript**
- **Bootstrap 5** per lo stile e la UI
- **Netlify** per il deploy e l’hosting statico
- Connessione al backend su **FastAPI** (deploy su Render)

## ⚙️ Struttura del progetto
- `index.html` → pagina principale con la tabella dei GTFS
- `about.html` → descrizione del progetto
- `submit.html` → form per segnalare nuovi GTFS

## 🚀 Deploy
Il frontend è hostato su **Netlify** ed è raggiungibile a questo indirizzo:  
👉 [https://sparkling-cucurucho-a31801.netlify.app](https://sparkling-cucurucho-a31801.netlify.app)

## 🔗 Collegamento al backend
La tabella della home legge i dati da questo endpoint:  
`https://gtfs-links-be.onrender.com/links`