import { loadEnvConfig } from "@next/env";

import { summarizeProductFunnel } from "../src/lib/launchlens/product-events";

loadEnvConfig(process.cwd());

const requestedDays = Number.parseInt(process.argv[2] ?? "30", 10);

summarizeProductFunnel(requestedDays)
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
    if (!summary.configured) {
      process.exitCode = 1;
    }
  })
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Product funnel query failed.",
    );
    process.exitCode = 1;
  });
