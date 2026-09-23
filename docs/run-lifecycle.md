# Bounded run lifecycle

`pnpm change-run` writes `outputs/fixture-run/run.json` atomically (`run.json.tmp` then rename). Incomplete or cancelled runs keep `status: incomplete` so they cannot be treated as new evidence.

Cache keys include the run contract, software version and source-file hashes. A completed record is reused only when a fresh digest of those files still matches the stored hashes. Changing the threshold, scene pair or raster bytes computes a new key.

Cleanup: delete `outputs/fixture-run/` to discard a local run. The directory budget is 10 MB. The worker timeout is 30 seconds. Do not commit generated outputs.
