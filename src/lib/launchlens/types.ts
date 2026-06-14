export type ProviderName = "mock" | "openai" | "minimax";

export type LaunchLensInput = {
  idea: string;
  audience: string;
  market: string;
  tone: string;
  constraints: string;
};

export type BacklogItem = {
  feature: string;
  why: string;
  priority: "P0" | "P1" | "P2";
};

export type LaunchTask = {
  title: string;
  owner: string;
  due: string;
  outcome: string;
};

export type ContentItem = {
  channel: string;
  angle: string;
  cadence: string;
};

export type LaunchLensWorkspace = {
  provider: ProviderName;
  generatedAt: string;
  summary: string;
  targetUsers: string[];
  pains: string[];
  mvpScope: string[];
  backlog: BacklogItem[];
  landingPage: {
    headline: string;
    subheadline: string;
    cta: string;
    proofBullets: string[];
  };
  pricing: {
    hypothesis: string;
    tiers: string[];
    risks: string[];
  };
  launchPlan: string[];
  contentCalendar: ContentItem[];
  tasks: LaunchTask[];
  assumptions: string[];
};

export type GenerationResult = {
  workspace: LaunchLensWorkspace;
  mode: "demo" | "real";
  usedFallback: boolean;
  fallbackReason?: string;
};

export type ApiError = {
  code?: string;
  error: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: ApiError;
  status: number;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
