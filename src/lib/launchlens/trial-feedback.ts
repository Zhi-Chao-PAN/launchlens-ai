export type TrialFeedback = {
  goal: string;
  outcome: string;
  blocker: string;
  reuse: string;
  mode: string;
};

/** Only explicit form fields enter the export: no workspace, tokens or diagnostics. */
export function formatTrialFeedback(feedback: TrialFeedback): string {
  const fields: [string, string][] = [
    ["Task / 任务", feedback.goal],
    ["Outcome / 实际结果", feedback.outcome],
    ["Blocker / 卡点", feedback.blocker],
    ["Use again / 是否再用", feedback.reuse],
    ["Mode observed / 看到的运行模式", feedback.mode],
  ];
  return [
    "LaunchLens trial feedback / 试用反馈 (v1)",
    "Review before sharing. This file has not been submitted anywhere.",
    "分享前请检查内容。本文件尚未提交给任何人。",
    ...fields.map(([label, value]) => `${label}\n${value.trim() || "Not provided / 未填写"}`),
  ].join("\n\n") + "\n";
}
