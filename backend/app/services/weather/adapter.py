import requests
import datetime
from app.config import settings

class WeatherAdapter:
    """
    External environmental & climate signal adapter.
    Queries OpenWeather API if key is present; otherwise returns robust synthetic climate signals.
    """

    @staticmethod
    def get_weather_signal(region: str, country: str = "India") -> dict:
        if settings.WEATHER_API_KEY:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?q={region},{country}&appid={settings.WEATHER_API_KEY}&units=metric"
                resp = requests.get(url, timeout=4)
                if resp.status_code == 200:
                    data = resp.json()
                    temp = data.get("main", {}).get("temp", 28.0)
                    humidity = data.get("main", {}).get("humidity", 70)
                    weather_desc = data.get("weather", [{}])[0].get("description", "clear sky")

                    severity = "Low"
                    if humidity > 85 or "rain" in weather_desc.lower():
                        severity = "High"
                    elif temp > 38.0 or humidity > 75:
                        severity = "Moderate"

                    return {
                        "region": region,
                        "country": country,
                        "signal_type": "Monsoon Rainfall" if "rain" in weather_desc.lower() else "Climate Signal",
                        "severity": severity,
                        "observed_value": f"{temp}°C, {humidity}% humidity ({weather_desc})",
                        "forecast_value": "Elevated moisture & demand risk projected over next 7 days",
                        "source": "OpenWeather Live API",
                        "timestamp": datetime.datetime.utcnow().isoformat()
                    }
            except Exception as e:
                pass  # Fallback to synthetic climate signal on failure

        # Synthetic fallback climate signal per region across all 5 BRICS nations
        climate_profiles = {
            "Maharashtra": {
                "signal_type": "Heavy Monsoon Rainfall",
                "severity": "High",
                "observed_value": "240 mm rainfall in 48h (88% humidity)",
                "forecast_value": "Monsoon flooding risk. +45% ORS & antibiotic demand surge projected."
            },
            "Kerala": {
                "signal_type": "Tropical Moisture Anomaly",
                "severity": "Moderate",
                "observed_value": "180 mm rainfall in 24h (92% humidity)",
                "forecast_value": "Vector-borne outbreak surge warning. Rehydration supply priority."
            },
            "Gujarat": {
                "signal_type": "Heatwave Signal",
                "severity": "Moderate",
                "observed_value": "41°C, 35% humidity",
                "forecast_value": "Heat exposure & rehydration demand surge projected."
            },
            "Delhi NCR": {
                "signal_type": "Smog & AQI Spike",
                "severity": "High",
                "observed_value": "AQI 380 (Hazardous Air)",
                "forecast_value": "Respiratory infection & inhaler demand surge."
            },
            "Guangdong": {
                "signal_type": "Typhoon Heavy Precipitation",
                "severity": "High",
                "observed_value": "290 mm rainfall in 24h (94% humidity)",
                "forecast_value": "Typhoon flooding. +50% acute respiratory & rehydration surge."
            },
            "Hubei": {
                "signal_type": "Seasonal Flu Wave",
                "severity": "Moderate",
                "observed_value": "12°C, High Humidity",
                "forecast_value": "Viral respiratory surge. Antiviral & antibiotic buffer needed."
            },
            "Sichuan": {
                "signal_type": "Mountain Humidity Surge",
                "severity": "Moderate",
                "observed_value": "18°C, 82% humidity",
                "forecast_value": "Standard seasonal health adjustment."
            },
            "Shanghai": {
                "signal_type": "Coastal Humidity Anomaly",
                "severity": "Moderate",
                "observed_value": "26°C, 88% humidity",
                "forecast_value": "Metabolic & fever medicine demand surge."
            },
            "São Paulo": {
                "signal_type": "Humid Precipitation Wave",
                "severity": "High",
                "observed_value": "31°C, 82% humidity, Heavy Downpour",
                "forecast_value": "Increased dengue & viral fever footfall. Insulin & anti-pyretic demand risk."
            },
            "Rio de Janeiro": {
                "signal_type": "Tropical Heat & Humidity Wave",
                "severity": "High",
                "observed_value": "36°C, 85% humidity",
                "forecast_value": "Dehydration & gastrointestinal treatment surge."
            },
            "Minas Gerais": {
                "signal_type": "Seasonal Rainfall Shift",
                "severity": "Moderate",
                "observed_value": "24°C, 75% humidity",
                "forecast_value": "Standard seasonal health adjustment."
            },
            "Gauteng": {
                "signal_type": "Dry Season Dust Surge",
                "severity": "Moderate",
                "observed_value": "14°C, 22% humidity, Dust Storm Alert",
                "forecast_value": "Respiratory infection surge. Antibiotic & inhaler reserve buffer needed."
            },
            "Western Cape": {
                "signal_type": "Coastal Storm Front",
                "severity": "Moderate",
                "observed_value": "16°C, 78% humidity",
                "forecast_value": "Cold exposure & flu surge."
            },
            "KwaZulu-Natal": {
                "signal_type": "Subtropical Humidity Spike",
                "severity": "High",
                "observed_value": "29°C, 89% humidity",
                "forecast_value": "Rehydration & antimalarial reserve buffer needed."
            },
            "Moscow Oblast": {
                "signal_type": "Sub-Zero Cold Snap",
                "severity": "High",
                "observed_value": "-22°C Cold Wave, Heavy Snow",
                "forecast_value": "+40% surge in respiratory antibiotics & chronic care supply demand."
            },
            "Saint Petersburg": {
                "signal_type": "Baltic Cold Wind Wave",
                "severity": "Moderate",
                "observed_value": "-18°C, High Humidity",
                "forecast_value": "Cold exposure & chronic cardiovascular supply demand."
            },
            "Novosibirsk Oblast": {
                "signal_type": "Siberian Frost Warning",
                "severity": "High",
                "observed_value": "-28°C Siberian Frost",
                "forecast_value": "Emergency respiratory & antibiotic supply buffer required."
            }
        }

        profile = climate_profiles.get(region, {
            "signal_type": "Regional Weather Patterns",
            "severity": "Moderate",
            "observed_value": "Seasonal temperature & humidity shift",
            "forecast_value": "Standard seasonal health demand adjustment applied."
        })

        return {
            "region": region,
            "country": country,
            "signal_type": profile["signal_type"],
            "severity": profile["severity"],
            "observed_value": profile["observed_value"],
            "forecast_value": profile["forecast_value"],
            "source": "TRACKMEDS Regional Climate Adapter (Demo Snapshot)",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
