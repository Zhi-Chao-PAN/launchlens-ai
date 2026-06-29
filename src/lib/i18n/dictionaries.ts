// Locale dictionaries for LaunchLens AI. Keep keys flat and stable so future
// translation passes can diff against this canonical English source.
//
// Coverage priority: header/nav, brief form, generate button + loading,
// strategy snapshot, section titles, import dialogs, and the most common
// toasts. Deep edit-mode field placeholders and rare toasts are translated
// too where they share a key family; anything missing falls back to English
// via the translate() fallback path.

export type Locale = "en" | "zh-CN";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "zh-CN"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  "en": "English",
  "zh-CN": "中文",
};

export type DictionaryKey =
  // Language switcher
  | "language.label"
  // Header / nav / branding
  | "header.brand"
  | "header.title"
  | "header.badge"
  | "header.navAria"
  | "nav.brief"
  | "nav.history"
  | "nav.evidence"
  | "nav.decisions"
  | "nav.account"
  | "nav.readiness"
  | "header.resetTitle"
  // Operating-status metrics
  | "metrics.sectionAria"
  | "metrics.quality"
  | "metrics.qualityDetail"
  | "metrics.validation"
  | "metrics.validationDetail"
  | "metrics.execution"
  | "metrics.executionDetail"
  | "metrics.backlog"
  | "metrics.backlogDetail"
  | "metrics.aiMode"
  // Founder brief aside
  | "brief.asideAria"
  | "brief.inputLabel"
  | "brief.builderTitle"
  | "brief.hide"
  | "brief.edit"
  | "brief.examplesLabel"
  | "brief.examplesAria"
  // Brief form fields
  | "field.idea.label"
  | "field.idea.placeholder"
  | "field.idea.hint"
  | "field.idea.recommended"
  | "field.idea.tooLong"
  | "field.charsSuffix"
  | "field.audience.label"
  | "field.audience.recommended"
  | "field.audience.tooLong"
  | "field.market.label"
  | "field.market.recommended"
  | "field.market.tooLong"
  | "field.voice.label"
  | "field.constraints.label"
  | "field.constraints.recommended"
  | "field.constraints.tooLong"
  | "field.pleaseShorten"
  | "voice.practical"
  | "voice.analytical"
  | "voice.warm"
  | "voice.technical"
  // Generate button / loading
  | "generate.blockedTooShort"
  | "generate.blockedAlready"
  | "generate.blockedOwnerToken"
  | "generate.button"
  | "generate.generating"
  | "generate.srReason"
  | "generate.cancel"
  | "generate.loadingHeading"
  | "generate.errorRetry"
  | "generate.step.brief"
  | "generate.step.structure"
  | "generate.step.tasks"
  // Account / cloud section
  | "account.label"
  | "account.title"
  // Strategy snapshot section
  | "snapshot.label"
  | "snapshot.title"
  | "snapshot.generatedPrefix"
  | "snapshot.fallbackPrefix"
  | "sourceBrief.heading"
  | "sourceBrief.session"
  | "sourceBrief.opportunity"
  | "sourceBrief.risk"
  | "sourceBrief.viewReport"
  | "sourceBrief.linkPending"
  // Toolbar buttons
  | "toolbar.preview"
  | "toolbar.edit"
  | "toolbar.copyMarkdownAria"
  | "toolbar.copiedMarkdownAria"
  | "toolbar.markdown"
  | "toolbar.copied"
  | "toolbar.copyJsonAria"
  | "toolbar.copiedJsonAria"
  | "toolbar.json"
  | "toolbar.downloadMdTitle"
  | "toolbar.downloadJsonTitle"
  | "toolbar.importJsonTitle"
  | "toolbar.import"
  | "toolbar.importBriefTitle"
  | "toolbar.researchStudio"
  | "toolbar.pasteBrief"
  | "toolbar.pasteBriefTitle"
  | "toolbar.passwordProtect"
  | "toolbar.passphrasePlaceholder"
  | "toolbar.passphraseAria"
  | "toolbar.regenerate"
  // Generated positioning / Launch CTA
  | "positioning.label"
  | "positioning.headline"
  | "positioning.summary"
  | "launchCta.label"
  | "launchCta.title"
  | "launchCta.nextAction"
  // Export panel
  | "export.heading"
  | "export.badgeJson"
  | "export.badgeMarkdown"
  | "export.dismissAria"
  | "export.textareaAria"
  | "export.copySelection"
  | "export.downloadFile"
  // Validation board section
  | "validation.sectionAria"
  | "validation.label"
  | "validation.title"
  | "validation.counter"
  // Decision copilot section
  | "decision.label"
  | "decision.title"
  | "decision.hint"
  | "decision.copilotLabel"
  | "validation.boardLabel"
  // Section titles
  | "section.targetUsers"
  | "section.painMap"
  | "section.mvpScope"
  | "section.landingCopy"
  | "section.featureBacklog"
  | "section.pricingHypothesis"
  | "section.launchPlan"
  | "section.assumptions"
  | "section.pricingRisks"
  | "section.contentCalendar"
  | "section.executionTasks"
  | "section.landingSubheadline"
  | "section.landingProofBullets"
  | "section.pricingTiers"
  | "section.assumptionsEditNote"
  | "section.assumptionsViewNote"
  | "section.executionCount"
  // Edit-mode fields (backlog / content / execution)
  | "edit.featurePlaceholder"
  | "edit.priority.p0"
  | "edit.priority.p1"
  | "edit.priority.p2"
  | "edit.removeBacklogAria"
  | "edit.whyMattersPlaceholder"
  | "edit.addBacklog"
  | "edit.channelPlaceholder"
  | "edit.cadencePlaceholder"
  | "edit.removeContentAria"
  | "edit.contentAnglePlaceholder"
  | "edit.addContent"
  | "edit.markIncomplete"
  | "edit.markComplete"
  | "edit.taskTitlePlaceholder"
  | "edit.removeTaskAria"
  | "edit.ownerPlaceholder"
  | "edit.duePlaceholder"
  | "edit.outcomePlaceholder"
  | "edit.addTask"
  | "edit.taskDesc"
  // Import workspace dialog
  | "importDialog.cancelAria"
  | "importDialog.title"
  | "importDialog.body"
  | "importDialog.summary"
  | "importDialog.includesValidation"
  | "importDialog.warningOne"
  | "importDialog.warningMany"
  | "importDialog.cancel"
  | "importDialog.import"
  // Brief import dialog
  | "briefDialog.cancelAria"
  | "briefDialog.titleResearchStudio"
  | "briefDialog.titleFile"
  | "briefDialog.body"
  | "briefDialog.idea"
  | "briefDialog.audience"
  | "briefDialog.market"
  | "briefDialog.tone"
  | "briefDialog.constraints"
  | "briefDialog.empty"
  | "briefDialog.warningOne"
  | "briefDialog.warningMany"
  | "briefDialog.cancel"
  | "briefDialog.load"
  | "briefDialog.pasteTitle"
  | "briefDialog.pasteBody"
  | "briefDialog.pastePlaceholder"
  | "briefDialog.pasteLoad"
  | "briefDialog.pasteEmpty"
  | "briefDialog.pasteParsed"
  | "briefDialog.pasteError"
  // Encrypted import dialog
  | "encrypt.title"
  | "encrypt.body"
  | "encrypt.passphraseLabel"
  | "encrypt.passphrasePlaceholder"
  | "encrypt.hideAria"
  | "encrypt.showAria"
  | "encrypt.hide"
  | "encrypt.show"
  | "encrypt.cancel"
  | "encrypt.decrypting"
  | "encrypt.decrypt"
  | "encrypt.submitHint"
  // Toasts
  | "toast.briefLoadedWarn"
  | "toast.briefLoaded"
  | "toast.briefFromHash"
  | "toast.briefLinkError"
  | "workspace.outdated.title"
  | "workspace.outdated.body"
  | "workspace.outdated.generate"
  | "workspace.outdated.discard"
  | "toast.saveHint"
  | "toast.restored"
  | "toast.storageUnavailable"
  | "toast.exampleLoaded"
  | "toast.reset"
  | "toast.cloudRestored"
  | "toast.demoFallback"
  | "toast.copiedLabel"
  | "toast.copiedLabelNoPass"
  | "toast.clipboardFallbackLabel"
  | "toast.clipboardFallbackGeneric"
  | "toast.exportedExt"
  | "toast.downloadErrorExt"
  | "toast.encryptedMdDownloaded"
  | "toast.mdDownloaded"
  | "toast.encryptedFileDownloaded"
  | "toast.jsonFileDownloaded"
  | "toast.unknownImportError"
  | "toast.importFailed"
  | "toast.parsedSuccess"
  | "toast.briefParsedFailed"
  | "toast.importedWarn"
  | "toast.importedSuccess"
  | "toast.briefParsed"
  | "toast.briefImportFailed"
  | "toast.copiedFromPanel"
  | "toast.clipboardStillUnavailable"
  | "toast.savedLocally"
  | "toast.label.markdown"
  | "toast.label.encryptedMarkdown"
  | "toast.label.json"
  | "toast.label.encryptedJson"
  | "toast.label.researchStudioBrief"
  | "toast.label.brief"
  // SR announcements + fallback notices
  | "sr.savedLocally"
  | "sr.generating"
  | "sr.ready"
  | "sr.cancelled"
  | "sr.fallbackError"
  | "sr.generationFailed"
  | "sr.markdownExported"
  | "sr.jsonExported"
  | "fallback.tooManyRequests"
  | "fallback.generationFailed"
  | "fallback.demoNotice"
  | "format.na"
  // Cloud history panel (cloud-workspaces.tsx)
  | "cloud.heading"
  | "cloud.snapshotCount"
  | "cloud.localOnlyMode"
  | "cloud.checking"
  | "cloud.statusUnavailable"
  | "cloud.refresh"
  | "cloud.save"
  | "cloud.unavailableBody"
  | "cloud.errorFallback"
  | "cloud.errorCodeCopied"
  | "cloud.copyCode"
  | "cloud.checkingAria"
  | "cloud.empty"
  | "cloud.savedPrefix"
  | "cloud.sharedBadge"
  // Share / share-link controls
  | "share.enableTitle"
  | "share.enableBody"
  | "share.enableConfirm"
  | "share.linkCopied"
  | "share.linkReady"
  | "share.disabled"
  | "share.reenabled"
  | "share.reenableFailed"
  | "share.updateFailed"
  | "share.copyLink"
  | "share.copyLinkFor"
  | "share.disable"
  | "share.disableFor"
  | "share.enable"
  | "share.for"
  | "share.expiresLegend"
  | "share.expiryPermanent"
  | "share.expiry7"
  | "share.expiry30"
  | "share.confirm"
  // Share expiry suffix + row badge (lib-driven, translated in component)
  | "shareExpiry.permanent"
  | "shareExpiry.expired"
  | "shareExpiry.expiresIn"
  | "rowExpiry.expired"
  | "rowExpiry.expiresIn"
  // Account recovery
  | "recovery.title"
  | "recovery.body"
  | "recovery.handle"
  | "recovery.handlePlaceholder"
  | "recovery.key"
  | "recovery.keyAria"
  | "recovery.hide"
  | "recovery.show"
  | "recovery.copy"
  | "recovery.generate"
  | "recovery.link"
  | "recovery.recover"
  // Cloud / recovery toasts
  | "toast.cloudSaved"
  | "toast.cloudFull"
  | "toast.cloudSaveFailed"
  | "toast.cloudRestoredEditor"
  | "toast.undo"
  | "toast.restoreUndone"
  | "toast.restoreFailed"
  | "toast.cloudDeleted"
  | "toast.deleteFailed"
  | "toast.recoveryGenerated"
  | "toast.recoveryCopied"
  | "toast.recoveryCopyFailed"
  | "toast.recoveryInvalid"
  | "toast.recoveryFailed"
  | "toast.recoveryLinked"
  | "toast.recoveryLoaded"
  | "toast.cloudUnreachable"
  | "toast.cloudUnexpected"
  // Snapshot row actions
  | "cloud.restore"
  | "cloud.restoreFor"
  | "cloud.delete"
  | "cloud.deleteFor"
  | "cloud.deleteTitle"
  | "cloud.deleteBody"
  | "cloud.deleteConfirm"
  // Onboarding wizard + replay tour
  | "onboarding.ariaLabel"
  | "onboarding.dismiss"
  | "onboarding.welcome"
  | "onboarding.step1Title"
  | "onboarding.step1Body"
  | "onboarding.step2Title"
  | "onboarding.step2Body"
  | "onboarding.step3Title"
  | "onboarding.step3Body"
  | "onboarding.step4Title"
  | "onboarding.step4Body"
  | "onboarding.hint"
  | "onboarding.getStarted"
  | "onboarding.replayAria"
  | "onboarding.tour"
  // Keyboard shortcuts modal
  | "shortcuts.showAria"
  | "shortcuts.title"
  | "shortcuts.close"
  | "shortcuts.empty"
  | "shortcuts.experimentCards"
  | "shortcuts.evidenceList"
  | "shortcuts.moveFocusUp"
  | "shortcuts.moveFocusDown"
  | "shortcuts.expandCollapse"
  | "shortcuts.setStatus"
  | "shortcuts.moveEvidenceUp"
  | "shortcuts.moveEvidenceDown"
  | "shortcuts.undoDeleteEvidence"
  | "shortcuts.footerOpenPanel"
  | "shortcuts.footerPalette"
  | "shortcuts.footerSlash"
  | "shortcuts.footerEsc"
  | "shortcuts.footerClear"
  | "shortcuts.footerEnd"
  // Shortcut categories + descriptions (dynamic, from shortcut registry)
  | "shortcut.cat.Actions"
  | "shortcut.cat.Navigation"
  | "shortcut.cat.Help"
  | "shortcut.desc.generate"
  | "shortcut.desc.edit"
  | "shortcut.desc.save"
  | "shortcut.desc.focusBrief"
  | "shortcut.desc.focusSearch"
  | "shortcut.desc.collapseAll"
  | "shortcut.desc.expandAll"
  | "shortcut.desc.commandPalette"
  | "shortcut.desc.toggleShortcuts"
  | "shortcut.desc.closeModal"
  | "shortcut.desc.copyMarkdown"
  | "shortcut.desc.reset"
  | "shortcut.desc.showTour"
  | "shortcut.desc.addEvidence"
  | "shortcut.desc.newHypothesis"
  | "shortcut.desc.submitEvidence"
  | "shortcut.desc.toggleSelectMode"
  | "shortcut.desc.undo"
  | "shortcut.desc.redo";

