# Bounded run lifecycle

`pnpm change-run` writes `outputs/fixture-run/run.json` atomically (`run.json.tmp` then rename). Incomplete or cancelled runs keep `status: incomplete` so they cannot be treated as new evidence.

Cache keys include the run contract, software version and source-file hashes. A completed record is reused only when a fresh digest of those files still matches the stored hashes. Changing the threshold, scene pair or raster bytes computes a new key. There is no stage-level resume: a cancelled or failed run starts again from validation.

`run.json` records the effective contract, processing levels, software version, source hashes, the review (candidate flags, gain and loss counts, limitations) and a coverage verdict. Below 0.2 valid-pixel coverage the verdict is `insufficient`: the CLI prints it, the report says not to interpret the candidates and the viewer refuses to show them.

Cleanup: delete `outputs/fixture-run/` to discard a local run. The directory budget is 10 MB. The worker timeout is 30 seconds. Do not commit generated outputs.
