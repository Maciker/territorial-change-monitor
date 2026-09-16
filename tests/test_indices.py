import numpy as np

from territorial_change_monitor.indices import normalized_difference


def test_normalized_difference_masks_zero_total() -> None:
    result = normalized_difference(np.array([3, 0]), np.array([1, 0]))

    assert result[0] == 0.5
    assert np.isnan(result[1])