type Dict = Record<DictionaryKey, string>;

const en: Dict = {
  "language.label": "Language",
  "header.brand": "LaunchLens AI",
  "header.title": "Go-to-market workspace",
  "header.badge": "Productized build",
  "header.navAria": "Workspace navigation",
  "nav.brief": "Brief",
  "nav.history": "History",
  "nav.evidence": "Evidence",
  "nav.decisions": "Decisions",
  "nav.account": "Account",
  "nav.readiness": "Readiness",
  "header.resetTitle": "Reset local draft",
  "metrics.sectionAria": "Workspace operating status",
  "metrics.quality": "Quality",
  "metrics.qualityDetail": "{passed}/{total} generated checks",
  "metrics.validation": "Validation",
  "metrics.validationDetail": "{with}/{total} with evidence",
  "metrics.execution": "Execution",
  "metrics.executionDetail": "launch tasks completed",
  "metrics.backlog": "Backlog",
  "metrics.backlogDetail": "{count} assumptions linked",
  "metrics.aiMode": "AI mode",
  "brief.asideAria": "Founder brief",
  "brief.inputLabel": "Input",
  "brief.builderTitle": "Brief builder",
  "brief.hide": "Hide brief",
  "brief.edit": "Edit brief",
  "brief.examplesLabel": "Example workspaces",
  "brief.examplesAria": "Sample briefs",
  "field.idea.label": "Product idea",
  "field.idea.placeholder": "Describe the product you are validating...",
  "field.idea.hint": "Use {shortcut} to generate.",
  "field.idea.recommended": "Recommended 20-500 chars",
  "field.idea.tooLong": "Too long - aim under 500.",
  "field.charsSuffix": "chars",
  "field.audience.label": "Target audience",
  "field.audience.recommended": "Recommended under 240 chars",
  "field.audience.tooLong": "Too long - aim under 240.",
  "field.market.label": "Market context",
  "field.market.recommended": "Recommended under 120 chars",
  "field.market.tooLong": "Too long - aim under 120.",
  "field.voice.label": "Voice",
  "field.constraints.label": "Constraints",
  "field.constraints.recommended": "Recommended under 320 chars",
  "field.constraints.tooLong": "Too long - aim under 320.",
  "field.pleaseShorten": " - please shorten",
  "voice.practical": "Practical, crisp, and founder-friendly",
  "voice.analytical": "Analytical and investor-ready",
  "voice.warm": "Warm and community-led",
  "voice.technical": "Technical and product-led",
  "generate.blockedTooShort": "Describe your product idea in at least 20 characters before generating.",
  "generate.blockedAlready": "Workspace is already generating.",
  "generate.blockedOwnerToken": "Preparing secure session — please wait a moment.",
  "generate.button": "Generate workspace",
  "generate.generating": "Generating",
  "generate.srReason": "Workspace is being generated; please wait or cancel.",
  "generate.cancel": "Cancel generation",
  "generate.loadingHeading": "Generating workspace",
  "generate.errorRetry": "Try again",
  "generate.step.brief": "Reading founder brief",
  "generate.step.structure": "Structuring GTM workspace",
  "generate.step.tasks": "Checking launch tasks",
  "account.label": "Account workspace",
  "account.title": "Snapshot history and private sharing",
  "snapshot.label": "Strategy snapshot",
  "snapshot.title": "Workspace summary",
  "snapshot.generatedPrefix": "Generated ",
  "snapshot.fallbackPrefix": "Fallback: ",
  "sourceBrief.heading": "Generated from Research Studio intelligence report",
  "sourceBrief.session": "Session",
  "sourceBrief.opportunity": "Opportunity",
  "sourceBrief.risk": "Risk",
  "sourceBrief.viewReport": "View full report",
  "sourceBrief.linkPending": "Report link pending",
  "toolbar.preview": "Preview",
  "toolbar.edit": "Edit",
  "toolbar.copyMarkdownAria": "Copy Markdown",
  "toolbar.copiedMarkdownAria": "Copied Markdown",
  "toolbar.markdown": "Markdown",
  "toolbar.copied": "Copied",
  "toolbar.copyJsonAria": "Copy JSON",
  "toolbar.copiedJsonAria": "Copied JSON",
  "toolbar.json": "JSON",
  "toolbar.downloadMdTitle": "Download Markdown file",
  "toolbar.downloadJsonTitle": "Download JSON file",
  "toolbar.importJsonTitle": "Import JSON workspace",
  "toolbar.import": "Import",
  "toolbar.importBriefTitle": "Import a Research Studio brief",
  "toolbar.researchStudio": "Research Studio",
  "toolbar.pasteBrief": "Paste JSON",
  "toolbar.pasteBriefTitle": "Paste a brief as JSON",
  "toolbar.passwordProtect": "Password-protect JSON export",
  "toolbar.passphrasePlaceholder": "passphrase",
  "toolbar.passphraseAria": "Export passphrase",
  "toolbar.regenerate": "regenerate",
  "positioning.label": "Generated positioning",
  "positioning.headline": "Landing page headline",
  "positioning.summary": "Workspace summary",
  "launchCta.label": "Launch CTA",
  "launchCta.title": "Launch call to action",
  "launchCta.nextAction": "Next action",
  "export.heading": "Workspace export",
  "export.badgeJson": "JSON",
  "export.badgeMarkdown": "Markdown",
  "export.dismissAria": "Dismiss export",
  "export.textareaAria": "Exported workspace in {format} format, select and copy",
  "export.copySelection": "Copy selection",
  "export.downloadFile": "Download file",
  "validation.sectionAria": "Generated workspace",
  "validation.label": "Evidence loop",
  "validation.title": "Validate assumptions before committing the launch plan",
  "validation.counter": "{evidence} evidence items / {decided} decisions",
  "decision.label": "Decision layer",
  "decision.title": "Evidence-grounded AI briefs",
  "decision.hint": "Cites only recorded validation evidence",
  "decision.copilotLabel": "Decision copilot",
  "validation.boardLabel": "Validation board",
  "section.targetUsers": "Target users",
  "section.painMap": "Pain map",
  "section.mvpScope": "MVP scope",
  "section.landingCopy": "Landing page copy",
  "section.featureBacklog": "Feature backlog",
  "section.pricingHypothesis": "Pricing hypothesis",
  "section.launchPlan": "Launch plan",
  "section.assumptions": "Assumptions to validate",
  "section.pricingRisks": "Pricing risks",
  "section.contentCalendar": "Content calendar",
  "section.executionTasks": "Execution tasks",
  "section.landingSubheadline": "Landing page subheadline",
  "section.landingProofBullets": "Landing page proof bullets",
  "section.pricingTiers": "Pricing tiers",
  "section.assumptionsEditNote": "Editing assumptions here does not automatically update validation experiments below. Regenerate the workspace or add hypotheses manually in the validation loop.",
  "section.assumptionsViewNote": "Assumptions remain anchored to the generated plan. Track evidence, confidence, decisions, and linked work in the validation loop above.",
  "section.executionCount": "{completed}/{total} completed",
  "edit.featurePlaceholder": "Feature",
  "edit.priority.p0": "P0",
  "edit.priority.p1": "P1",
  "edit.priority.p2": "P2",
  "edit.removeBacklogAria": "Remove backlog item",
  "edit.whyMattersPlaceholder": "Why this matters",
  "edit.addBacklog": "Add backlog item",
  "edit.channelPlaceholder": "Channel",
  "edit.cadencePlaceholder": "Cadence",
  "edit.removeContentAria": "Remove content item",
  "edit.contentAnglePlaceholder": "Content angle or hook",
  "edit.addContent": "Add content item",
  "edit.markIncomplete": "Mark as incomplete",
  "edit.markComplete": "Mark as complete",
  "edit.taskTitlePlaceholder": "Task title",
  "edit.removeTaskAria": "Remove task",
  "edit.ownerPlaceholder": "Owner",
  "edit.duePlaceholder": "Due",
  "edit.outcomePlaceholder": "Outcome",
  "edit.addTask": "Add task",
  "edit.taskDesc": "{owner} owns {outcome}.",
  "importDialog.cancelAria": "Cancel import",
  "importDialog.title": "Import workspace",
  "importDialog.body": "This will replace your current workspace and validation state. This cannot be undone.",
  "importDialog.summary": "Summary",
  "importDialog.includesValidation": "Includes validation state with {count} experiments.",
  "importDialog.warningOne": "{count} warning",
  "importDialog.warningMany": "{count} warnings:",
  "importDialog.cancel": "Cancel",
  "importDialog.import": "Import",
  "briefDialog.cancelAria": "Cancel brief import",
  "briefDialog.titleResearchStudio": "Import brief from Research Studio",
  "briefDialog.titleFile": "Import brief from file",
  "briefDialog.body": "This loads the five brief fields below. Your current workspace stays as-is - click Generate after confirming to build a fresh GTM plan from this brief.",
  "briefDialog.idea": "Idea",
  "briefDialog.audience": "Audience",
  "briefDialog.market": "Market",
  "briefDialog.tone": "Tone",
  "briefDialog.constraints": "Constraints",
  "briefDialog.empty": "(empty)",
  "briefDialog.warningOne": "{count} warning",
  "briefDialog.warningMany": "{count} warnings:",
  "briefDialog.cancel": "Cancel",
  "briefDialog.load": "Load brief",
  "briefDialog.pasteTitle": "Paste brief JSON",
  "briefDialog.pasteBody": "Paste a Research Studio brief envelope (or a bare { idea, audience, market, tone, constraints } object) below. You'll get a chance to review before it's applied.",
  "briefDialog.pastePlaceholder": "{\n  \"schemaVersion\": \"1.0.0\",\n  \"source\": \"launchlens-research-studio\",\n  \"input\": { \"idea\": \"...\", ... }\n}",
  "briefDialog.pasteLoad": "Parse & preview",
  "briefDialog.pasteEmpty": "Nothing to import — paste a brief JSON first.",
  "briefDialog.pasteParsed": "Brief parsed — review and confirm.",
  "briefDialog.pasteError": "Could not parse brief: {msg}",
  "encrypt.title": "Enter passphrase",
  "encrypt.body": "{file} is password-protected. Type the passphrase you used when exporting.",
  "encrypt.passphraseLabel": "Passphrase",
  "encrypt.passphrasePlaceholder": "Passphrase",
  "encrypt.hideAria": "Hide passphrase",
  "encrypt.showAria": "Show passphrase",
  "encrypt.hide": "Hide",
  "encrypt.show": "Show",
  "encrypt.cancel": "Cancel",
  "encrypt.decrypting": "Decrypting...",
  "encrypt.decrypt": "Decrypt & preview",
  "encrypt.submitHint": "Press Control or Command Enter to submit.",
  "toast.briefLoadedWarn": "{label} loaded ({count} warning(s)) - review and Generate",
  "toast.briefLoaded": "{label} loaded - review and Generate",
  "toast.briefFromHash": "Brief loaded from Research Studio - click Generate",
  "toast.briefLinkError": "Research Studio brief link could not be read. Import the JSON file instead.",
  "workspace.outdated.title": "A new brief is loaded but not generated yet",
  "workspace.outdated.body": "The five fields on the left are from your latest source. The workspace on the right is from a previous run and will be replaced when you generate. Choose what to do with the new brief:",
  "workspace.outdated.generate": "Generate workspace from this brief",
  "workspace.outdated.discard": "Discard new brief, keep current workspace",
  "toast.saveHint": "Use the Cloud history section below to save snapshots to cloud.",
  "toast.restored": "Local workspace restored from browser storage.",
  "toast.storageUnavailable": "Local storage unavailable - changes may not persist.",
  "toast.exampleLoaded": "Example workspace loaded.",
  "toast.reset": "Workspace reset to starter example.",
  "toast.cloudRestored": "Cloud snapshot restored successfully.",
  "toast.demoFallback": "Real provider unavailable - returned demo workspace instead.",
  "toast.copiedLabel": "{label} copied to clipboard",
  "toast.copiedLabelNoPass": "{label} copied (password not stored)",
  "toast.clipboardFallbackLabel": "Clipboard unavailable - downloaded {label} file instead",
  "toast.clipboardFallbackGeneric": "Clipboard unavailable - downloaded {label} file instead",
  "toast.exportedExt": "Exported as .{ext} file",
  "toast.downloadErrorExt": "Unable to download {ext} file in this browser",
  "toast.encryptedMdDownloaded": "Encrypted Markdown downloaded. Password not stored - remember it!",
  "toast.mdDownloaded": "Markdown file downloaded",
  "toast.encryptedFileDownloaded": "Encrypted file downloaded. Password not stored - remember it!",
  "toast.jsonFileDownloaded": "JSON file downloaded",
  "toast.unknownImportError": "Unknown import error",
  "toast.importFailed": "Import failed: {msg}",
  "toast.parsedSuccess": "File parsed successfully - review and confirm",
  "toast.briefParsedFailed": "Unknown import error",
  "toast.importedWarn": "Workspace imported ({count} warning(s))",
  "toast.importedSuccess": "Workspace imported successfully",
  "toast.briefParsed": "Brief parsed - review and confirm",
  "toast.briefImportFailed": "Brief import failed: {msg}",
  "toast.copiedFromPanel": "Copied from export panel",
  "toast.clipboardStillUnavailable": "Clipboard still unavailable - use the Download button instead",
  "toast.savedLocally": "Saved locally",
  "toast.label.markdown": "Markdown",
  "toast.label.encryptedMarkdown": "Encrypted Markdown",
  "toast.label.json": "JSON",
  "toast.label.encryptedJson": "Encrypted JSON",
  "toast.label.researchStudioBrief": "Research Studio brief",
  "toast.label.brief": "brief",
  "sr.savedLocally": "Workspace saved locally.",
  "sr.generating": "Generating workspace from your founder brief. This will take a moment.",
  "sr.ready": "Workspace ready. {segments} audience segments, {tasks} execution tasks, {hypotheses} validation hypotheses.",
  "sr.cancelled": "Generation cancelled.",
  "sr.fallbackError": "Something went wrong during generation.",
  "sr.generationFailed": "Generation failed: {msg}",
  "sr.markdownExported": "Markdown exported and copied to clipboard.",
  "sr.jsonExported": "JSON exported and copied to clipboard.",
  "fallback.tooManyRequests": "Too many requests —please wait a moment and try again.",
  "fallback.generationFailed": "Generation failed.",
  "fallback.demoNotice": "Real provider failed, so LaunchLens returned the mock workspace.",
  "format.na": "n/a",
  "cloud.heading": "Cloud history",
  "cloud.snapshotCount": "{scope}, {count} of {total} snapshots",
  "cloud.localOnlyMode": "Local-only mode",
  "cloud.checking": "Checking availability",
  "cloud.statusUnavailable": "Cloud status unavailable",
  "cloud.refresh": "Refresh cloud history",
  "cloud.save": "Save snapshot",
  "cloud.unavailableBody": "Cloud history is not configured on this deployment. Local autosave, editing, generation, and export remain available.",
  "cloud.errorFallback": "Cloud history could not be reached. Your local draft remains available.",
  "cloud.errorCodeCopied": "Error code copied to clipboard.",
  "cloud.copyCode": "Copy code",
  "cloud.checkingAria": "Checking cloud history",
  "cloud.empty": "No cloud snapshots yet. Save the current workspace when it reaches a useful decision point.",
  "cloud.savedPrefix": "Saved ",
  "cloud.sharedBadge": "Shared",
  "cloud.restore": "Restore snapshot",
  "cloud.restoreFor": "Restore {title}",
  "cloud.delete": "Delete snapshot",
  "cloud.deleteFor": "Delete {title}",
  "cloud.deleteTitle": "Delete cloud snapshot?",
  "cloud.deleteBody": "\"{title}\" will be permanently removed from cloud history. This cannot be undone.",
  "cloud.deleteConfirm": "Delete snapshot",
  "onboarding.ariaLabel": "Quick start guide",
  "onboarding.dismiss": "Dismiss quick start guide",
  "onboarding.welcome": "Welcome to LaunchLens AI",
  "onboarding.step1Title": "Choose a founder brief",
  "onboarding.step1Body": "Select one of the three sample briefs, or write your own product idea. The brief captures your audience, market, tone, and constraints.",
  "onboarding.step2Title": "Generate a workspace",
  "onboarding.step2Body": "Click the Generate button. The mock provider builds a complete go-to-market plan: users, pains, MVP scope, pricing, launch plan, and tasks.",
  "onboarding.step3Title": "Validate assumptions",
  "onboarding.step3Body": "Each assumption is a hypothesis. Add evidence, set confidence, record a decision, and link an execution task. The AI decision copilot cites only your evidence.",
  "onboarding.step4Title": "Save, share, or export",
  "onboarding.step4Body": "If a database is configured, save cloud snapshots and generate privacy-safe share links. Otherwise, export your workspace as Markdown or JSON.",
  "onboarding.hint": "Your workspace stays local by default, with cloud history available when you choose to save a snapshot.",
  "onboarding.getStarted": "Get started",
  "onboarding.replayAria": "Replay quick start tour",
  "onboarding.tour": "Tour",
  "shortcuts.showAria": "Show keyboard shortcuts",
  "shortcuts.title": "Keyboard Shortcuts",
  "shortcuts.close": "Close shortcuts",
  "shortcuts.empty": "No shortcuts registered yet.",
  "shortcuts.experimentCards": "Experiment cards (when focused)",
  "shortcuts.evidenceList": "Evidence list (when focused)",
  "shortcuts.moveFocusUp": "Move focus up",
  "shortcuts.moveFocusDown": "Move focus down",
  "shortcuts.expandCollapse": "Expand / collapse",
  "shortcuts.setStatus": "Set status (1-4)",
  "shortcuts.moveEvidenceUp": "Move evidence up",
  "shortcuts.moveEvidenceDown": "Move evidence down",
  "shortcuts.undoDeleteEvidence": "Undo delete evidence",
  "shortcuts.footerOpenPanel": "Press {key} to open this panel. Press ",
  "shortcuts.footerPalette": " for the command palette, or ",
  "shortcuts.footerSlash": " to focus validation search. Press ",
  "shortcuts.footerEsc": " to dismiss the newest toast or topmost overlay; hold ",
  "shortcuts.footerClear": " with ",
  "shortcuts.footerEnd": " to clear all toasts.",
  "shortcut.cat.Actions": "Actions",
  "shortcut.cat.Navigation": "Navigation",
  "shortcut.cat.Help": "Help",
  "shortcut.desc.generate": "Generate workspace from brief",
  "shortcut.desc.edit": "Toggle edit/preview mode",
  "shortcut.desc.save": "Save workspace to cloud",
  "shortcut.desc.focusBrief": "Focus founder brief input",
  "shortcut.desc.focusSearch": "Focus validation search",
  "shortcut.desc.collapseAll": "Collapse all sections",
  "shortcut.desc.expandAll": "Expand all sections",
  "shortcut.desc.commandPalette": "Open command palette",
  "shortcut.desc.toggleShortcuts": "Show keyboard shortcuts",
  "shortcut.desc.closeModal": "Close any open modal or dialog",
  "shortcut.desc.copyMarkdown": "Copy workspace as Markdown",
  "shortcut.desc.reset": "Reset workspace to initial example",
  "shortcut.desc.showTour": "Replay the quick start tour",
  "shortcut.desc.addEvidence": "Add evidence to first hypothesis",
  "shortcut.desc.newHypothesis": "Add a new hypothesis",
  "shortcut.desc.submitEvidence": "Submit evidence form (when focus is in note)",
  "shortcut.desc.toggleSelectMode": "Toggle hypothesis select mode (bulk actions)",
  "shortcut.desc.undo": "Undo the last validation-board edit",
  "shortcut.desc.redo": "Redo the last undone edit",
  "share.enableTitle": "Enable public share link?",
  "share.enableBody": "Validation decisions and evidence counts will be visible to anyone with the link. Evidence notes, sources, and the founder brief stay private.",
  "share.enableConfirm": "Enable and copy link",
  "share.linkCopied": "Read-only share link copied to clipboard.",
  "share.linkReady": "Share link ready: {url}",
  "share.disabled": "Public sharing disabled.",
  "share.reenabled": "Sharing re-enabled.",
  "share.reenableFailed": "Could not re-enable sharing.",
  "share.updateFailed": "Could not update sharing settings.",
  "share.copyLink": "Copy share link",
  "share.copyLinkFor": "Copy share link for {title}",
  "share.disable": "Disable sharing",
  "share.disableFor": "Disable sharing for {title}",
  "share.enable": "Enable sharing",
  "share.for": "Share {title}",
  "share.expiresLegend": "Link expires",
  "share.expiryPermanent": "Never (permanent)",
  "share.expiry7": "In 7 days",
  "share.expiry30": "In 30 days",
  "share.confirm": "Confirm",
  "shareExpiry.permanent": " Permanent.",
  "shareExpiry.expired": " It has expired.",
  "shareExpiry.expiresIn": " Expires in {label}.",
  "rowExpiry.expired": "Expired",
  "rowExpiry.expiresIn": "Expires in {days}d",
  "recovery.title": "Account recovery",
  "recovery.body": "Save this key privately. Possession grants access to cloud history. Use {link} on the device that created the account and {recover} on a new device.",
  "recovery.handle": "Handle",
  "recovery.handlePlaceholder": "founder@example.com",
  "recovery.key": "Recovery key",
  "recovery.keyAria": "Recovery key",
  "recovery.hide": "Hide recovery key",
  "recovery.show": "Show recovery key",
  "recovery.copy": "Copy recovery key",
  "recovery.generate": "Generate key",
  "recovery.link": "Link history",
  "recovery.recover": "Recover",
  "toast.cloudSaved": "Cloud snapshot saved.",
  "toast.cloudFull": "Cloud history is full. Delete a snapshot before saving.",
  "toast.cloudSaveFailed": "Cloud save failed. Your local draft is still safe.",
  "toast.cloudRestoredEditor": "Cloud snapshot restored to the editor.",
  "toast.undo": "Undo",
  "toast.restoreUndone": "Restore undone; editor returned to prior state.",
  "toast.restoreFailed": "Could not restore that cloud snapshot.",
  "toast.cloudDeleted": "Cloud snapshot deleted.",
  "toast.deleteFailed": "Could not delete cloud snapshot.",
  "toast.recoveryGenerated": "Recovery key generated - keep it somewhere private!",
  "toast.recoveryCopied": "Recovery key copied. Store it safely!",
  "toast.recoveryCopyFailed": "Copy failed - please select and save the key manually.",
  "toast.recoveryInvalid": "Recovery details don't look right - double-check handle and key.",
  "toast.recoveryFailed": "Recovery failed - check your handle and recovery key.",
  "toast.recoveryLinked": "Cloud history linked to your recovery key.",
  "toast.recoveryLoaded": "Recovery key loaded - cloud history restored.",
  "toast.cloudUnreachable": "Cloud history could not be reached.",
  "toast.cloudUnexpected": "Cloud history returned an unexpected response.",
};

