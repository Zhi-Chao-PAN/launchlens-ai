import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("a visitor can review and download feedback without submitting it", async ({page}) => {
  const submitted: string[] = [];
  page.on("request", request => { if ((request.postData() ?? "").includes("trial-private-marker")) submitted.push(request.url()); });
  await page.goto("/trial");
  await expect(page.getByRole("heading", {name: "Try one launch decision"})).toBeVisible();
  await expect(page.getByRole("link", {name: "Open workspace in a new tab"})).toHaveAttribute("target", "_blank");
  await page.getByLabel("What were you trying to decide?").fill("trial-private-marker: decide the next release");
  await page.getByLabel("What could you actually complete?").fill("I could record one source and an action.");
  await page.getByRole("button", {name: "Review feedback", exact: true}).click();
  await expect(page.getByRole("textbox", {name: "Feedback preview", exact: true})).toHaveValue(/trial-private-marker/);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", {name: "Download feedback (.txt)", exact: true}).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("launchlens-trial-feedback.txt");
  const file = await download.path();
  expect(file).not.toBeNull();
  const contents = await readFile(file!, "utf8");
  expect(contents).toContain("trial-private-marker");
  expect(contents).toContain("not been submitted");
  expect(submitted).toEqual([]);
  await page.getByLabel("What could you actually complete?").fill("Changed my feedback");
  await expect(page.getByRole("button", {name: "Download feedback (.txt)", exact: true})).toHaveCount(0);
});

test("mobile trial guide supports Chinese and a readable feedback form", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/trial");
  await page.getByRole("button", {name: "中文", exact: true}).click();
  await expect(page.getByRole("heading", {name: "试着完成一次发布决策"})).toBeVisible();
  await page.getByLabel("你原本想做什么决策？").fill("确定下一步");
  await page.getByLabel("实际完成了什么？").fill("记录证据");
  await page.getByRole("button", {name: "检查反馈内容"}).click();
  await expect(page.getByRole("textbox", {name: "反馈预览", exact: true})).toHaveValue(/记录证据/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("denied browser storage does not break the guide or first-visit tour", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {get() { throw new DOMException("Storage disabled", "SecurityError"); }});
  });
  await page.goto("/trial");
  await page.getByRole("button", {name: "中文", exact: true}).click();
  await expect(page.getByRole("heading", {name: "试着完成一次发布决策"})).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("dialog", {name: /quick start guide/i})).toBeVisible();
  await page.getByRole("button", {name: /get started/i}).click();
  await expect(page.getByRole("dialog", {name: /quick start guide/i})).toBeHidden();
  await expect(page.getByRole("heading", {name: /go-to-market workspace/i})).toBeVisible();
  expect(errors).toEqual([]);
});
