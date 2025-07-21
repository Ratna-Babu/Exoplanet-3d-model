from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Route to fetch exoplanets data
@app.route('/api/exoplanets', methods=['GET'])
def get_exoplanets():
    try:
        nasa_api_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
        query_params = {
            'query': 'SELECT pl_name, hostname, ra, dec, sy_dist, pl_rade, disc_year FROM ps WHERE default_flag = 1',
            'format': 'json'
        }
        # Disable SSL verification
        response = requests.get(nasa_api_url, params=query_params, verify=False)
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({"error": "Failed to fetch data from NASA API"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to fetch planetary system data for a specific star
@app.route('/api/planetary-system/<star_name>', methods=['GET'])
def get_planetary_system(star_name):
    try:
        nasa_api_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
        # Adjust the query parameters to fetch data related to the star, including pl_eqt and relevant atmospheric data
        query_params = {
            'query': f"""
                SELECT 
                    pl_name, pl_orbsmax, pl_rade, pl_bmasse, st_mass, st_teff,
                    pl_orbper, pl_orbeccen, pl_orbincl, st_rad, st_lum, pl_dens,
                    pl_eqt, pl_trandep, pl_trandur, pl_bmassj
                FROM ps 
                WHERE hostname = '{star_name}'
            """,
            'format': 'json'
        }
        # Disable SSL verification
        response = requests.get(nasa_api_url, params=query_params, verify=False)
        if response.status_code == 200:
            data = response.json()
            return jsonify(data)
        else:
            return jsonify({"error": "Failed to fetch planetary system data from NASA API"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
