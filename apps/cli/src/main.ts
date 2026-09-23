import { formatKernelDemo } from "./demo.js";
import { loadRunContract } from "./load-run-contract.js";

const command = process.argv[2] ?? "demo";

if (command === "validate") {
  const contract = loadRunContract("config/run.example.yml", "config/aoi.example.geojson");
  console.log(`Run contract is valid for ${contract.aoi.crs} (${contract.units}).`);
} else if (command === "demo") {
  console.log(formatKernelDemo());
} else {
  console.error("Supported commands: demo, validate");
  process.exitCode = 1;
}
