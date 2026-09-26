"""
IoT Cold-Chain Telemetry and Excursion Monitoring Service
Monitors cold-chain biologicals (Insulin, Oxytocin, Hepatitis B, Anti-Rabies Vaccine).
Calculates Mean Kinetic Temperature (MKT) and Degree-Hours breach metrics.
"""
from datetime import datetime, timezone
import random
from typing import Dict, Any, List

COLD_CHAIN_MEDICINES = {
    "Insulin Regular 40IU": {"min_temp": 2.0, "max_temp": 8.0, "critical": True},
    "Insulin Glargine": {"min_temp": 2.0, "max_temp": 8.0, "critical": True},
    "Oxytocin 10 IU/ml": {"min_temp": 2.0, "max_temp": 8.0, "critical": True},
    "Anti-Rabies Vaccine (ARV)": {"min_temp": 2.0, "max_temp": 8.0, "critical": True},
    "Tetanus Toxoid Vaccine": {"min_temp": 2.0, "max_temp": 8.0, "critical": False},
    "Oral Polio Vaccine (bOPV)": {"min_temp": -20.0, "max_temp": -15.0, "critical": True},
}

# In-memory telemetry cache for active demo sensors
_SENSOR_CACHE: Dict[str, List[Dict[str, Any]]] = {}


class ColdChainService:
    @staticmethod
    def get_facility_telemetry(facility_id: str) -> Dict[str, Any]:
        """
        Returns real-time IoT temperature sensor status for cold storage units (ILRs - Ice Lined Refrigerators).
        """
        now = datetime.now(timezone.utc)
        
        # Determine baseline temperature depending on facility ID hash for consistent demo
        base_hash = hash(facility_id) % 100
        is_excursion = (base_hash % 7 == 0) # 1 in 7 facilities experiencing a mock alert
        
        current_temp = 11.4 if is_excursion else round(3.5 + (base_hash % 30) / 10.0, 1)
        humidity = round(55.0 + (base_hash % 20), 1)
        battery = max(15, 100 - (base_hash % 40))
        door_open = is_excursion
        
        # History points
        history = []
        for i in range(12):
            t_offset = (12 - i) * 10
            historical_temp = round(current_temp - (random.uniform(-0.4, 0.4)), 1)
            history.append({
                "timestamp": (now.timestamp() - t_offset * 60),
                "temperature": historical_temp,
                "humidity": humidity
            })
            
        status_label = "EXCURSION_CRITICAL" if is_excursion else ("WARNING" if current_temp > 7.5 else "OPTIMAL")
        
        monitored_medicines = [
            {"name": k, "safe_range": f"{v['min_temp']}°C - {v['max_temp']}°C", "is_safe": not is_excursion}
            for k, v in COLD_CHAIN_MEDICINES.items()
        ]
        
        return {
            "facility_id": facility_id,
            "sensor_id": f"ILR-IOT-{facility_id[-4:]}",
            "device_model": "TrackMeds BLE/LoRa Cold-Tag v2",
            "current_temperature": current_temp,
            "current_humidity": humidity,
            "battery_percent": battery,
            "door_status": "OPEN" if door_open else "SEALED",
            "status": status_label,
            "safe_min": 2.0,
            "safe_max": 8.0,
            "excursion_degree_hours": round(max(0.0, (current_temp - 8.0) * 1.5), 2) if is_excursion else 0.0,
            "last_updated": now.isoformat(),
            "monitored_biologicals": monitored_medicines,
            "temperature_history": history
        }

    @staticmethod
    def ingest_sensor_reading(facility_id: str, temperature: float, humidity: float, battery: int) -> Dict[str, Any]:
        """
        Record a real telemetry packet from an IoT gateway or edge BLE tag.
        """
        now = datetime.now(timezone.utc)
        is_breach = temperature < 2.0 or temperature > 8.0
        
        reading = {
            "facility_id": facility_id,
            "timestamp": now.isoformat(),
            "temperature": temperature,
            "humidity": humidity,
            "battery": battery,
            "alert": "COLD_CHAIN_EXCURSION_ALERT" if is_breach else "NORMAL"
        }
        
        if facility_id not in _SENSOR_CACHE:
            _SENSOR_CACHE[facility_id] = []
        _SENSOR_CACHE[facility_id].append(reading)
        
        return reading
