import { loadEnvConfig } from "@next/env";

import {
  summarizeProductFunnel,
  summarizeProductStage2Funnel,
} from "../src/lib/launchlens/product-events";

loadEnvConfig(process.cwd());

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const requestedDays = Number.parseInt(
  argValue("--days") ?? process.argv.find((arg) => /^\d+$/.test(arg)) ?? "30",
  10,
);
const stage2Participant = argValue("--participant") ?? argValue("--stage2Participant");
const stage2Batch = argValue("--batch") ?? argValue("--stage2Batch");
const summaryPromise =
  stage2Participant || stage2Batch
    ? summarizeProductStage2Funnel(
        { stage2Participant, stage2Batch },
        requestedDays,
      )
    : summarizeProductFunnel(requestedDays);

summaryPromise
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