const zhCN: Dict = {
  "language.label": "语言",
  "header.brand": "LaunchLens AI",
  "header.title": "GTM 工作台",
  "header.badge": "产品化构建",
  "header.navAria": "工作台导航",
  "nav.brief": "简报",
  "nav.history": "历史",
  "nav.evidence": "证据",
  "nav.decisions": "决策",
  "nav.account": "账户",
  "nav.readiness": "就绪度",
  "header.resetTitle": "重置本地草稿",
  "metrics.sectionAria": "工作台运行状态",
  "metrics.quality": "质量",
  "metrics.qualityDetail": "{passed}/{total} 项生成检查",
  "metrics.validation": "验证",
  "metrics.validationDetail": "{with}/{total} 项附带证据",
  "metrics.execution": "执行",
  "metrics.executionDetail": "项启动任务已完成",
  "metrics.backlog": "待办",
  "metrics.backlogDetail": "{count} 项关联假设",
  "metrics.aiMode": "AI 模式",
  "brief.asideAria": "创始人简报",
  "brief.inputLabel": "输入",
  "brief.builderTitle": "简报构建器",
  "brief.hide": "隐藏简报",
  "brief.edit": "编辑简报",
  "brief.examplesLabel": "示例工作台",
  "brief.examplesAria": "示例简报",
  "field.idea.label": "产品想法",
  "field.idea.placeholder": "描述你正在验证的产品……",
  "field.idea.hint": "使用 {shortcut} 生成。",
  "field.idea.recommended": "建议 20–500 字符",
  "field.idea.tooLong": "过长 — 请控制在 500 以内。",
  "field.charsSuffix": "字符",
  "field.audience.label": "目标受众",
  "field.audience.recommended": "建议在 240 字符以内",
  "field.audience.tooLong": "过长 — 请控制在 240 以内。",
  "field.market.label": "市场背景",
  "field.market.recommended": "建议在 120 字符以内",
  "field.market.tooLong": "过长 — 请控制在 120 以内。",
  "field.voice.label": "语调",
  "field.constraints.label": "约束条件",
  "field.constraints.recommended": "建议在 320 字符以内",
  "field.constraints.tooLong": "过长 — 请控制在 320 以内。",
  "field.pleaseShorten": " — 请精简",
  "voice.practical": "务实、简洁、面向创始人",
  "voice.analytical": "分析型、面向投资人",
  "voice.warm": "温暖、社区驱动",
  "voice.technical": "技术型、产品驱动",
  "generate.blockedTooShort": "生成前请至少用 20 个字符描述你的产品想法。",
  "generate.blockedAlready": "工作台正在生成中。",
  "generate.blockedOwnerToken": "正在准备安全会话 — 请稍等片刻。",
  "generate.button": "生成工作台",
  "generate.generating": "生成中",
  "generate.srReason": "工作台正在生成，请等待或取消。",
  "generate.cancel": "取消生成",
  "generate.loadingHeading": "正在生成工作台",
  "generate.errorRetry": "重试",
  "generate.step.brief": "读取创始人简报",
  "generate.step.structure": "构建 GTM 工作台结构",
  "generate.step.tasks": "检查启动任务",
  "account.label": "账户工作台",
  "account.title": "快照历史与私密分享",
  "snapshot.label": "策略快照",
  "snapshot.title": "工作台摘要",
  "snapshot.generatedPrefix": "生成于 ",
  "snapshot.fallbackPrefix": "回退：",
  "sourceBrief.heading": "基于 Research Studio 情报报告生成",
  "sourceBrief.session": "会话",
  "sourceBrief.opportunity": "机会",
  "sourceBrief.risk": "风险",
  "sourceBrief.viewReport": "查看完整报告",
  "sourceBrief.linkPending": "报告链接待生成",
  "toolbar.preview": "预览",
  "toolbar.edit": "编辑",
  "toolbar.copyMarkdownAria": "复制 Markdown",
  "toolbar.copiedMarkdownAria": "已复制 Markdown",
  "toolbar.markdown": "Markdown",
  "toolbar.copied": "已复制",
  "toolbar.copyJsonAria": "复制 JSON",
  "toolbar.copiedJsonAria": "已复制 JSON",
  "toolbar.json": "JSON",
  "toolbar.downloadMdTitle": "下载 Markdown 文件",
  "toolbar.downloadJsonTitle": "下载 JSON 文件",
  "toolbar.importJsonTitle": "导入 JSON 工作台",
  "toolbar.import": "导入",
  "toolbar.importBriefTitle": "导入 Research Studio 简报",
  "toolbar.researchStudio": "Research Studio",
  "toolbar.pasteBrief": "粘贴 JSON",
  "toolbar.pasteBriefTitle": "粘贴简报 JSON",
  "toolbar.passwordProtect": "用密码保护 JSON 导出",
  "toolbar.passphrasePlaceholder": "口令",
  "toolbar.passphraseAria": "导出口令",
  "toolbar.regenerate": "重新生成",
  "positioning.label": "生成的定位",
  "positioning.headline": "落地页标题",
  "positioning.summary": "工作台摘要",
  "launchCta.label": "启动 CTA",
  "launchCta.title": "启动号召语",
  "launchCta.nextAction": "下一步行动",
  "export.heading": "工作台导出",
  "export.badgeJson": "JSON",
  "export.badgeMarkdown": "Markdown",
  "export.dismissAria": "关闭导出",
  "export.textareaAria": "已以 {format} 格式导出工作台，可全选并复制",
  "export.copySelection": "复制所选",
  "export.downloadFile": "下载文件",
  "validation.sectionAria": "生成的工作台",
  "validation.label": "证据循环",
  "validation.title": "在执行启动计划前验证假设",
  "validation.counter": "{evidence} 项证据 / {decided} 项决策",
  "decision.label": "决策层",
  "decision.title": "基于证据的 AI 简报",
  "decision.hint": "仅引用已记录的验证证据",
  "decision.copilotLabel": "决策助手",
  "validation.boardLabel": "验证看板",
  "section.targetUsers": "目标用户",
  "section.painMap": "痛点地图",
  "section.mvpScope": "MVP 范围",
  "section.landingCopy": "落地页文案",
  "section.featureBacklog": "功能待办",
  "section.pricingHypothesis": "定价假设",
  "section.launchPlan": "启动计划",
  "section.assumptions": "待验证假设",
  "section.pricingRisks": "定价风险",
  "section.contentCalendar": "内容日历",
  "section.executionTasks": "执行任务",
  "section.landingSubheadline": "落地页副标题",
  "section.landingProofBullets": "落地页佐证要点",
  "section.pricingTiers": "定价档位",
  "section.assumptionsEditNote": "在此编辑假设不会自动更新下方的验证实验。请重新生成工作台，或在证据循环中手动添加假设。",
  "section.assumptionsViewNote": "假设仍锚定于生成的计划。请在上方证据循环中追踪证据、置信度、决策与关联工作。",
  "section.executionCount": "{completed}/{total} 已完成",
  "edit.featurePlaceholder": "功能",
  "edit.priority.p0": "P0",
  "edit.priority.p1": "P1",
  "edit.priority.p2": "P2",
  "edit.removeBacklogAria": "移除待办项",
  "edit.whyMattersPlaceholder": "为何重要",
  "edit.addBacklog": "添加待办项",
  "edit.channelPlaceholder": "渠道",
  "edit.cadencePlaceholder": "频率",
  "edit.removeContentAria": "移除内容项",
  "edit.contentAnglePlaceholder": "内容角度或钩子",
  "edit.addContent": "添加内容项",
  "edit.markIncomplete": "标记为未完成",
  "edit.markComplete": "标记为已完成",
  "edit.taskTitlePlaceholder": "任务标题",
  "edit.removeTaskAria": "移除任务",
  "edit.ownerPlaceholder": "负责人",
  "edit.duePlaceholder": "截止",
  "edit.outcomePlaceholder": "产出",
  "edit.addTask": "添加任务",
  "edit.taskDesc": "{owner} 负责 {outcome}。",
  "importDialog.cancelAria": "取消导入",
  "importDialog.title": "导入工作台",
  "importDialog.body": "这将替换你当前的工作台与验证状态，且无法撤销。",
  "importDialog.summary": "摘要",
  "importDialog.includesValidation": "包含验证状态，共 {count} 项实验。",
  "importDialog.warningOne": "{count} 项警告",
  "importDialog.warningMany": "{count} 项警告：",
  "importDialog.cancel": "取消",
  "importDialog.import": "导入",
  "briefDialog.cancelAria": "取消简报导入",
  "briefDialog.titleResearchStudio": "从 Research Studio 导入简报",
  "briefDialog.titleFile": "从文件导入简报",
  "briefDialog.body": "这将加载下方五个简报字段。你当前的工作台保持不变 — 确认后点击「生成」即可基于此简报构建新的 GTM 计划。",
  "briefDialog.idea": "想法",
  "briefDialog.audience": "受众",
  "briefDialog.market": "市场",
  "briefDialog.tone": "语调",
  "briefDialog.constraints": "约束",
  "briefDialog.empty": "（空）",
  "briefDialog.warningOne": "{count} 项警告",
  "briefDialog.warningMany": "{count} 项警告：",
  "briefDialog.cancel": "取消",
  "briefDialog.load": "加载简报",
  "briefDialog.pasteTitle": "粘贴简报 JSON",
  "briefDialog.pasteBody": "在下方粘贴 Research Studio 简报信封（或一个包含 { idea, audience, market, tone, constraints } 的裸对象）。应用前你可以先预览。",
  "briefDialog.pastePlaceholder": "{\n  \"schemaVersion\": \"1.0.0\",\n  \"source\": \"launchlens-research-studio\",\n  \"input\": { \"idea\": \"...\", ... }\n}",
  "briefDialog.pasteLoad": "解析并预览",
  "briefDialog.pasteEmpty": "没有可导入的内容 — 请先粘贴简报 JSON。",
  "briefDialog.pasteParsed": "简报已解析 — 请核对后确认。",
  "briefDialog.pasteError": "无法解析简报：{msg}",
  "encrypt.title": "输入口令",
  "encrypt.body": "{file} 已加密保护。请输入导出时使用的口令。",
  "encrypt.passphraseLabel": "口令",
  "encrypt.passphrasePlaceholder": "口令",
  "encrypt.hideAria": "隐藏口令",
  "encrypt.showAria": "显示口令",
  "encrypt.hide": "隐藏",
  "encrypt.show": "显示",
  "encrypt.cancel": "取消",
  "encrypt.decrypting": "解密中……",
  "encrypt.decrypt": "解密并预览",
  "encrypt.submitHint": "按 Control 或 Command + Enter 提交。",
  "toast.briefLoadedWarn": "{label} 已加载（{count} 项警告）— 检查后点击「生成」",
  "toast.briefLoaded": "{label} 已加载 — 检查后点击「生成」",
  "toast.briefFromHash": "已从 Research Studio 加载简报 — 点击「生成」",
  "toast.briefLinkError": "无法读取 Research Studio 简报链接，请改为导入 JSON 文件。",
  "workspace.outdated.title": "已加载新简报，尚未生成工作台",
  "workspace.outdated.body": "左侧五个字段来自你最新的来源。右侧工作台仍是上次的结果，生成后会被替换。请选择如何处理新简报：",
  "workspace.outdated.generate": "基于此简报生成工作台",
  "workspace.outdated.discard": "丢弃新简报，保留当前工作台",
  "toast.saveHint": "使用下方云端历史区域将快照保存到云端。",
  "toast.restored": "已从浏览器存储恢复本地工作台。",
  "toast.storageUnavailable": "本地存储不可用 — 更改可能无法保留。",
  "toast.exampleLoaded": "已加载示例工作台。",
  "toast.reset": "工作台已重置为入门示例。",
  "toast.cloudRestored": "云端快照恢复成功。",
  "toast.demoFallback": "真实提供方不可用 — 已返回演示工作台。",
  "toast.copiedLabel": "{label} 已复制到剪贴板",
  "toast.copiedLabelNoPass": "{label} 已复制（未保存密码）",
  "toast.clipboardFallbackLabel": "剪贴板不可用 — 已改为下载 {label} 文件",
  "toast.clipboardFallbackGeneric": "剪贴板不可用 — 已改为下载 {label} 文件",
  "toast.exportedExt": "已导出为 .{ext} 文件",
  "toast.downloadErrorExt": "此浏览器无法下载 {ext} 文件",
  "toast.encryptedMdDownloaded": "加密 Markdown 已下载。未保存密码 — 请务必记住！",
  "toast.mdDownloaded": "Markdown 文件已下载",
  "toast.encryptedFileDownloaded": "加密文件已下载。未保存密码 — 请务必记住！",
  "toast.jsonFileDownloaded": "JSON 文件已下载",
  "toast.unknownImportError": "未知导入错误",
  "toast.importFailed": "导入失败：{msg}",
  "toast.parsedSuccess": "文件解析成功 — 检查并确认",
  "toast.briefParsedFailed": "未知导入错误",
  "toast.importedWarn": "工作台已导入（{count} 项警告）",
  "toast.importedSuccess": "工作台导入成功",
  "toast.briefParsed": "简报已解析 — 检查并确认",
  "toast.briefImportFailed": "简报导入失败：{msg}",
  "toast.copiedFromPanel": "已从导出面板复制",
  "toast.clipboardStillUnavailable": "剪贴板仍不可用 — 请改用「下载」按钮",
  "toast.savedLocally": "已本地保存",
  "toast.label.markdown": "Markdown",
  "toast.label.encryptedMarkdown": "加密 Markdown",
  "toast.label.json": "JSON",
  "toast.label.encryptedJson": "加密 JSON",
  "toast.label.researchStudioBrief": "Research Studio 简报",
  "toast.label.brief": "简报",
  "sr.savedLocally": "工作台已本地保存。",
  "sr.generating": "正在根据你的创始人简报生成工作台，请稍候。",
  "sr.ready": "工作台已就绪。{segments} 个受众细分、{tasks} 项执行任务、{hypotheses} 项验证假设。",
  "sr.cancelled": "生成已取消。",
  "sr.fallbackError": "生成过程中出现问题。",
  "sr.generationFailed": "生成失败：{msg}",
  "sr.markdownExported": "Markdown 已导出并复制到剪贴板。",
  "sr.jsonExported": "JSON 已导出并复制到剪贴板。",
  "fallback.tooManyRequests": "请求过多 — 请稍候片刻再试。",
  "fallback.generationFailed": "生成失败。",
  "fallback.demoNotice": "真实提供方失败，LaunchLens 已返回模拟工作台。",
  "format.na": "暂无",
  "cloud.heading": "云端历史",
  "cloud.snapshotCount": "{scope}，共 {total} 个快照，已有 {count} 个",
  "cloud.localOnlyMode": "仅本地模式",
  "cloud.checking": "正在检查可用性",
  "cloud.statusUnavailable": "云端状态不可用",
  "cloud.refresh": "刷新云端历史",
  "cloud.save": "保存快照",
  "cloud.unavailableBody": "此部署未配置云端历史。本地自动保存、编辑、生成与导出仍可正常使用。",
  "cloud.errorFallback": "无法连接云端历史。本地草稿仍可用。",
  "cloud.errorCodeCopied": "错误代码已复制到剪贴板。",
  "cloud.copyCode": "复制代码",
  "cloud.checkingAria": "正在检查云端历史",
  "cloud.empty": "暂无云端快照。当工作台到达有价值的决策节点时，可保存当前状态。",
  "cloud.savedPrefix": "已保存 ",
  "cloud.sharedBadge": "已分享",
  "cloud.restore": "恢复快照",
  "cloud.restoreFor": "恢复「{title}」",
  "cloud.delete": "删除快照",
  "cloud.deleteFor": "删除「{title}」",
  "cloud.deleteTitle": "删除云端快照？",
  "cloud.deleteBody": "「{title}」将从云端历史中永久移除，此操作无法撤销。",
  "cloud.deleteConfirm": "删除快照",
  "onboarding.ariaLabel": "快速入门指南",
  "onboarding.dismiss": "关闭快速入门指南",
  "onboarding.welcome": "欢迎使用 LaunchLens AI",
  "onboarding.step1Title": "选择创始人简报",
  "onboarding.step1Body": "从三个示例简报中选择一个，或自行撰写产品想法。简报会记录你的受众、市场、语气与约束。",
  "onboarding.step2Title": "生成工作台",
  "onboarding.step2Body": "点击「生成」按钮。模拟提供方会构建完整的 GTM 方案：用户、痛点、MVP 范围、定价、发布计划与任务。",
  "onboarding.step3Title": "验证假设",
  "onboarding.step3Body": "每条假设都是一个待验证的命题。添加证据、设定置信度、记录决策，并关联执行任务。AI 决策助手仅引用你的证据。",
  "onboarding.step4Title": "保存、分享或导出",
  "onboarding.step4Body": "若已配置数据库，可保存云端快照并生成隐私安全的分享链接；否则可将工作台导出为 Markdown 或 JSON。",
  "onboarding.hint": "工作台默认保存在本地；当你选择保存快照时，可使用云端历史。",
  "onboarding.getStarted": "开始使用",
  "onboarding.replayAria": "重放快速入门导览",
  "onboarding.tour": "导览",
  "shortcuts.showAria": "显示键盘快捷键",
  "shortcuts.title": "键盘快捷键",
  "shortcuts.close": "关闭快捷键",
  "shortcuts.empty": "暂无已注册的快捷键。",
  "shortcuts.experimentCards": "实验卡片（聚焦时）",
  "shortcuts.evidenceList": "证据列表（聚焦时）",
  "shortcuts.moveFocusUp": "上移焦点",
  "shortcuts.moveFocusDown": "下移焦点",
  "shortcuts.expandCollapse": "展开 / 折叠",
  "shortcuts.setStatus": "设置状态（1-4）",
  "shortcuts.moveEvidenceUp": "上移证据",
  "shortcuts.moveEvidenceDown": "下移证据",
  "shortcuts.undoDeleteEvidence": "撤销删除证据",
  "shortcuts.footerOpenPanel": "按 {key} 打开此面板。按 ",
  "shortcuts.footerPalette": " 打开命令面板，或按 ",
  "shortcuts.footerSlash": " 聚焦验证搜索。按 ",
  "shortcuts.footerEsc": " 关闭最新通知或最上层浮层；按住 ",
  "shortcuts.footerClear": " 加 ",
  "shortcuts.footerEnd": " 以清除所有通知。",
  "shortcut.cat.Actions": "操作",
  "shortcut.cat.Navigation": "导航",
  "shortcut.cat.Help": "帮助",
  "shortcut.desc.generate": "根据简报生成工作台",
  "shortcut.desc.edit": "切换编辑/预览模式",
  "shortcut.desc.save": "保存工作台到云端",
  "shortcut.desc.focusBrief": "聚焦创始人简报输入框",
  "shortcut.desc.focusSearch": "聚焦验证搜索",
  "shortcut.desc.collapseAll": "折叠所有区块",
  "shortcut.desc.expandAll": "展开所有区块",
  "shortcut.desc.commandPalette": "打开命令面板",
  "shortcut.desc.toggleShortcuts": "显示键盘快捷键",
  "shortcut.desc.closeModal": "关闭任何打开的弹窗或对话框",
  "shortcut.desc.copyMarkdown": "复制工作台为 Markdown",
  "shortcut.desc.reset": "重置工作台为初始示例",
  "shortcut.desc.showTour": "重放快速入门导览",
  "shortcut.desc.addEvidence": "向首个假设添加证据",
  "shortcut.desc.newHypothesis": "添加新假设",
  "shortcut.desc.submitEvidence": "提交证据表单（光标在备注中时）",
  "shortcut.desc.toggleSelectMode": "切换假设多选模式（批量操作）",
  "shortcut.desc.undo": "撤销最近的验证板编辑",
  "shortcut.desc.redo": "重做最近撤销的编辑",
  "share.enableTitle": "启用公开分享链接？",
  "share.enableBody": "拥有链接的任何人都可查看验证决策与证据计数。证据笔记、来源与创始人简报保持私密。",
  "share.enableConfirm": "启用并复制链接",
  "share.linkCopied": "只读分享链接已复制到剪贴板。",
  "share.linkReady": "分享链接已就绪：{url}",
  "share.disabled": "公开分享已关闭。",
  "share.reenabled": "分享已重新启用。",
  "share.reenableFailed": "无法重新启用分享。",
  "share.updateFailed": "无法更新分享设置。",
  "share.copyLink": "复制分享链接",
  "share.copyLinkFor": "复制「{title}」的分享链接",
  "share.disable": "关闭分享",
  "share.disableFor": "关闭「{title}」的分享",
  "share.enable": "启用分享",
  "share.for": "分享「{title}」",
  "share.expiresLegend": "链接有效期",
  "share.expiryPermanent": "永久有效",
  "share.expiry7": "7 天后",
  "share.expiry30": "30 天后",
  "share.confirm": "确认",
  "shareExpiry.permanent": " 永久有效。",
  "shareExpiry.expired": " 已过期。",
  "shareExpiry.expiresIn": " {label}后过期。",
  "rowExpiry.expired": "已过期",
  "rowExpiry.expiresIn": "{days}天后过期",
  "recovery.title": "账户恢复",
  "recovery.body": "请私下保存此密钥。持有即可访问云端历史。在创建账户的设备上使用{link}，在新设备上使用{recover}。",
  "recovery.handle": "账号标识",
  "recovery.handlePlaceholder": "founder@example.com",
  "recovery.key": "恢复密钥",
  "recovery.keyAria": "恢复密钥",
  "recovery.hide": "隐藏恢复密钥",
  "recovery.show": "显示恢复密钥",
  "recovery.copy": "复制恢复密钥",
  "recovery.generate": "生成密钥",
  "recovery.link": "关联历史",
  "recovery.recover": "恢复",
  "toast.cloudSaved": "云端快照已保存。",
  "toast.cloudFull": "云端历史已满，请先删除一个快照再保存。",
  "toast.cloudSaveFailed": "云端保存失败。本地草稿仍安全。",
  "toast.cloudRestoredEditor": "云端快照已恢复到编辑器。",
  "toast.undo": "撤销",
  "toast.restoreUndone": "已撤销恢复；编辑器已回到先前状态。",
  "toast.restoreFailed": "无法恢复该云端快照。",
  "toast.cloudDeleted": "云端快照已删除。",
  "toast.deleteFailed": "无法删除云端快照。",
  "toast.recoveryGenerated": "恢复密钥已生成 — 请妥善保管！",
  "toast.recoveryCopied": "恢复密钥已复制。请安全保存！",
  "toast.recoveryCopyFailed": "复制失败 — 请手动选中并保存密钥。",
  "toast.recoveryInvalid": "恢复信息有误 — 请核对账号标识与密钥。",
  "toast.recoveryFailed": "恢复失败 — 请检查账号标识与恢复密钥。",
  "toast.recoveryLinked": "云端历史已关联到你的恢复密钥。",
  "toast.recoveryLoaded": "恢复密钥已加载 — 云端历史已恢复。",
  "toast.cloudUnreachable": "无法连接云端历史。",
  "toast.cloudUnexpected": "云端历史返回了意外的响应。",
};

const DICTIONARIES: Record<Locale, Dict> = {
  "en": en,
  "zh-CN": zhCN,
};

export function translate(
  locale: Locale,
  key: DictionaryKey | string,
  fallback?: string,
  params?: Record<string, string | number>,
): string {
  const dict = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
  const k = key as DictionaryKey;
  let raw = dict[k] || DICTIONARIES[DEFAULT_LOCALE][k] || fallback;
  if (!raw) return typeof key === "string" ? key : "";
  if (params) {
    for (const [name, val] of Object.entries(params)) {
      raw = raw.replace(new RegExp(`\\{\\s*${name}\\s*\\}`, "g"), String(val));
    }
  }
  return raw;
}
