"""
Calibration Service - Ridge regression for component weights
"""

from typing import Dict, Optional, List, Tuple
import numpy as np
import json
from pathlib import Path

try:
    from sklearn.linear_model import Ridge
    from sklearn.metrics import r2_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from app.models.types import CalibrationMetadata


class CalibrationService:
    """Service for calibrating risk component weights using Ridge regression"""
    
    # Default weights (used if calibration unavailable)
    DEFAULT_WEIGHTS = {
        "SupplyChain": 0.35,
        "GeoExposure": 0.30,
        "MeasureMatch": 0.20,
        "SentimentRisk": 0.15
    }
    
    # Path to calibration data
    CALIBRATION_DIR = Path(__file__).parent.parent / "data" / "calibration"
    CALIBRATION_FILE = CALIBRATION_DIR / "weights.json"
    
    @staticmethod
    def calibrate_weights(
        labeled_examples: List[Dict],
        alpha: float = 1.0
    ) -> CalibrationMetadata:
        """
        Calibrate component weights using Ridge regression
        
        Args:
            labeled_examples: List of dicts with:
                - components: List[float] = [supply_chain, geo_exposure, measure_match, sentiment_risk]
                - total_score: float (ground truth)
            alpha: Ridge regularization parameter
            
        Returns:
            CalibrationMetadata with calibrated weights and statistics
        """
        if not SKLEARN_AVAILABLE:
            return CalibrationMetadata(
                calibrated_weights=CalibrationService.DEFAULT_WEIGHTS,
                r_squared=0.0,
                n_samples=0,
                confidence="low"
            )
        
        if len(labeled_examples) < 3:
            return CalibrationMetadata(
                calibrated_weights=CalibrationService.DEFAULT_WEIGHTS,
                r_squared=0.0,
                n_samples=len(labeled_examples),
                confidence="low"
            )
        
        # Extract features (components) and target (total_score)
        X = []
        y = []
        
        for example in labeled_examples:
            components = example.get("components", [])
            total_score = example.get("total_score", 0.0)
            
            if len(components) == 4 and total_score is not None:
                X.append(components)
                y.append(total_score)
        
        if len(X) < 3:
            return CalibrationMetadata(
                calibrated_weights=CalibrationService.DEFAULT_WEIGHTS,
                r_squared=0.0,
                n_samples=len(X),
                confidence="low"
            )
        
        X = np.array(X)
        y = np.array(y)
        
        # Fit Ridge regression
        model = Ridge(alpha=alpha)
        model.fit(X, y)
        
        # Predict and calculate R²
        y_pred = model.predict(X)
        r2 = r2_score(y, y_pred)
        
        # Extract weights
        weights = model.coef_.tolist()
        calibrated_weights = {
            "SupplyChain": float(weights[0]),
            "GeoExposure": float(weights[1]),
            "MeasureMatch": float(weights[2]),
            "SentimentRisk": float(weights[3])
        }
        
        # Normalize weights to sum to 1.0 (optional, but good practice)
        total_weight = sum(calibrated_weights.values())
        if total_weight > 0:
            calibrated_weights = {
                k: v / total_weight for k, v in calibrated_weights.items()
            }
        
        # Determine confidence level
        n_samples = len(X)
        if n_samples >= 20 and r2 >= 0.7:
            confidence = "high"
        elif n_samples >= 10 and r2 >= 0.5:
            confidence = "medium"
        else:
            confidence = "low"
        
        # Save calibration
        CalibrationService._save_calibration(calibrated_weights, r2, n_samples)
        
        return CalibrationMetadata(
            calibrated_weights=calibrated_weights,
            r_squared=float(r2),
            n_samples=n_samples,
            confidence=confidence
        )
    
    @staticmethod
    def get_calibrated_weights() -> CalibrationMetadata:
        """
        Get current calibration weights (load from file or return defaults)
        """
        if CalibrationService.CALIBRATION_FILE.exists():
            try:
                with open(CalibrationService.CALIBRATION_FILE, 'r') as f:
                    data = json.load(f)
                    return CalibrationMetadata(**data)
            except Exception:
                pass
        
        # Return defaults
        return CalibrationMetadata(
            calibrated_weights=CalibrationService.DEFAULT_WEIGHTS,
            r_squared=0.0,
            n_samples=0,
            confidence="low"
        )
    
    @staticmethod
    def calculate_total_score(
        components: List[float],
        calibration: Optional[CalibrationMetadata] = None
    ) -> Tuple[float, CalibrationMetadata]:
        """
        Calculate total risk score from components using calibrated weights
        
        Args:
            components: [supply_chain, geo_exposure, measure_match, sentiment_risk]
            calibration: Optional calibration metadata (loads default if None)
            
        Returns:
            (total_score, calibration_metadata)
        """
        if calibration is None:
            calibration = CalibrationService.get_calibrated_weights()
        
        if len(components) != 4:
            raise ValueError("Components must have 4 values")
        
        weights = calibration.calibrated_weights
        
        total_score = (
            components[0] * weights["SupplyChain"] +
            components[1] * weights["GeoExposure"] +
            components[2] * weights["MeasureMatch"] +
            components[3] * weights["SentimentRisk"]
        )
        
        # Clamp to 0-100 range
        total_score = max(0.0, min(100.0, total_score))
        
        return float(total_score), calibration
    
    @staticmethod
    def _save_calibration(weights: Dict[str, float], r2: float, n_samples: int):
        """
        Save calibration to file
        """
        CalibrationService.CALIBRATION_DIR.mkdir(parents=True, exist_ok=True)
        
        calibration_data = {
            "calibrated_weights": weights,
            "r_squared": r2,
            "n_samples": n_samples,
            "confidence": "high" if n_samples >= 20 and r2 >= 0.7 else (
                "medium" if n_samples >= 10 and r2 >= 0.5 else "low"
            )
        }
        
        with open(CalibrationService.CALIBRATION_FILE, 'w') as f:
            json.dump(calibration_data, f, indent=2)

