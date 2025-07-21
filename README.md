# 3D Exoplanet Explorer

A web application for interactive 3D visualization and exploration of exoplanetary systems discovered by NASA. Users can browse a star field, select stars, and explore their planetary systems in a dynamic, Three.js-powered environment.

## Features

- **3D Star Field:** Visualizes thousands of real exoplanet host stars in a navigable 3D space.
- **Star Details:** Click on a star to view its distance, temperature, discovery year, and more.
- **Planetary System View:** Zoom into a star to see its planets, their orbits, and physical properties.
- **Procedural Planet Textures:** Each planet is rendered with a unique, procedurally generated texture based on its properties.
- **Modern UI:** Built with React and Material UI for a sleek, responsive experience.
- **Live NASA Data:** Fetches up-to-date exoplanet data from NASA’s Exoplanet Archive API via a Flask backend.

## Demo

![screenshot](public/images/starsurface.jpg)

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm
- Python 3.8+

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd 3dexp_backup
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Start the Backend (Flask API)

1. Install Python dependencies (Flask, flask-cors, requests):
   ```bash
   pip install flask flask-cors requests
   ```
2. Run the backend server:
   ```bash
   python src/backend/app.py
   ```
   The backend will start on [http://127.0.0.1:5000](http://127.0.0.1:5000).

### 4. Start the Frontend (React App)

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000) and connect to the backend for data.

## Project Structure

```
3dexp_backup/
├── src/
│   ├── Exo3d/           # 3D visualization components (Three.js)
│   ├── backend/         # Flask backend API
│   ├── components/      # (Reserved for additional React components)
│   ├── App.js           # Main React entry
│   └── ...
├── public/              # Static assets (textures, images)
├── package.json         # Frontend dependencies
├── requirements.txt     # Backend dependencies
└── README.md            # Project documentation
```

## API Endpoints (Backend)

- `GET /api/exoplanets` — List of exoplanet host stars with basic info
- `GET /api/planetary-system/<star_name>` — Detailed planetary system for a given star

## Technologies Used

- **Frontend:** React, Three.js, Material UI, Axios
- **Backend:** Python, Flask, Flask-CORS, Requests
- **Data Source:** [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)

## Customization

- Add new textures to `public/images/` for planets or stars.
- Modify queries in `src/backend/app.py` to fetch additional data fields.

## License

MIT

## Acknowledgments

- NASA Exoplanet Archive for open data
- Three.js for 3D rendering
- Material UI for UI components
