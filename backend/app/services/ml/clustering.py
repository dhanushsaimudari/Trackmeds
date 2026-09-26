import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session
from app.models.all_models import Facility, Forecast, Consumption, Inventory

class FacilityClusteringService:
    """
    Facility Demand & Vulnerability Clustering Service using KMeans.
    Categorizes PHCs into clusters:
      - Stable Demand
      - High Surge Demand
      - Volatile Demand
      - Chronic Stock Risk
    Used for analytics and regional comparison.
    """

    def __init__(self, n_clusters: int = 4):
        self.n_clusters = n_clusters
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.cluster_labels_map = {
            0: "Stable Demand",
            1: "High Surge Demand",
            2: "Volatile Demand",
            3: "Chronic Stock Risk"
        }

    def cluster_facilities(self, db: Session, country_filter: str = "All") -> List[Dict[str, Any]]:
        query = db.query(Facility)
        if country_filter != "All":
            query = query.filter(Facility.country == country_filter)
        
        facilities = query.all()
        if not facilities:
            return []

        X_list = []
        fac_metadata = []

        for f in facilities:
            # 1. Critical forecasts count for facility
            critical_count = db.query(Forecast).filter(
                Forecast.facility_id == f.id,
                Forecast.risk_level.in_(["Critical", "High"])
            ).count()

            # 2. Avg consumption & volatility
            consumptions = db.query(Consumption).filter(Consumption.facility_id == f.id).all()
            if consumptions:
                vals = [c.quantity_used for c in consumptions]
                avg_cons = float(np.mean(vals))
                std_cons = float(np.std(vals))
            else:
                avg_cons = 30.0
                std_cons = 5.0

            # 3. Capacity & bed occupancy
            capacity = f.capacity or 40
            occ_rate = (f.occupied_beds / max(1, f.total_beds)) * 100.0 if f.total_beds else 60.0

            feature_vec = [critical_count, avg_cons, std_cons, capacity, occ_rate]
            X_list.append(feature_vec)
            fac_metadata.append(f)

        X = np.array(X_list)
        if len(X) < self.n_clusters:
            # Fallback label assignment when facility count is small
            results = []
            for f in fac_metadata:
                label = "Chronic Stock Risk" if f.status == "Critical" else "Stable Demand"
                results.append({
                    "facility_id": f.id,
                    "facility_name": f.name,
                    "district": f.district,
                    "country": f.country,
                    "cluster": label,
                    "status": f.status
                })
            return results

        # Fit KMeans clustering
        labels = self.kmeans.fit_predict(X)
        results = []

        for idx, f in enumerate(fac_metadata):
            c_num = labels[idx]
            c_name = self.cluster_labels_map.get(c_num, "Stable Demand")

            results.append({
                "facility_id": f.id,
                "facility_name": f.name,
                "district": f.district,
                "country": f.country,
                "cluster": c_name,
                "cluster_id": int(c_num),
                "status": f.status,
                "metrics": {
                    "critical_forecasts": X_list[idx][0],
                    "avg_consumption": round(X_list[idx][1], 1),
                    "consumption_volatility": round(X_list[idx][2], 1),
                    "bed_occupancy_pct": round(X_list[idx][4], 1)
                }
            })

        return results


# Singleton Clustering Service
clustering_service = FacilityClusteringService()
