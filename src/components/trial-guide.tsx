"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatTrialFeedback, type TrialFeedback } from "@/lib/launchlens/trial-feedback";

const copy = {
  en: {
    title: "Try one launch decision",
    intro: "For independent builders with a prototype: turn one uncertain assumption into a next step. Allow about 15 minutes; sample data is enough for your first visit.",
    start: "Open workspace in a new tab", back: "Back to workspace",
    steps: [
      ["Start with a sample", "Choose B2B SaaS activation in the workspace. Read the brief and the Demo / Real provider label before generating. Sample and demo outputs are illustrations, not market evidence."],
      ["Test one assumption", "Choose one assumption in the validation board. Add a source you can inspect, or explicitly mark a note as a hypothesis. Decide whether it supports or challenges the assumption."],
      ["Choose a next action", "Write what you would change or investigate next. Review the evidence behind the decision; a valid citation does not prove the claim is true."],
      ["Take your work with you", "Export a local backup before leaving. If you choose cloud save, confirm it succeeded and keep your recovery information private. Return later to see whether your next action helped."],
    ],
    privacy: "Before using your own project",
    boundaries: "Use non-sensitive sample text first. Generation sends the brief to the server and, when a real provider is enabled, to that provider. Cloud save and public sharing are separate actions; review what you share. Browser storage can be cleared or unavailable, so keep an export of work you need.",
    research: "Research Studio can help prepare a brief. Its Demo output and any fallback sections are illustrative; Deep Research remains subject to the availability shown there.",
    researchLink: "Open Research Studio",
    feedback: "What happened in your trial?",
    feedbackNote: "These notes stay in this tab until you download them. They are not automatically submitted or saved across reloads. Do not include credentials, recovery keys, customer details or confidential plans.",
    labels: {goal: "What were you trying to decide?", outcome: "What could you actually complete?", blocker: "Where did you get stuck, or what was missing?", reuse: "Would you use it for your next decision? Why?"},
    mode: "Which mode did you see?", unknown: "Not sure", demo: "Demo / sample", real: "Real provider", mixed: "Mixed / fallback",
    preview: "Review feedback", download: "Download feedback (.txt)", previewLabel: "Feedback preview",
    ready: "Review the text below, then download it and send it to the person who invited you. Nothing has been sent automatically.",
    failed: "The download could not start. Copy the feedback from the preview below.",
    issues: "Report a public bug on GitHub", issueNote: "GitHub issues are public. Share only a redacted reproduction; use your inviter’s channel for private feedback.",
  },
  "zh-CN": {
    title: "试着完成一次发布决策",
    intro: "适合已有原型的独立开发者：把一个不确定的假设变成下一步行动。预留约 15 分钟；第一次可以只用示例数据。",
    start: "在新标签页打开工作区", back: "返回工作区",
    steps: [
      ["从示例开始", "在工作区选择 B2B SaaS activation 示例。先阅读需求简述和 Demo / Real provider 标识。示例与演示输出只用于体验流程，不能作为市场证据。"],
      ["检查一个假设", "在验证板选择一个假设，补充一个可以查看的来源，或明确标为待验证的设想。判断它支持还是挑战该假设。"],
      ["确定下一步", "写下接下来会修改或调查什么，检查决策背后的证据。引用格式有效，并不代表结论真实。"],
      ["带走你的工作", "离开前导出本地备份。如果选择云端保存，确认保存成功，并私下保管恢复信息。之后回来看看这次行动是否有帮助。"],
    ],
    privacy: "使用自己的项目前",
    boundaries: "先用不敏感的示例文字。生成时，简述会发送到服务器；启用真实模型时，还会发送给对应服务商。云端保存与公开分享是单独的操作，分享前请检查内容。浏览器存储可能被清除或不可用，需要保留的工作请导出备份。",
    research: "Research Studio 可以辅助整理研究简述。Demo 和降级部分是演示内容；Deep Research 能否使用，以研究工作区显示的状态为准。",
    researchLink: "打开 Research Studio",
    feedback: "这次试用发生了什么？",
    feedbackNote: "这些笔记仅保留在当前标签页，下载前不会自动提交，也不会在刷新后恢复。请勿填写凭据、恢复密钥、客户信息或保密计划。",
    labels: {goal: "你原本想做什么决策？", outcome: "实际完成了什么？", blocker: "在哪里卡住，或者缺少什么？", reuse: "下次做决策还会使用吗？为什么？"},
    mode: "你看到的运行模式", unknown: "不确定", demo: "Demo / 示例", real: "真实模型", mixed: "混合 / 降级",
    preview: "检查反馈内容", download: "下载反馈（.txt）", previewLabel: "反馈预览",
    ready: "检查下方文字后下载，再通过邀请人的联系方式分享。系统尚未自动发送任何反馈。",
    failed: "未能开始下载，请复制下方预览中的反馈文字。",
    issues: "在 GitHub 报告公开问题", issueNote: "GitHub issue 是公开的。只提交脱敏的复现步骤；私人反馈请使用邀请人的联系方式。",
  },
};

