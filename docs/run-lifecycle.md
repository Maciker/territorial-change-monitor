# Bounded run lifecycle

`pnpm run` writes `outputs/fixture-run/run.json` atomically (`run.json.tmp` then rename). Incomplete or cancelled runs keep `status: incomplete` so they cannot be treated as new evidence.

Cache keys include the run contract, software version and source hashes. Changing the threshold or scene pair computes a new key.

Cleanup: delete `outputs/fixture-run/` to discard a local run. The directory budget is 10 MB. The worker timeout is 30 seconds. Do not commit generated outputs.
