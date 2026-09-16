"""Small, testable spectral-index helpers."""

import numpy as np


def normalized_difference(numerator: np.ndarray, denominator: np.ndarray) -> np.ndarray:
    """Return a masked normalized difference without dividing by zero."""
    total = numerator.astype("float32") + denominator.astype("float32")
    result = np.full(total.shape, np.nan, dtype="float32")
    np.divide(
        numerator.astype("float32") - denominator.astype("float32"),
        total,
        out=result,
        where=total != 0,
    )
    return result