export function TrialGuide() {
  const { locale, setLocale } = useLocale();
  const text = copy[locale];
  const [feedback, setFeedback] = useState<TrialFeedback>({goal: "", outcome: "", blocker: "", reuse: "", mode: "Not sure / 不确定"});
  const [prepared, setPrepared] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const preview = formatTrialFeedback(feedback);
  function review(event: FormEvent) {
    event.preventDefault();
    setPrepared(true);
    setDownloadFailed(false);
  }
  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([preview], {type: "text/plain;charset=utf-8"}));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "launchlens-trial-feedback.txt";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setDownloadFailed(true);
    } finally {
      if (url) { const savedUrl = url; window.setTimeout(() => URL.revokeObjectURL(savedUrl), 1000); }
    }
  }
  const button = "inline-flex items-center justify-center rounded-md border border-input px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-8 text-foreground sm:py-14">
      <nav className="mb-10 flex items-center justify-between gap-4" aria-label={locale === "en" ? "Trial navigation" : "试用导航"}>
        <Link href="/" className="text-sm underline underline-offset-4">{text.back}</Link>
        <button type="button" className={button} onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}>{locale === "en" ? "中文" : "English"}</button>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{text.intro}</p>
      <a href="/" target="_blank" rel="noopener noreferrer" className={`${button} mt-6 bg-primary text-primary-text`}>{text.start}</a>
      <ol className="my-10 space-y-7">
        {text.steps.map(([title, body], index) => <li key={index} className="flex gap-4">
          <span className="text-xl font-semibold text-accent" aria-hidden="true">{index + 1}.</span>
          <div><h2 className="font-semibold">{title}</h2><p className="mt-1 leading-7 text-muted">{body}</p></div>
        </li>)}
      </ol>
      <aside className="border-y border-card py-6">
        <h2 className="font-semibold">{text.privacy}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{text.boundaries}</p>
        <p className="mt-3 text-sm leading-6 text-muted">{text.research}</p>
        <a href="https://launchlens-research-studio.vercel.app/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline underline-offset-4">{text.researchLink}</a>
      </aside>
      <section className="mt-10" aria-labelledby="trial-feedback-title">
        <h2 id="trial-feedback-title" className="text-2xl font-semibold">{text.feedback}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{text.feedbackNote}</p>
        <form onSubmit={review} className="mt-6 space-y-5">
          {(Object.entries(text.labels) as [keyof typeof text.labels, string][]).map(([key, label]) => <label key={key} className="block">
            <span className="mb-2 block text-sm font-medium">{label}</span>
            <textarea required={key === "goal" || key === "outcome"} maxLength={2000} rows={3} value={feedback[key]} onChange={event => {setFeedback({...feedback, [key]: event.target.value}); setPrepared(false);}} className="w-full rounded-md border border-input bg-input p-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-accent" />
          </label>)}
          <label className="block text-sm font-medium">{text.mode}
            <select value={feedback.mode} onChange={event => {setFeedback({...feedback, mode: event.target.value}); setPrepared(false);}} className="mt-2 block w-full rounded-md border border-input bg-input p-3">
              <option value="Not sure / 不确定">{text.unknown}</option><option value="Demo / sample">{text.demo}</option><option value="Real provider">{text.real}</option><option value="Mixed / fallback">{text.mixed}</option>
            </select>
          </label>
          <button className={`${button} bg-primary text-primary-text`} type="submit">{text.preview}</button>
        </form>
        {prepared && <div className="mt-6 space-y-4">
          <p role="status" className="text-sm leading-6">{downloadFailed ? text.failed : text.ready}</p>
          <label className="block text-sm font-medium">{text.previewLabel}<textarea aria-label={text.previewLabel} readOnly rows={14} value={preview} className="mt-2 block w-full rounded-md border border-input bg-input p-3 font-mono text-xs leading-5" /></label>
          <button type="button" className={button} onClick={download}>{text.download}</button>
        </div>}
        <p className="mt-8 text-sm leading-6 text-muted">{text.issueNote}</p>
        <a href="https://github.com/Zhi-Chao-PAN/launchlens-ai/issues/new?template=trial-feedback.yml" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline underline-offset-4">{text.issues}</a>
      </section>
    </main>
  );
}
