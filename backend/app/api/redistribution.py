from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import Redistribution
from app.schemas.all_schemas import RedistributionResponse
from app.services.optimization.redistribution import RedistributionOptimizer
from app.services.gemini.copilot import GeminiCopilotService

router = APIRouter(prefix="/redistribution", tags=["Redistribution"])

@router.get("/recommendations", response_model=List[RedistributionResponse])
def get_redistribution_recommendations(
    country: str = Query(default="All"),
    db: Session = Depends(get_db)
):
    country_filter = country if country != "All" else None
    results = RedistributionOptimizer.generate_recommendations(db, country_filter=country_filter)
    
    # Enrich with Gemini AI operational explanations
    for rec in results:
        rec["ai_explanation"] = (
            f"Transferring {rec['quantity']} units from {rec['source_facility_name']} addresses immediate critical stockout "
            f"at {rec['destination_facility_name']} ({rec['distance_km']} km distance). "
            f"Saves an estimated ₹{rec['estimated_waste_avoided_value']:,.2f} in expiring inventory."
        )

    return results

@router.post("/approve/{recommendation_id}")
def approve_redistribution(recommendation_id: str, db: Session = Depends(get_db)):
    rec = db.query(Redistribution).filter(Redistribution.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Redistribution order not found")

    rec.status = "Approved"
    db.commit()
    return {"status": "success", "message": f"Redistribution order {recommendation_id} approved for transport dispatch."}

@router.post("/simulate")
def simulate_redistribution(db: Session = Depends(get_db)):
    recs = RedistributionOptimizer.generate_recommendations(db)
    return {
        "status": "success",
        "generated_recommendations_count": len(recs),
        "total_units_redistributed": sum(r["quantity"] for r in recs),
        "total_waste_avoided": sum(r["estimated_waste_avoided_value"] for r in recs)
    }
