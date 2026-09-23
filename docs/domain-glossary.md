# Domain vocabulary

| Term | Meaning | Relationships / invariants | Avoid confusing with |
| --- | --- | --- | --- |
| Run contract | Frozen question, AOI, observation windows, success condition, limitations, license, units and output manifest schema. | Must be valid before scene selection. | A completed run report |
| Area of interest | Bounded polygon or derived bounding box in a supported CRS. | CRS must be EPSG:4326. Area must stay at or below 25 km². West < east and south < north. | A scene footprint |
| Observation window | Inclusive UTC calendar dates for one side of the pair. | Before must end before after starts. Dates are `YYYY-MM-DD`. | Acquisition timestamp of a scene |
| Candidate change | Pixels whose masked spectral difference exceeds a predeclared threshold. | Never a claim about cause. | Land-cover class or land-use change |

## Unresolved distinctions

None for the current contract slice.
