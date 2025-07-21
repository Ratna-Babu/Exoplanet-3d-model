# 3D Exoplanet Explorer 🌌

## Overview
3D Exoplanet Explorer is an interactive web application that visualizes thousands of real exoplanetary systems discovered by NASA. Built with React and Three.js, this tool allows users to navigate through a 3D star field, select host stars, and explore detailed planetary systems with procedurally generated textures.  

#### This Project is Developed for the NASA Space Apps Challenge 2024 by:
```
B. Ratna Babu, SK. Khaja, C. Sai Tejaswini, T. Eswar Sai Nandan, L. Kalyani, and U. Mounika.
```


## Features ✨
- **Immersive 3D Star Field**: Navigate through thousands of real exoplanet host stars
- **Detailed Star Information**: View distance, temperature, discovery year, and other properties
- **Planetary System Visualization**: Explore planets with accurate orbits and physical characteristics
- **Dynamic Planet Textures**: Procedurally generated unique textures for each planet
- **Modern UI**: Responsive interface built with React and Material UI
- **Live NASA Data**: Real-time data from NASA's Exoplanet Archive

## Demo
<img width="1527" height="859" alt="Screenshot 2025-07-21 221735" src="https://github.com/user-attachments/assets/f06da373-7df3-46d5-a166-e2d879921942" />
<img width="1327" height="746" alt="Screenshot 2025-07-21 225741" src="https://github.com/user-attachments/assets/fb0ba2c6-4e22-4be4-9582-59a6b2461d28" />
<img width="1008" height="850" alt="Screenshot 2025-07-21 215424" src="https://github.com/user-attachments/assets/b03ab549-1a7c-4cc8-ac35-7c07611108ff" />
<img width="1125" height="633" alt="Screenshot 2025-07-21 225303" src="https://github.com/user-attachments/assets/796386ea-ea3c-4a8a-b968-94ac7d263bec" />
<img width="1012" height="569" alt="Screenshot 2024-10-06 131016" src="https://github.com/user-attachments/assets/ff187202-a090-4d62-a6b9-0c79542165c2" />


## Getting Started 🚀

### Prerequisites
- Node.js (v16+)
- npm
- Python 3.8+

### Installation
1. Clone the repository:
```bash
git clone <your-repo-url>
cd 3dexp_backup
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up backend:
```bash
# Install Python dependencies
pip install flask flask-cors requests

# Start backend server
python src/backend/app.py
```

4. Start the React app:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure 📂
```
3dexp_backup/
├── src/
│   ├── Exo3d/           # Three.js visualization components
│   ├── backend/         # Flask API implementation
│   ├── components/      # React UI components
│   ├── App.js           # Main application entry point
│   └── ...
├── public/              # Static assets (textures, images)
├── package.json         # Frontend dependencies
├── requirements.txt     # Backend dependencies
└── README.md
```

## API Endpoints 🔌
| Endpoint | Description |
|----------|-------------|
| `GET /api/exoplanets` | List of exoplanet host stars with basic info |
| `GET /api/planetary-system/<star_name>` | Detailed planetary system data for a specific star |

## Technologies Used 💻
- **Frontend**: React, Three.js, Material UI, Axios
- **Backend**: Python, Flask, Flask-CORS
- **Data Source**: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)

## Customization 🛠️
1. Add new planet textures to `public/images/`
2. Modify queries in `src/backend/app.py` to fetch additional data fields
3. Adjust visualization parameters in `src/Exo3d/` components

## License 📄
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team 👥
Developed for NASA Space Apps Challenge 2024 by:
- B. Ratna Babu
- SK. Khaja
- C. Sai Tejaswini
- T. Eswar Sai Nandan
- L. Kalyani
- U. Mounika

## Acknowledgments 🙏
- NASA Exoplanet Archive for open data access
- Three.js community for 3D rendering tools
- Material UI team for UI components
