from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.services.ml.federated_learning import FederatedLearningEngine
from app.core.security import get_current_user, enforce_role, User

router = APIRouter(prefix="/federated", tags=["Federated Learning"])

@router.get("/status")
def get_federated_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns live telemetry on distributed state nodes, global model weights,
    training convergence history, and privacy budgets.
    """
    return FederatedLearningEngine.get_federated_status(db)

@router.post("/train-round")
def trigger_federated_round(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Triggers an active Federated Averaging (FedAvg) aggregation round:
    - Restricted strictly to National Health Directors / Administrators.
    - Trains local models on decentralized state partitions.
    - Aggregates weights into an updated global predictive model.
    - Broadcasts updated parameters back to states.
    """
    enforce_role(current_user, ["NATIONAL_ADMIN"])
    return FederatedLearningEngine.execute_training_round(db)
