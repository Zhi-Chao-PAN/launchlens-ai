import type { Metadata } from "next";
import { TrialGuide } from "@/components/trial-guide";

export const metadata: Metadata = {
  title: "Try one launch decision | LaunchLens",
  description: "A short guided trial with sample data, clear privacy boundaries and feedback you control.",
};

export default function TrialPage() {
  return <TrialGuide />;
}
