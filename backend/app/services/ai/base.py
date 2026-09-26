from abc import ABC, abstractmethod
from typing import Dict, Any

class MLService(ABC):
    @abstractmethod
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

class GeminiService(ABC):
    @abstractmethod
    def explain_risk(self, context: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def ask(self, question: str, context: Dict[str, Any]) -> str:
        pass

class VertexAIService(ABC):
    @abstractmethod
    def generate_briefing(self, structured_context: Dict[str, Any]) -> str:
        pass
