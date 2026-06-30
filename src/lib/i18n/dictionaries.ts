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
  // Output profile selector
  | "profile.sectionAria"
  | "profile.eyebrow"
  | "profile.title"
  | "profile.body"
  | "profile.idea.label"
  | "profile.idea.title"
  | "profile.idea.description"
  | "profile.founder.label"
  | "profile.founder.title"
  | "profile.founder.description"
  | "profile.analyst.label"
  | "profile.analyst.title"
  | "profile.analyst.description"
  | "profile.notice.idea"
  | "profile.notice.founder"
  | "profile.notice.analyst"
  | "profile.hiddenItems"
  | "profile.switchAnalyst"
  | "profile.integrityLabel"
  | "profile.integrityBody"
  | "profile.audienceLabel"
  | "profile.densityLabel"
  | "profile.idea.audience"
  | "profile.idea.density"
  | "profile.founder.audience"
  | "profile.founder.density"
  | "profile.analyst.audience"
  | "profile.analyst.density"
  // Analysis companion
  | "analysis.sectionAria"
  | "analysis.eyebrow"
  | "analysis.title"
  | "analysis.toggleOn"
  | "analysis.toggleOff"
  | "analysis.enabledHelp"
  | "analysis.disabledHelp"
  | "analysis.guardrail.hover"
  | "analysis.guardrail.noAi"
  | "analysis.profile"
  | "analysis.insight.overview.label"
  | "analysis.insight.overview.title"
  | "analysis.insight.overview.body"
  | "analysis.insight.profile.label"
  | "analysis.insight.profile.title"
  | "analysis.insight.profile.body"
  | "analysis.insight.quality.label"
  | "analysis.insight.quality.title"
  | "analysis.insight.quality.body"
  | "analysis.insight.validation.label"
  | "analysis.insight.validation.title"
  | "analysis.insight.validation.body"
  | "analysis.insight.execution.label"
  | "analysis.insight.execution.title"
  | "analysis.insight.execution.body"
  | "analysis.insight.backlog.label"
  | "analysis.insight.backlog.title"
  | "analysis.insight.backlog.body"
  | "analysis.insight.aiMode.label"
  | "analysis.insight.aiMode.title"
  | "analysis.insight.aiMode.body"
  | "analysis.insight.evidenceLoop.label"
  | "analysis.insight.evidenceLoop.title"
  | "analysis.insight.evidenceLoop.body"
  | "analysis.insight.decisionLayer.label"
  | "analysis.insight.decisionLayer.title"
  | "analysis.insight.decisionLayer.body"
  | "analysis.insight.targetUsers.label"
  | "analysis.insight.targetUsers.title"
  | "analysis.insight.targetUsers.body"
  | "analysis.insight.painMap.label"
  | "analysis.insight.painMap.title"
  | "analysis.insight.painMap.body"
  | "analysis.insight.mvpScope.label"
  | "analysis.insight.mvpScope.title"
  | "analysis.insight.mvpScope.body"
  | "analysis.insight.landingCopy.label"
  | "analysis.insight.landingCopy.title"
  | "analysis.insight.landingCopy.body"
  | "analysis.insight.featureBacklog.label"
  | "analysis.insight.featureBacklog.title"
  | "analysis.insight.featureBacklog.body"
  | "analysis.insight.pricing.label"
  | "analysis.insight.pricing.title"
  | "analysis.insight.pricing.body"
  | "analysis.insight.launchPlan.label"
  | "analysis.insight.launchPlan.title"
  | "analysis.insight.launchPlan.body"
  | "analysis.insight.assumptions.label"
  | "analysis.insight.assumptions.title"
  | "analysis.insight.assumptions.body"
  | "analysis.insight.pricingRisks.label"
  | "analysis.insight.pricingRisks.title"
  | "analysis.insight.pricingRisks.body"
  | "analysis.insight.contentCalendar.label"
  | "analysis.insight.contentCalendar.title"
  | "analysis.insight.contentCalendar.body"
  | "analysis.insight.executionTasks.label"
  | "analysis.insight.executionTasks.title"
  | "analysis.insight.executionTasks.body"
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
  | "sourceBrief.eyebrow"
  | "sourceBrief.heading"
  | "sourceBrief.body"
  | "sourceBrief.session"
  | "sourceBrief.opportunity"
  | "sourceBrief.risk"
  | "sourceBrief.reportReady"
  | "sourceBrief.reportUnavailable"
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
  | "shareExpiry.expiresSentence"
  | "rowExpiry.expired"
  | "rowExpiry.expiresIn"
  // Shared-snapshot expiry badge descriptor (formatExpiryBadge → ExpiryBadge)
  | "expiry.permanent"
  | "expiry.permanentTitle"
  | "expiry.tomorrow"
  | "expiry.tomorrowTitle"
  | "expiry.expiresYearsOne"
  | "expiry.expiresYearsMany"
  | "expiry.expiresMonthsOne"
  | "expiry.expiresMonthsMany"
  | "expiry.expiresWeeksOne"
  | "expiry.expiresWeeksMany"
  | "expiry.expiresDaysOne"
  | "expiry.expiresDaysMany"
  | "expiry.titlePrefix"
  // Public shared-workspace view (/share/[id] read-only page)
  | "shareView.skipToDecisions"
  | "shareView.brand"
  | "shareView.defaultHeadline"
  | "shareView.readonlySnapshot"
  | "shareView.readonlyPill"
  | "shareView.readonlyPillAria"
  | "shareView.readonlyPillTitle"
  | "shareView.readonlySr"
  | "shareView.openDemo"
  | "shareView.openDemoAria"
  | "shareView.generatedAt"
  | "shareView.sharedAt"
  | "shareView.generatedAtTitle"
  | "shareView.sharedAtTitle"
  | "shareView.targetUsers"
  | "shareView.painMap"
  | "shareView.mvpScope"
  | "shareView.landingCopy"
  | "shareView.featureBacklog"
  | "shareView.pricingHypothesis"
  | "shareView.launchPlan"
  | "shareView.executionTasks"
  | "shareView.validationDecisions"
  | "shareView.validationIntro"
  | "shareView.showingCount"
  | "shareView.archivedSuffix"
  | "shareView.hideArchived"
  | "shareView.showArchived"
  | "shareView.showArchivedCount"
  | "shareView.hideArchivedAria"
  | "shareView.showArchivedAria"
  | "shareView.hypothesisAria"
  | "shareView.archivedTag"
  | "shareView.archivedTagTitle"
  | "shareView.evidenceItems"
  | "shareView.evidenceItemSingular"
  | "shareView.confidenceLabel"
  | "shareView.decision"
  | "shareView.nextAction"
  | "shareView.linkedTask"
  | "shareView.pending"
  | "shareView.none"
  | "shareView.emptyActive"
  | "shareView.taskOwns"
  | "shareView.taskDue"
  | "provider.minimax"
  | "provider.openai"
  | "provider.mock"
  | "generationMode.real"
  | "generationMode.demo"
  // Decision recommendation labels (decisionLabel descriptor)
  | "decisionRec.proceed"
  | "decisionRec.iterate"
  | "decisionRec.pivot"
  | "decisionRec.pause"
  // Claim status labels (claimStatusLabel descriptor)
  | "claimStatus.untested"
  | "claimStatus.testing"
  | "claimStatus.supported"
  | "claimStatus.refuted"
  // Decision copilot (decision-copilot.tsx)
  | "copilot.evidenceInsufficient"
  | "copilot.evidenceMixed"
  | "copilot.evidenceDirectional"
  | "copilot.evidenceStrong"
  | "copilot.groundedClaims"
  | "copilot.claimsAria"
  | "copilot.citationOne"
  | "copilot.citationMany"
  | "copilot.claimAria"
  | "copilot.citationCountInline"
  | "copilot.sourceLabel"
  | "copilot.noneCited"
  | "copilot.noMatchingEvidence"
  | "copilot.title"
  | "copilot.subtitle"
  | "copilot.briefCount"
  | "copilot.evidenceBound"
  | "copilot.preparing"
  | "copilot.generateAllBriefs"
  | "copilot.cancelBatch"
  | "copilot.batchSrReady"
  | "copilot.batchGenerating"
  | "copilot.batchProgressAria"
  | "copilot.hypothesis"
  | "copilot.hypothesisOption"
  | "copilot.noHypothesis"
  | "copilot.evidence"
  | "copilot.confidence"
  | "copilot.lastGenerated"
  | "copilot.staleBadge"
  | "copilot.previousRecs"
  | "copilot.restoreAriaGroup"
  | "copilot.restoreNotice"
  | "copilot.restoreTitle"
  | "copilot.restoreAria"
  | "copilot.clearHistory"
  | "copilot.historyClearedNotice"
  | "copilot.generateTitle"
  | "copilot.synthesizing"
  | "copilot.regenerate"
  | "copilot.generate"
  | "copilot.cancelGeneration"
  | "copilot.changesToApply"
  | "copilot.applyRecommendation"
  | "copilot.recordEvidenceHint"
  | "copilot.evidenceChangedWarn"
  | "copilot.synthesizingAria"
  | "copilot.weighingSignals"
  | "copilot.fallbackTag"
  | "copilot.fallbackTagTitle"
  | "copilot.aiTag"
  | "copilot.aiTagTitle"
  | "copilot.demoTag"
  | "copilot.demoTagTitle"
  | "copilot.cited"
  | "copilot.evidenceStrength"
  | "copilot.evidenceStrengthAria"
  | "copilot.unresolvedRisks"
  | "copilot.noRisk"
  | "copilot.nextActions"
  | "copilot.noNextAction"
  | "copilot.emptyTitle"
  | "copilot.emptyBody"
  | "copilot.applyNotice"
  | "copilot.applySr"
  | "copilot.batchNoopNotice"
  | "copilot.batchStartSr"
  | "copilot.batchCancelledNotice"
  | "copilot.batchCancelledPending"
  | "copilot.batchSummaryNotice"
  | "copilot.batchFailedSr"
  | "copilot.batchMore"
  | "copilot.needEvidenceError"
  | "copilot.generatingSr"
  | "copilot.rateLimitError"
  | "copilot.parseError"
  | "copilot.genFailedError"
  | "copilot.genFailedSr"
  | "copilot.cancelledNotice"
  | "copilot.cancelledSr"
  | "copilot.realProviderLabel"
  | "copilot.demoLabel"
  | "copilot.fallbackNotice"
  | "copilot.realSavedNotice"
  | "copilot.fallbackSavedSr"
  | "copilot.realSavedSr"
  | "copilot.batchInProgressReason"
  | "copilot.waitSingleReason"
  | "copilot.noReadyReason"
  | "copilot.synthesizingReason"
  | "copilot.selectHypothesisReason"
  | "copilot.needEvidenceReason"
  | "copilot.fieldStatus"
  | "copilot.fieldDecision"
  | "copilot.fieldNextAction"
  | "copilot.emptyPlaceholder"
  | "vBoard.confirm.bulkDeleteHypTitle"
  | "vBoard.confirm.bulkDeleteHypBody"
  | "vBoard.confirm.bulkArchiveHypTitle"
  | "vBoard.confirm.bulkArchiveHypBody"
  | "vBoard.confirm.bulkDeleteEvidenceTitle"
  | "vBoard.confirm.bulkDeleteEvidenceBody"
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
  | "shortcut.desc.redo"
  // Toast chrome
  | "toastChrome.dismissAllAria"
  | "toastChrome.dismissAll"
  | "toastChrome.dismissAria"
  | "toastChrome.timeRemaining"
  // Confirm dialog
  | "confirm.cancel"
  // Copy link button
  | "copyLink.copiedAria"
  | "copyLink.copyAria"
  | "copyLink.copied"
  | "copyLink.copy"
  // System status
  | "status.srRestored"
  | "status.srLost"
  | "status.srRetrying"
  | "status.srCheckSucceeded"
  | "status.srCheckFailing"
  | "status.retrying"
  | "status.checking"
  | "status.offline"
  | "status.unreachable"
  | "status.operational"
  | "status.degraded"
  | "status.ariaLabel"
  | "status.detailsAria"
  | "status.endpointError"
  | "status.retry"
  | "status.noNetwork"
  | "status.aiProvider"
  | "status.mockDemo"
  | "status.cloudStorage"
  | "status.localOnly"
  | "status.healthy"
  | "status.unavailable"
  | "status.envPrefix"
  | "status.versionPrefix"
  | "status.contacting"
  // Command palette
  | "palette.placeholder"
  | "palette.cat.Actions"
  | "palette.cat.Navigate"
  | "palette.cat.WorkspaceContent"
  | "palette.cat.Other"
  | "palette.ariaLabel"
  | "palette.closeAria"
  | "palette.searchAria"
  | "palette.close"
  | "palette.noResults"
  | "palette.footerNavigate"
  | "palette.footerSelect"
  | "palette.footerToggle"
  // Shortcuts help (secondary help panel)
  | "helpHelp.ariaLabel"
  | "helpHelp.closeAria"
  | "helpHelp.title"
  | "helpHelp.close"
  | "helpHelp.quickGestures"
  | "helpHelp.toggleSelectMode"
  | "helpHelp.selectPill"
  | "helpHelp.filterTimeline"
  | "helpHelp.filterChips"
  | "helpHelp.reorder"
  | "helpHelp.dragHandle"
  // Validation board — filter bar
  | "vFilter.statusAll"
  | "vFilter.statusActive"
  | "vFilter.statusDecided"
  | "vFilter.ariaLabel"
  | "vFilter.tagsLabel"
  | "vFilter.anyTagTitle"
  | "vFilter.anyTag"
  | "vFilter.clearTagTitle"
  | "vFilter.filterTagTitle"
  | "vFilter.filterTagAria"
  | "vFilter.searchPlaceholder"
  | "vFilter.searchAria"
  | "vFilter.clearSearch"
  | "vFilter.sortTitle"
  | "vFilter.sortAria"
  | "vFilter.sortDefault"
  | "vFilter.sortConfidence"
  | "vFilter.sortStatus"
  | "vFilter.sortEvidence"
  // Validation board — bulk actions toolbar
  | "vBulk.ariaLabel"
  | "vBulk.selected"
  | "vBulk.shiftRange"
  | "vBulk.all"
  | "vBulk.markUntested"
  | "vBulk.markTesting"
  | "vBulk.markSupported"
  | "vBulk.markRefuted"
  | "vBulk.addTag"
  | "vBulk.addTagTitle"
  | "vBulk.noTagsYet"
  | "vBulk.newTagPlaceholder"
  | "vBulk.add"
  | "vBulk.removeTag"
  | "vBulk.removeTagTitle"
  | "vBulk.noTagsSelected"
  | "vBulk.removeTagPlaceholder"
  | "vBulk.remove"
  | "vBulk.briefsTitle"
  | "vBulk.briefs"
  | "vBulk.archive"
  | "vBulk.delete"
  | "vBulk.clear"
  // Validation board — history preview
  | "vHistory.confidence"
  | "vHistory.status"
  | "vHistory.ariaLabel"
  // Validation board — export menu
  | "vExport.ariaLabel"
  | "vExport.allTitle"
  | "vExport.export"
  | "vExport.copyMarkdown"
  | "vExport.downloadMarkdown"
  | "vExport.downloadJson"
  // Validation board — footer
  | "vFooter.tipPrefix"
  | "vFooter.tipSearchTo"
  | "vFooter.tipMultiTo"
  | "vFooter.tipHoldFor"
  | "vFooter.tipOr"
  | "vFooter.tipInSearch"
  | "vFooter.shortcutsPrefix"
  | "vFooter.shortcutsPalette"
  | "vFooter.shortcutsHelp"
  // Validation board — board body (validation-board.tsx)
  | "vBoard.sectionAria"
  | "vBoard.title"
  | "vBoard.subtitle"
  | "vBoard.progress"
  | "vBoard.evidenced"
  | "vBoard.decided"
  | "vBoard.weightsLabel"
  | "vBoard.weight.balanced"
  | "vBoard.weight.evidence"
  | "vBoard.weight.decision"
  | "vBoard.weight.balancedDesc"
  | "vBoard.weight.evidenceDesc"
  | "vBoard.weight.decisionDesc"
  | "vBoard.weightAria"
  | "vBoard.selectTitle"
  | "vBoard.selectLabel"
  | "vBoard.newHypothesis"
  | "vBoard.newShort"
  | "vBoard.newHypothesisLabel"
  | "vBoard.newHypothesisHint"
  | "vBoard.newHypothesisPlaceholder"
  | "vBoard.newHypothesisDup"
  | "vBoard.newHypothesisTooShort"
  | "vBoard.tagPlaceholder"
  | "vBoard.removeTagAria"
  | "vBoard.cancel"
  | "vBoard.addHypothesis"
  | "vBoard.emptyTitle"
  | "vBoard.emptyBody"
  | "vBoard.hypothesisAria"
  | "vBoard.gripAria"
  | "vBoard.gripTitle"
  | "vBoard.pinUnarchiveTitle"
  | "vBoard.pinUnpinTitle"
  | "vBoard.pinTitle"
  | "vBoard.pinUnpinAria"
  | "vBoard.pinAria"
  | "vBoard.statusAria"
  | "vBoard.statusTitle"
  | "vBoard.confidenceAria"
  | "vBoard.confidenceTitleManual"
  | "vBoard.confidenceTitleAuto"
  | "vBoard.confidenceManualLabel"
  | "vBoard.confidenceManualAria"
  | "vBoard.confidenceAuto"
  | "vBoard.confidenceAutoSuffix"
  | "vBoard.confidenceManualSuffix"
  | "vBoard.confidenceAutoEvidenceSuffix"
  | "vBoard.evidenceCountAria"
  | "vBoard.evidenceItem"
  | "vBoard.evidenceItems"
  | "vBoard.archiveTitle"
  | "vBoard.unarchiveTitle"
  | "vBoard.archiveAria"
  | "vBoard.unarchiveAria"
  | "vBoard.archiveSr"
  | "vBoard.unarchiveSr"
  | "vBoard.collapse"
  | "vBoard.review"
  | "vBoard.cancelEvidence"
  | "vBoard.addEvidence"
  | "vBoard.exportAria"
  | "vBoard.exportTitle"
  | "vBoard.removeHypothesisAria"
  | "vBoard.removeConfirm"
  | "vBoard.validationStatusLabel"
  | "vBoard.confidenceLabel"
  | "vBoard.confidenceHint"
  | "vBoard.linkedTaskLabel"
  | "vBoard.noLinkedTask"
  | "vBoard.chipShowAllSignal"
  | "vBoard.chipShowAllWeight"
  | "vBoard.resetFilters"
  | "vBoard.exitSelect"
  | "vBoard.select"
  | "vBoard.selectModeTitleExit"
  | "vBoard.selectModeTitle"
  | "vBoard.bulkEvidenceAria"
  | "vBoard.selectAllAria"
  | "vBoard.selectAllTitle"
  | "vBoard.clearSelAria"
  | "vBoard.clearSelTitle"
  | "vBoard.all"
  | "vBoard.proSupports"
  | "vBoard.proChallenges"
  | "vBoard.proNeutral"
  | "vBoard.weightCycleTitle"
  | "vBoard.weightCycleShort"
  | "vBoard.evidenceListAria"
  | "vBoard.noEvidence"
  | "vBoard.evidenceSourceAria"
  | "vBoard.evidenceLabel"
  | "vBoard.single"
  | "vBoard.bulkPaste"
  | "vBoard.snippetsLabel"
  | "vBoard.snippetTitle"
  | "vBoard.bulkPasteLabel"
  | "vBoard.bulkPlaceholder"
  | "vBoard.bulkHint"
  | "vBoard.bulkHintItems"
  | "vBoard.bulkHintAs"
  | "vBoard.bulkHintWeight"
  | "vBoard.bulkHintWeightExample"
  | "vBoard.addAll"
  | "vBoard.preview"
  | "vBoard.previewUntitled"
  | "vBoard.previewObservation"
  | "vBoard.signalLabel"
  | "vBoard.signalHint"
  | "vBoard.weightLabel"
  | "vBoard.weightHint"
  | "vBoard.sourceLabel"
  | "vBoard.observationLabel"
  | "vBoard.sourcePlaceholder"
  | "vBoard.observationPlaceholder"
  | "vBoard.save"
  | "vBoard.record"
  | "vBoard.decisionLabel"
  | "vBoard.decisionPlaceholder"
  | "vBoard.charactersSuffix"
  | "vBoard.nextActionLabel"
  | "vBoard.nextActionPlaceholder"
  // Enum display labels (status / signal / weight / confidence)
  | "vBoard.status.untested"
  | "vBoard.status.testing"
  | "vBoard.status.supported"
  | "vBoard.status.refuted"
  | "vBoard.signal.supports"
  | "vBoard.signal.challenges"
  | "vBoard.signal.neutral"
  | "vBoard.weight.strong"
  | "vBoard.weight.moderate"
  | "vBoard.weight.anecdotal"
  | "vBoard.confidence.low"
  | "vBoard.confidence.medium"
  | "vBoard.confidence.high"
  // Enum descriptions (tooltips)
  | "vBoard.statusDesc.untested"
  | "vBoard.statusDesc.testing"
  | "vBoard.statusDesc.supported"
  | "vBoard.statusDesc.refuted"
  | "vBoard.signalDesc.supports"
  | "vBoard.signalDesc.challenges"
  | "vBoard.signalDesc.neutral"
  | "vBoard.weightDesc.anecdotal"
  | "vBoard.weightDesc.moderate"
  | "vBoard.weightDesc.strong"
  | "vBoard.confidenceDesc.low"
  | "vBoard.confidenceDesc.medium"
  | "vBoard.confidenceDesc.high"
  | "vBoard.signalCycleTitle"
  | "vBoard.weightCycleHint"
  | "vBoard.archived"
  | "vBoard.openSourceAria"
  | "vBoard.moveEvidenceUpTitle"
  | "vBoard.moveEvidenceDownTitle"
  | "vBoard.moveEvidenceUpAria"
  | "vBoard.moveEvidenceDownAria"
  | "vBoard.unpinEvidenceTitle"
  | "vBoard.pinEvidenceTitle"
  | "vBoard.unpinEvidenceAria"
  | "vBoard.pinEvidenceAria"
  | "vBoard.duplicateEvidenceTitle"
  | "vBoard.duplicateEvidenceAria"
  | "vBoard.editEvidenceTitle"
  | "vBoard.editEvidenceAria"
  | "vBoard.confirmDeleteTitle"
  | "vBoard.confirmDeleteAria"
  | "vBoard.cancelDeleteTitle"
  | "vBoard.cancelDeleteAria"
  | "vBoard.removeEvidenceTitle"
  | "vBoard.removeEvidenceAria"
  | "vBoard.overflowAria"
  | "vBoard.overflowDuplicate"
  | "vBoard.overflowEdit"
  | "vBoard.overflowDelete"
  | "vBoard.dragReorder"
  // Evidence snippets (prefill templates)
  | "vBoard.snippet.interview"
  | "vBoard.snippet.survey"
  | "vBoard.snippet.review"
  | "vBoard.snippet.support"
  | "vBoard.snippet.analytics"
  | "vBoard.snippet.usability"
  | "vBoard.snippet.salesCall"
  | "vBoard.snippet.churn"
  // Validation-error / submit messages
  | "vBoard.err.sourceShort"
  | "vBoard.err.sourceLong"
  | "vBoard.err.noteShort"
  | "vBoard.err.noteLong"
  | "vBoard.err.pasteOneLine"
  | "vBoard.err.maxEvidence"
  | "vBoard.err.noValidLines"
  | "vBoard.err.fillSourceNote"
  | "vBoard.err.lengthLimits"
  | "vBoard.err.maxPerHypothesis"
  // SR announcements
  | "vBoard.sr.openEvidenceForm"
  | "vBoard.sr.openNewHypothesis"
  | "vBoard.sr.newHypothesis"
  | "vBoard.sr.signalChanged"
  | "vBoard.sr.weightChanged"
  | "vBoard.sr.evidenceMoved"
  | "vBoard.sr.evidenceReordered"
  | "vBoard.sr.hypothesisMovedUp"
  | "vBoard.sr.hypothesisMovedDown"
  | "vBoard.sr.evidenceRemoved"
  | "vBoard.sr.evidenceRestored"
  | "vBoard.sr.evidenceUpdated"
  | "vBoard.sr.evidenceRecorded"
  | "vBoard.sr.addedItems"
  | "vBoard.sr.hypothesisRemoved"
  | "vBoard.sr.hypothesisRestored"
  | "vBoard.sr.archived"
  | "vBoard.sr.unarchived"
  // Toast messages
  | "vBoard.toast.hypMdCopied"
  | "vBoard.toast.hypMdCopiedSr"
  | "vBoard.toast.clipboardFail"
  | "vBoard.toast.mdDownloaded"
  | "vBoard.toast.hypMdDownloadedSr"
  | "vBoard.toast.mdDownloadFail"
  | "vBoard.toast.jsonDownloaded"
  | "vBoard.toast.hypJsonDownloadedSr"
  | "vBoard.toast.jsonDownloadFail"
  | "vBoard.toast.boardMdCopied"
  | "vBoard.toast.boardMdCopiedSr"
  | "vBoard.toast.boardMdDownloadedSr"
  | "vBoard.toast.boardJsonDownloadedSr"
  | "vBoard.toast.bulkStatus"
  | "vBoard.toast.bulkArchived"
  | "vBoard.toast.bulkUnarchived"
  | "vBoard.toast.bulkTagAdded"
  | "vBoard.toast.bulkTagRemoved"
  | "vBoard.toast.bulkNoBriefs"
  | "vBoard.toast.bulkBriefSummary"
  | "vBoard.toast.bulkDeleted"
  | "vBoard.toast.evidenceDeleted"
  | "vBoard.toast.evidenceWeightSet"
  | "vBoard.toast.evidenceWeightCycle"
  | "vBoard.toast.evidenceSignalSet"
  | "vBoard.toast.evidenceRemoved"
  | "vBoard.toast.hypothesisRemoved"
  | "vBoard.toast.undo"
  | "vBoard.toast.undoLabel"
  | "vBoard.toast.redo"
  | "vBoard.toast.confidenceUpdated"
  | "vBoard.toast.confidenceChanged"
  | "vBoard.toast.addedItems"
  | "vBoard.sr.evidenceNotRecorded"
  | "vBoard.direction.up"
  | "vBoard.direction.down"
  // Confirm dialogs
  | "vBoard.confirm.deleteHypTitle"
  | "vBoard.confirm.deleteHypBody"
  | "vBoard.confirm.delete"
  | "vBoard.confirm.archiveHypTitle"
  | "vBoard.confirm.archiveHypBody"
  | "vBoard.confirm.archive"
  | "vBoard.confirm.deleteEvidenceTitle"
  | "vBoard.confirm.deleteEvidenceBody";

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
  "profile.sectionAria": "Output profile selector",
  "profile.eyebrow": "Output profile",
  "profile.title": "Choose the workspace density for this reader",
  "profile.body": "The underlying GTM workspace stays intact. The profile only changes how much operational detail, evidence workflow, and analyst tooling is shown.",
  "profile.idea.label": "Idea",
  "profile.idea.title": "Plain-language path",
  "profile.idea.description": "For individual builders who need the next usable steps without heavy metrics.",
  "profile.idea.audience": "Individual builders and first-time idea owners",
  "profile.idea.density": "Light",
  "profile.founder.label": "Founder",
  "profile.founder.title": "Execution workspace",
  "profile.founder.description": "For early teams that need validation, backlog, launch plan, and operating rhythm.",
  "profile.founder.audience": "Early teams preparing a real trial",
  "profile.founder.density": "Balanced",
  "profile.analyst.label": "Analyst",
  "profile.analyst.title": "Full evidence view",
  "profile.analyst.description": "For expert readers who expect risk, evidence, decision, and execution depth.",
  "profile.analyst.audience": "Analysts, investors, and expert reviewers",
  "profile.analyst.density": "Full",
  "profile.notice.idea": "Showing a simplified reader view. Editing still exposes the complete workspace.",
  "profile.notice.founder": "Balanced mode: enough evidence and execution depth for a real team trial.",
  "profile.notice.analyst": "Full-density mode: validation tools, decision copilot, risks, and operating artifacts are visible.",
  "profile.hiddenItems": "{count} advanced item(s) hidden in this reader view.",
  "profile.switchAnalyst": "Show full analyst view",
  "profile.integrityLabel": "Data-preserving renderer",
  "profile.integrityBody": "Switching profiles changes visible density only. Editing, export, and saved workspaces keep the complete GTM artifact.",
  "profile.audienceLabel": "Best for",
  "profile.densityLabel": "Density",
  "analysis.sectionAria": "Analysis companion",
  "analysis.eyebrow": "Companion",
  "analysis.title": "Explain what I am looking at",
  "analysis.toggleOn": "Enable",
  "analysis.toggleOff": "Disable",
  "analysis.enabledHelp": "Hover or focus a metric or workspace section to see how to interpret it.",
  "analysis.disabledHelp": "Turn this on when you want plain-language help reading the workspace without changing the data.",
  "analysis.guardrail.hover": "Hover/focus any highlighted section",
  "analysis.guardrail.noAi": "No extra AI call or data mutation",
  "analysis.profile": "Profile: {profile}",
  "analysis.insight.overview.label": "Guide",
  "analysis.insight.overview.title": "Turn on guided interpretation",
  "analysis.insight.overview.body": "This panel explains the current metric or section in context. It is intentionally deterministic: no extra AI call, no cost, and no risk of inventing facts.",
  "analysis.insight.profile.label": "Reader mode",
  "analysis.insight.profile.title": "Output profiles change density, not data",
  "analysis.insight.profile.body": "Use Idea for a plain-language path, Founder for operating work, and Analyst for full evidence depth. The saved workspace remains the same underneath.",
  "analysis.insight.quality.label": "Quality",
  "analysis.insight.quality.title": "Generated-structure health",
  "analysis.insight.quality.body": "This checks whether the generated workspace contains the expected strategic parts. A high score means the artifact is structurally complete, not that the market idea is proven.",
  "analysis.insight.validation.label": "Validation",
  "analysis.insight.validation.title": "How much of the plan has evidence",
  "analysis.insight.validation.body": "This measures whether assumptions have recorded evidence. Treat it as a reality-check meter: low validation means you should collect signal before committing resources.",
  "analysis.insight.execution.label": "Execution",
  "analysis.insight.execution.title": "Progress from plan to owned work",
  "analysis.insight.execution.body": "Execution counts completed launch tasks. It helps separate a useful plan from a static AI report that never becomes action.",
  "analysis.insight.backlog.label": "Backlog",
  "analysis.insight.backlog.title": "Feature work waiting for priority",
  "analysis.insight.backlog.body": "Backlog items are potential product work. They should stay tied to a pain, assumption, or launch goal; otherwise they become generic feature clutter.",
  "analysis.insight.aiMode.label": "AI mode",
  "analysis.insight.aiMode.title": "Provider and fallback transparency",
  "analysis.insight.aiMode.body": "This tells you whether the workspace came from a real provider or demo/mock mode. It is useful for trust and debugging, not for judging market quality.",
  "analysis.insight.evidenceLoop.label": "Evidence",
  "analysis.insight.evidenceLoop.title": "Where assumptions become decisions",
  "analysis.insight.evidenceLoop.body": "The validation loop is the audit trail: hypothesis, evidence, confidence, decision, and next action. It prevents the workspace from becoming unverifiable AI prose.",
  "analysis.insight.decisionLayer.label": "Decision",
  "analysis.insight.decisionLayer.title": "Evidence-grounded AI advice",
  "analysis.insight.decisionLayer.body": "The decision copilot summarizes only recorded evidence. Use it for synthesis, but keep responsibility for the final product judgment.",
  "analysis.insight.targetUsers.label": "Audience",
  "analysis.insight.targetUsers.title": "Who feels the pain strongly enough",
  "analysis.insight.targetUsers.body": "Target users should describe reachable people with a specific job, context, and reason to care. Vague audiences usually produce vague GTM advice.",
  "analysis.insight.painMap.label": "Pain",
  "analysis.insight.painMap.title": "The problem pressure behind adoption",
  "analysis.insight.painMap.body": "Pain map explains why the user would change behavior. Strong pains are frequent, expensive, urgent, or politically visible.",
  "analysis.insight.mvpScope.label": "MVP",
  "analysis.insight.mvpScope.title": "The smallest credible proof",
  "analysis.insight.mvpScope.body": "MVP scope should prove the core promise with minimal surface area. If it contains too many nice-to-have pieces, the first test becomes slow and noisy.",
  "analysis.insight.landingCopy.label": "Message",
  "analysis.insight.landingCopy.title": "How the promise is communicated",
  "analysis.insight.landingCopy.body": "Landing copy translates the strategy into user-facing language. Watch for claims that are specific, believable, and easy to test in interviews or ads.",
  "analysis.insight.featureBacklog.label": "Backlog",
  "analysis.insight.featureBacklog.title": "Future product bets",
  "analysis.insight.featureBacklog.body": "Feature backlog captures what could be built next. Prioritize P0/P1 only when the item advances validation, activation, revenue, or retention.",
  "analysis.insight.pricing.label": "Pricing",
  "analysis.insight.pricing.title": "A hypothesis about willingness to pay",
  "analysis.insight.pricing.body": "Pricing is not a final truth. Treat tiers as a testable story about buyer value, budget owner, and usage frequency.",
  "analysis.insight.launchPlan.label": "Launch",
  "analysis.insight.launchPlan.title": "The sequence for learning in public",
  "analysis.insight.launchPlan.body": "Launch plan should create evidence quickly: ship a small artifact, show it to the right people, and feed the learnings back into product scope.",
  "analysis.insight.assumptions.label": "Assumptions",
  "analysis.insight.assumptions.title": "The riskiest beliefs to test",
  "analysis.insight.assumptions.body": "Assumptions are the beliefs that could invalidate the plan. Good assumptions are falsifiable and tied to customer behavior, not internal opinions.",
  "analysis.insight.pricingRisks.label": "Risk",
  "analysis.insight.pricingRisks.title": "Where the business model can break",
  "analysis.insight.pricingRisks.body": "Pricing risks highlight why someone might not pay, renew, or expand. They are useful prompts for interviews and early conversion tests.",
  "analysis.insight.contentCalendar.label": "Content",
  "analysis.insight.contentCalendar.title": "Distribution experiments",
  "analysis.insight.contentCalendar.body": "Content calendar is a learning system, not just marketing output. Each angle should test language, channel fit, or audience urgency.",
  "analysis.insight.executionTasks.label": "Tasks",
  "analysis.insight.executionTasks.title": "Who owns the next proof step",
  "analysis.insight.executionTasks.body": "Execution tasks make the plan accountable. A good task has an owner, deadline, and outcome that creates evidence or moves the launch forward.",
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
  "sourceBrief.eyebrow": "Research provenance",
  "sourceBrief.heading": "Generated from Research Studio intelligence report",
  "sourceBrief.body": "This GTM workspace was seeded from an auditable research report. Use the source report to inspect assumptions, citations, opportunity score, and risk context.",
  "sourceBrief.session": "Session",
  "sourceBrief.opportunity": "Opportunity",
  "sourceBrief.risk": "Risk",
  "sourceBrief.reportReady": "Linked report",
  "sourceBrief.reportUnavailable": "Local brief only",
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
  "toastChrome.dismissAllAria": "Dismiss all notifications",
  "toastChrome.dismissAll": "Dismiss all",
  "toastChrome.dismissAria": "Dismiss notification",
  "toastChrome.timeRemaining": "Time remaining",
  "confirm.cancel": "Cancel",
  "copyLink.copiedAria": "Link copied",
  "copyLink.copyAria": "Copy share link",
  "copyLink.copied": "Copied",
  "copyLink.copy": "Copy link",
  "status.srRestored": "Network connection restored. Checking system status.",
  "status.srLost": "Network connection lost. Showing offline indicator.",
  "status.srRetrying": "Retrying system status check.",
  "status.srCheckSucceeded": "System status check succeeded.",
  "status.srCheckFailing": "System status check still failing.",
  "status.retrying": "Retrying...",
  "status.checking": "Checking...",
  "status.offline": "Offline",
  "status.unreachable": "Status unreachable",
  "status.operational": "All systems operational",
  "status.degraded": "Degraded mode",
  "status.ariaLabel": "System status",
  "status.detailsAria": "System status details",
  "status.endpointError": "Could not reach the status endpoint. The app may be offline or the server is restarting.",
  "status.retry": "Retry",
  "status.noNetwork": "Browser reports no network connection. Local draft and export still work.",
  "status.aiProvider": "AI Provider",
  "status.mockDemo": "Mock demo",
  "status.cloudStorage": "Cloud storage",
  "status.localOnly": "Local only",
  "status.healthy": "Healthy",
  "status.unavailable": "Unavailable",
  "status.envPrefix": "Environment: ",
  "status.versionPrefix": "Version: ",
  "status.contacting": "Contacting status endpoint...",
  "palette.placeholder": "Search or jump to...",
  "palette.cat.Actions": "Actions",
  "palette.cat.Navigate": "Navigate",
  "palette.cat.WorkspaceContent": "Workspace content",
  "palette.cat.Other": "Other",
  "palette.ariaLabel": "Command palette",
  "palette.closeAria": "Close command palette",
  "palette.searchAria": "Search commands",
  "palette.close": "Close",
  "palette.noResults": "No commands found for “{query}”",
  "palette.footerNavigate": "navigate",
  "palette.footerSelect": "select",
  "palette.footerToggle": "toggle",
  "helpHelp.ariaLabel": "Keyboard shortcuts",
  "helpHelp.closeAria": "Close shortcuts",
  "helpHelp.title": "Keyboard shortcuts",
  "helpHelp.close": "Close",
  "helpHelp.quickGestures": "Quick gestures",
  "helpHelp.toggleSelectMode": "Toggle hypothesis select mode for bulk actions",
  "helpHelp.selectPill": "Select pill",
  "helpHelp.filterTimeline": "Filter timeline by event kind",
  "helpHelp.filterChips": "Filter chips",
  "helpHelp.reorder": "Reorder hypotheses and evidence",
  "helpHelp.dragHandle": "Drag handle",
  "vFilter.statusAll": "All",
  "vFilter.statusActive": "Active",
  "vFilter.statusDecided": "Decided",
  "vFilter.ariaLabel": "Filter experiments by status",
  "vFilter.tagsLabel": "Tags:",
  "vFilter.anyTagTitle": "Show hypotheses with any tag",
  "vFilter.anyTag": "all",
  "vFilter.clearTagTitle": "Clear tag filter \"{tag}\"",
  "vFilter.filterTagTitle": "Filter to hypotheses tagged \"{tag}\" (click again to clear)",
  "vFilter.filterTagAria": "Filter by tag {tag}",
  "vFilter.searchPlaceholder": "Search...",
  "vFilter.searchAria": "Search hypotheses, evidence, tags",
  "vFilter.clearSearch": "Clear search",
  "vFilter.sortTitle": "Default: manual order. Highest confidence: high to low. By status: supported/testing/untested/refuted. Most evidence: evidence count descending.",
  "vFilter.sortAria": "Sort hypotheses",
  "vFilter.sortDefault": "Default order",
  "vFilter.sortConfidence": "Highest confidence",
  "vFilter.sortStatus": "By status",
  "vFilter.sortEvidence": "Most evidence",
  "vBulk.ariaLabel": "Bulk actions on selected hypotheses",
  "vBulk.selected": "selected",
  "vBulk.shiftRange": "Shift+click range",
  "vBulk.all": "All",
  "vBulk.markUntested": "Mark untested",
  "vBulk.markTesting": "Mark testing",
  "vBulk.markSupported": "Mark supported",
  "vBulk.markRefuted": "Mark refuted",
  "vBulk.addTag": "+ Tag",
  "vBulk.addTagTitle": "Add \"{tag}\" (used {count}x)",
  "vBulk.noTagsYet": "No existing tags yet.",
  "vBulk.newTagPlaceholder": "new or existing tag",
  "vBulk.add": "Add",
  "vBulk.removeTag": "- Tag",
  "vBulk.removeTagTitle": "Remove \"{tag}\"",
  "vBulk.noTagsSelected": "No tags on selected.",
  "vBulk.removeTagPlaceholder": "tag to remove",
  "vBulk.remove": "Remove",
  "vBulk.briefsTitle": "Generate decision briefs for selected hypotheses with evidence and no brief",
  "vBulk.briefs": "Briefs",
  "vBulk.archive": "Archive",
  "vBulk.delete": "Delete",
  "vBulk.clear": "Clear",
  "vHistory.confidence": "Confidence",
  "vHistory.status": "Status",
  "vHistory.ariaLabel": "Status over time",
  "vExport.ariaLabel": "Export validation board",
  "vExport.allTitle": "Export all hypotheses",
  "vExport.export": "Export",
  "vExport.copyMarkdown": "Copy Markdown",
  "vExport.downloadMarkdown": "Download Markdown",
  "vExport.downloadJson": "Download JSON",
  "vFooter.tipPrefix": "Tip: press ",
  "vFooter.tipSearchTo": " to search, ",
  "vFooter.tipMultiTo": " to multi-select, hold ",
  "vFooter.tipHoldFor": "+click a checkbox for range select, ",
  "vFooter.tipOr": " or ",
  "vFooter.tipInSearch": " in search.",
  "vFooter.shortcutsPrefix": "Shortcuts: ",
  "vFooter.shortcutsPalette": " command palette ",
  "vFooter.shortcutsHelp": " help",
  "vBoard.sectionAria": "Validation loop",
  "vBoard.title": "Validation loop",
  "vBoard.subtitle": "Turn generated assumptions into evidence-backed product decisions.",
  "vBoard.progress": "progress",
  "vBoard.evidenced": "evidenced",
  "vBoard.decided": "decided",
  "vBoard.weightsLabel": "Weights: {preset}",
  "vBoard.weight.balanced": "Balanced",
  "vBoard.weight.evidence": "Evidence-heavy",
  "vBoard.weight.decision": "Decision-heavy",
  "vBoard.weight.balancedDesc": "All checkpoints equal",
  "vBoard.weight.evidenceDesc": "Evidence gathering counts more",
  "vBoard.weight.decisionDesc": "Reaching conclusions counts more",
  "vBoard.weightAria": "Progress weight preset",
  "vBoard.selectTitle": "Select multiple hypotheses",
  "vBoard.selectLabel": "Select",
  "vBoard.newHypothesis": "New hypothesis",
  "vBoard.newShort": "New",
  "vBoard.newHypothesisLabel": "New hypothesis",
  "vBoard.newHypothesisHint": "At least 5 characters. Press Enter to add.",
  "vBoard.newHypothesisPlaceholder": "What assumption do you want to validate?",
  "vBoard.newHypothesisDup": "An identical hypothesis already exists.",
  "vBoard.newHypothesisTooShort": "Use at least 5 characters.",
  "vBoard.tagPlaceholder": "Add tags (press Enter to add, e.g. acquisition)",
  "vBoard.removeTagAria": "Remove tag {tag}",
  "vBoard.cancel": "Cancel",
  "vBoard.addHypothesis": "Add hypothesis",
  "vBoard.emptyTitle": "No validation experiments yet",
  "vBoard.emptyBody": "Generate a workspace to seed starter assumptions, or add new hypotheses once your brief is in place.",
  "vBoard.hypothesisAria": "Hypothesis {index}: {assumption}. Status: {status}. {count} evidence items.",
  "vBoard.gripAria": "Drag to reorder hypothesis (Alt+Up/Down to move)",
  "vBoard.gripTitle": "Drag to reorder (Alt+Up/Down when focused)",
  "vBoard.pinUnarchiveTitle": "Unarchive to pin",
  "vBoard.pinUnpinTitle": "Unpin hypothesis",
  "vBoard.pinTitle": "Pin hypothesis to top of default order",
  "vBoard.pinUnpinAria": "Unpin hypothesis: {assumption}",
  "vBoard.pinAria": "Pin hypothesis to top: {assumption}",
  "vBoard.statusAria": "Validation status: {status}. {desc}",
  "vBoard.statusTitle": "{desc}",
  "vBoard.confidenceAria": "Confidence: {confidence}. {desc}{mode}",
  "vBoard.confidenceTitleManual": "{desc} (manually set)",
  "vBoard.confidenceTitleAuto": "{desc} (auto from evidence)",
  "vBoard.confidenceManualLabel": "Manual",
  "vBoard.confidenceManualAria": "Reset confidence to auto-calculated",
  "vBoard.confidenceAuto": "Auto",
  "vBoard.confidenceAutoSuffix": "-auto",
  "vBoard.confidenceManualSuffix": "manually set",
  "vBoard.confidenceAutoEvidenceSuffix": "auto-computed from evidence",
  "vBoard.evidenceCountAria": "{count} evidence item{plural}",
  "vBoard.evidenceItem": "{count} evidence item",
  "vBoard.evidenceItems": "{count} evidence items",
  "vBoard.archiveTitle": "Archive hypothesis",
  "vBoard.unarchiveTitle": "Unarchive",
  "vBoard.archiveAria": "Archive hypothesis",
  "vBoard.unarchiveAria": "Unarchive",
  "vBoard.archiveSr": "Hypothesis archived.",
  "vBoard.unarchiveSr": "Hypothesis unarchived.",
  "vBoard.collapse": "Collapse",
  "vBoard.review": "Review",
  "vBoard.cancelEvidence": "Cancel",
  "vBoard.addEvidence": "Add evidence",
  "vBoard.exportAria": "Export hypothesis",
  "vBoard.exportTitle": "Export hypothesis",
  "vBoard.removeHypothesisAria": "Remove hypothesis",
  "vBoard.removeConfirm": "Remove this hypothesis? All evidence will be lost.",
  "vBoard.validationStatusLabel": "Validation status",
  "vBoard.confidenceLabel": "Confidence",
  "vBoard.confidenceHint": "Product judgment, not statistical certainty.",
  "vBoard.linkedTaskLabel": "Linked execution task",
  "vBoard.noLinkedTask": "No linked task",
  "vBoard.chipShowAllSignal": "Show all evidence",
  "vBoard.chipShowAllWeight": "Show all weights",
  "vBoard.resetFilters": "Reset filters",
  "vBoard.exitSelect": "Exit select",
  "vBoard.select": "Select",
  "vBoard.selectModeTitleExit": "Exit evidence select mode",
  "vBoard.selectModeTitle": "Select multiple evidence items",
  "vBoard.bulkEvidenceAria": "Bulk evidence actions for H{index}",
  "vBoard.selectAllAria": "Select all visible evidence",
  "vBoard.selectAllTitle": "Select all visible evidence",
  "vBoard.clearSelAria": "Clear selection",
  "vBoard.clearSelTitle": "Clear selection",
  "vBoard.all": "All",
  "vBoard.proSupports": "Pro supports",
  "vBoard.proChallenges": "Pro challenges",
  "vBoard.proNeutral": "Pro neutral",
  "vBoard.weightCycleTitle": "Tap to cycle weight: strong -> moderate -> anecdotal",
  "vBoard.weightCycleShort": "Wgt",
  "vBoard.evidenceListAria": "Evidence items",
  "vBoard.noEvidence": "No evidence recorded yet. Add an interview signal, metric, or market observation.",
  "vBoard.evidenceSourceAria": "Evidence source",
  "vBoard.evidenceLabel": "Evidence",
  "vBoard.single": "Single",
  "vBoard.bulkPaste": "Bulk paste",
  "vBoard.snippetsLabel": "Snippets:",
  "vBoard.snippetTitle": "Insert template: {source} - {note}",
  "vBoard.bulkPasteLabel": "Paste evidence (one per line)",
  "vBoard.bulkPlaceholder": "Format: [prefix] Source - Observation\nPrefix: + supports | - challenges | ~ neutral\nAppend s/m/a for weight: +s strong, +m moderate, +a anecdotal\nExamples:\n+s Interview #12 - Would pay  immediately\n- App review #45 - Crashes on launch\n+ Survey Q3 - 70% said feature is useful",
  "vBoard.bulkHint": "Will add ",
  "vBoard.bulkHintItems": " evidence items",
  "vBoard.bulkHintAs": " as {signal} ({weight} weight). Prefix per line: ",
  "vBoard.bulkHintWeight": " for signal, append ",
  "vBoard.bulkHintWeightExample": " for weight (e.g. ",
  "vBoard.addAll": "Add all",
  "vBoard.preview": "Preview",
  "vBoard.previewUntitled": "Untitled source",
  "vBoard.previewObservation": "Your observation will appear here...",
  "vBoard.signalLabel": "Signal",
  "vBoard.signalHint": "Choose the evidence signal strength for this validation finding.",
  "vBoard.weightLabel": "Weight",
  "vBoard.weightHint": "Choose the evidence weight / strength for this validation finding.",
  "vBoard.sourceLabel": "Source",
  "vBoard.observationLabel": "Observation",
  "vBoard.sourcePlaceholder": "Interview #5, Mixpanel, App Store review...",
  "vBoard.observationPlaceholder": "What did you learn? (Markdown supported: **bold**, *italic*, `code`, [link](url))",
  "vBoard.save": "Save",
  "vBoard.record": "Record",
  "vBoard.decisionLabel": "Decision",
  "vBoard.decisionPlaceholder": "What will change because of this evidence?",
  "vBoard.charactersSuffix": "{count}/800 characters",
  "vBoard.nextActionLabel": "Next validation action",
  "vBoard.nextActionPlaceholder": "What evidence should be collected next?",
  "vBoard.status.untested": "Untested",
  "vBoard.status.testing": "Testing",
  "vBoard.status.supported": "Supported",
  "vBoard.status.refuted": "Refuted",
  "vBoard.signal.supports": "Supports",
  "vBoard.signal.challenges": "Challenges",
  "vBoard.signal.neutral": "Neutral",
  "vBoard.weight.strong": "Strong",
  "vBoard.weight.moderate": "Moderate",
  "vBoard.weight.anecdotal": "Anecdotal",
  "vBoard.confidence.low": "Low",
  "vBoard.confidence.medium": "Medium",
  "vBoard.confidence.high": "High",
  "vBoard.statusDesc.untested": "Untested: no evidence has been collected yet.",
  "vBoard.statusDesc.testing": "Testing: evidence is actively being gathered.",
  "vBoard.statusDesc.supported": "Supported: the hypothesis is holding up against the evidence.",
  "vBoard.statusDesc.refuted": "Refuted: the evidence contradicts the hypothesis.",
  "vBoard.signalDesc.supports": "Supports: this evidence reinforces the hypothesis.",
  "vBoard.signalDesc.challenges": "Challenges: this evidence contradicts or weakens the hypothesis.",
  "vBoard.signalDesc.neutral": "Neutral: this evidence is informational, neither supporting nor contradicting.",
  "vBoard.weightDesc.anecdotal": "Anecdotal: a single story or hunch, not yet a pattern.",
  "vBoard.weightDesc.moderate": "Moderate: a pattern seen a few times but not yet conclusive.",
  "vBoard.weightDesc.strong": "Strong: repeated, high-quality signal across multiple sources.",
  "vBoard.confidenceDesc.low": "Low confidence: this is still a guess; more evidence is needed.",
  "vBoard.confidenceDesc.medium": "Medium confidence: some supporting evidence, but still uncertain.",
  "vBoard.confidenceDesc.high": "High confidence: strongly supported by the evidence collected so far.",
  "vBoard.signalCycleTitle": "{desc} (click to cycle: supports, challenges, neutral)",
  "vBoard.weightCycleHint": "{desc} (click to cycle)",
  "vBoard.archived": "Archived",
  "vBoard.openSourceAria": "Open source: {source}",
  "vBoard.moveEvidenceUpTitle": "Move evidence up",
  "vBoard.moveEvidenceDownTitle": "Move evidence down",
  "vBoard.moveEvidenceUpAria": "Move evidence from {source} up",
  "vBoard.moveEvidenceDownAria": "Move evidence from {source} down",
  "vBoard.unpinEvidenceTitle": "Unpin evidence",
  "vBoard.pinEvidenceTitle": "Pin to top",
  "vBoard.unpinEvidenceAria": "Unpin evidence from {source}",
  "vBoard.pinEvidenceAria": "Pin evidence from {source}",
  "vBoard.duplicateEvidenceTitle": "Duplicate evidence",
  "vBoard.duplicateEvidenceAria": "Duplicate evidence from {source}",
  "vBoard.editEvidenceTitle": "Edit evidence",
  "vBoard.editEvidenceAria": "Edit evidence from {source}",
  "vBoard.confirmDeleteTitle": "Confirm delete",
  "vBoard.confirmDeleteAria": "Confirm delete evidence from {source}",
  "vBoard.cancelDeleteTitle": "Cancel delete",
  "vBoard.cancelDeleteAria": "Cancel delete evidence",
  "vBoard.removeEvidenceTitle": "Remove evidence",
  "vBoard.removeEvidenceAria": "Remove evidence from {source}",
  "vBoard.overflowAria": "More actions for evidence from {source}",
  "vBoard.overflowDuplicate": "Duplicate",
  "vBoard.overflowEdit": "Edit",
  "vBoard.overflowDelete": "Delete",
  "vBoard.dragReorder": "Drag to reorder",
  "vBoard.snippet.interview": "Interview",
  "vBoard.snippet.survey": "Survey",
  "vBoard.snippet.review": "Review",
  "vBoard.snippet.support": "Support",
  "vBoard.snippet.analytics": "Analytics",
  "vBoard.snippet.usability": "Usability",
  "vBoard.snippet.salesCall": "Sales call",
  "vBoard.snippet.churn": "Churn",
  "vBoard.err.sourceShort": "Source needs at least 2 characters.",
  "vBoard.err.sourceLong": "Source is too long (max {max} characters).",
  "vBoard.err.noteShort": "Observation needs at least 8 characters.",
  "vBoard.err.noteLong": "Observation is too long (max {max} characters).",
  "vBoard.err.pasteOneLine": "Paste at least one evidence line.",
  "vBoard.err.maxEvidence": "Maximum 8 evidence items per hypothesis.",
  "vBoard.err.noValidLines": "No valid evidence lines found.",
  "vBoard.err.fillSourceNote": "Please fill in the source and observation before recording evidence.",
  "vBoard.err.lengthLimits": "Source and observation must be within length limits.",
  "vBoard.err.maxPerHypothesis": "Maximum 8 evidence items per hypothesis.",
  "vBoard.sr.openEvidenceForm": "Opening evidence form for first hypothesis.",
  "vBoard.sr.openNewHypothesis": "Opening new hypothesis form.",
  "vBoard.sr.newHypothesis": "New hypothesis added: {assumption}",
  "vBoard.sr.signalChanged": "Evidence signal changed to {signal}.",
  "vBoard.sr.weightChanged": "Evidence weight changed to {weight}.",
  "vBoard.sr.evidenceMoved": "Evidence moved {direction}: {source}.",
  "vBoard.sr.evidenceReordered": "Evidence reordered.",
  "vBoard.sr.hypothesisMovedUp": "Hypothesis moved up.",
  "vBoard.sr.hypothesisMovedDown": "Hypothesis moved down.",
  "vBoard.sr.evidenceRemoved": "Evidence from {source} removed. Press Ctrl+Z to undo.",
  "vBoard.sr.evidenceRestored": "Evidence from {source} restored.",
  "vBoard.sr.evidenceUpdated": "Evidence from {source} updated.",
  "vBoard.sr.evidenceRecorded": "Evidence recorded: {source}. {count} items total.",
  "vBoard.sr.addedItems": "Added {count} evidence items.",
  "vBoard.sr.hypothesisRemoved": "Hypothesis {assumption} removed.",
  "vBoard.sr.hypothesisRestored": "Hypothesis {assumption} restored.",
  "vBoard.sr.archived": "Hypothesis archived.",
  "vBoard.sr.unarchived": "Hypothesis unarchived.",
  "vBoard.toast.hypMdCopied": "Hypothesis markdown copied",
  "vBoard.toast.hypMdCopiedSr": "Hypothesis markdown copied to clipboard.",
  "vBoard.toast.clipboardFail": "Could not copy to clipboard",
  "vBoard.toast.mdDownloaded": "Markdown downloaded",
  "vBoard.toast.hypMdDownloadedSr": "Hypothesis markdown downloaded.",
  "vBoard.toast.mdDownloadFail": "Could not start markdown download",
  "vBoard.toast.jsonDownloaded": "JSON downloaded",
  "vBoard.toast.hypJsonDownloadedSr": "Hypothesis JSON downloaded.",
  "vBoard.toast.jsonDownloadFail": "Could not start JSON download",
  "vBoard.toast.boardMdCopied": "Validation board copied as markdown",
  "vBoard.toast.boardMdCopiedSr": "Validation board markdown copied to clipboard.",
  "vBoard.toast.boardMdDownloadedSr": "Validation board markdown downloaded.",
  "vBoard.toast.boardJsonDownloadedSr": "Validation board JSON downloaded.",
  "vBoard.toast.bulkStatus": "Set {count} hypotheses to {status}.",
  "vBoard.toast.bulkArchived": "Archived {count} hypotheses.",
  "vBoard.toast.bulkUnarchived": "Unarchived {count} hypotheses.",
  "vBoard.toast.bulkTagAdded": "Added tag \"{tag}\" to {count} hypotheses.",
  "vBoard.toast.bulkTagRemoved": "Removed tag \"{tag}\" from {count} hypotheses.",
  "vBoard.toast.bulkNoBriefs": "All selected hypotheses already have briefs or have no evidence.",
  "vBoard.toast.bulkBriefSummary": "Generated {success} brief{plural}{failed}.",
  "vBoard.toast.bulkDeleted": "Deleted {count} hypotheses.",
  "vBoard.toast.evidenceDeleted": "{count} evidence items deleted.",
  "vBoard.toast.evidenceWeightSet": "Set weight to {weight} on {count} items.",
  "vBoard.toast.evidenceWeightCycle": "Set {count} items to {weight} weight.",
  "vBoard.toast.evidenceSignalSet": "Set {count} items to {signal}.",
  "vBoard.toast.evidenceRemoved": "Evidence removed",
  "vBoard.toast.hypothesisRemoved": "Hypothesis removed",
  "vBoard.toast.undo": "Undo",
  "vBoard.toast.undoLabel": "Undo",
  "vBoard.toast.redo": "Redo",
  "vBoard.toast.confidenceUpdated": "Confidence updated: {old} -> {new}",
  "vBoard.toast.confidenceChanged": "Confidence changed from {old} to {new}",
  "vBoard.toast.addedItems": "Added {count} evidence items.",
  "vBoard.sr.evidenceNotRecorded": "Evidence not recorded. Please fill in the source and observation.",
  "vBoard.direction.up": "up",
  "vBoard.direction.down": "down",
  "vBoard.confirm.deleteHypTitle": "Delete selected hypotheses?",
  "vBoard.confirm.deleteHypBody": "{count} hypothesis and all their evidence will be permanently removed from this workspace. This can be undone right away via toast.",
  "vBoard.confirm.delete": "Delete",
  "vBoard.confirm.archiveHypTitle": "Archive selected hypotheses?",
  "vBoard.confirm.archiveHypBody": "{count} hypotheses will be hidden from the main list. You can restore them from the archive at any time.",
  "vBoard.confirm.archive": "Archive",
  "vBoard.confirm.deleteEvidenceTitle": "Delete selected evidence?",
  "vBoard.confirm.deleteEvidenceBody": "{count} evidence item(s) will be removed from this hypothesis. Confidence will be recomputed automatically.",
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
  "shareExpiry.expiresSentence": " {label}.",
  "rowExpiry.expired": "Expired",
  "rowExpiry.expiresIn": "Expires in {days}d",
  "expiry.permanent": "Permanent",
  "expiry.permanentTitle": "This shared link never expires",
  "expiry.tomorrow": "Expires tomorrow",
  "expiry.tomorrowTitle": "Expires within a day",
  "expiry.expiresYearsOne": "Expires in 1 year",
  "expiry.expiresYearsMany": "Expires in {n} years",
  "expiry.expiresMonthsOne": "Expires in 1 month",
  "expiry.expiresMonthsMany": "Expires in {n} months",
  "expiry.expiresWeeksOne": "Expires in 1 week",
  "expiry.expiresWeeksMany": "Expires in {n} weeks",
  "expiry.expiresDaysOne": "Expires in 1 day",
  "expiry.expiresDaysMany": "Expires in {n} days",
  "expiry.titlePrefix": "Expires ",
  "shareView.skipToDecisions": "Skip to validation decisions",
  "shareView.brand": "LaunchLens AI",
  "shareView.defaultHeadline": "Shared GTM workspace",
  "shareView.readonlySnapshot": "Read-only shared snapshot",
  "shareView.readonlyPill": "Read-only snapshot",
  "shareView.readonlyPillAria": "Read-only: view and export only",
  "shareView.readonlyPillTitle": "This shared snapshot is read-only. You can view, copy, or export the workspace, but edits are disabled.",
  "shareView.readonlySr": "This shared snapshot is read-only. View, copy, and export are enabled; edits are disabled.",
  "shareView.openDemo": "Open the demo",
  "shareView.openDemoAria": "Open the LaunchLens AI demo (leaves this read-only snapshot and opens the editor at the home page)",
  "shareView.generatedAt": "Generated {time}",
  "shareView.sharedAt": "Shared {time}",
  "shareView.generatedAtTitle": "Generated at {time}",
  "shareView.sharedAtTitle": "Shared at {time}",
  "shareView.targetUsers": "Target users",
  "shareView.painMap": "Pain map",
  "shareView.mvpScope": "MVP scope",
  "shareView.landingCopy": "Landing page copy",
  "shareView.featureBacklog": "Feature backlog",
  "shareView.pricingHypothesis": "Pricing hypothesis",
  "shareView.launchPlan": "Launch plan",
  "shareView.executionTasks": "Execution tasks",
  "shareView.validationDecisions": "Validation decisions",
  "shareView.validationIntro": "Evidence notes and sources remain private. This shared view shows decision state and evidence counts only.",
  "shareView.showingCount": "Showing {visible} of {total} hypotheses",
  "shareView.archivedSuffix": " ({count} archived)",
  "shareView.hideArchived": "Hide archived",
  "shareView.showArchived": "Show archived",
  "shareView.showArchivedCount": "Show archived ({count})",
  "shareView.hideArchivedAria": "Hide archived hypotheses",
  "shareView.showArchivedAria": "Show archived hypotheses",
  "shareView.hypothesisAria": "Hypothesis {index} of {total}: {assumption}{archived}",
  "shareView.archivedTag": "Archived",
  "shareView.archivedTagTitle": "This hypothesis has been archived by the owner.",
  "shareView.evidenceItems": "{count} evidence items",
  "shareView.evidenceItemSingular": "{count} evidence item",
  "shareView.confidenceLabel": "{confidence} confidence",
  "shareView.decision": "Decision",
  "shareView.nextAction": "Next action",
  "shareView.linkedTask": "Linked task",
  "shareView.pending": "Pending",
  "shareView.none": "None",
  "shareView.emptyActive": "No active hypotheses. Toggle “Show archived” above to view archived ones.",
  "shareView.taskOwns": "{owner} owns {outcome}.",
  "shareView.taskDue": "Due {due}.",
  "provider.minimax": "MiniMax provider",
  "provider.openai": "OpenAI-compatible provider",
  "provider.mock": "Demo mock provider",
  "generationMode.real": "Real provider",
  "generationMode.demo": "Demo mode",
  "decisionRec.proceed": "Proceed",
  "decisionRec.iterate": "Iterate",
  "decisionRec.pivot": "Pivot",
  "decisionRec.pause": "Pause",
  "claimStatus.untested": "Untested",
  "claimStatus.testing": "Testing",
  "claimStatus.supported": "Validated",
  "claimStatus.refuted": "Invalidated",
  "copilot.evidenceInsufficient": "Insufficient evidence",
  "copilot.evidenceMixed": "Mixed signals",
  "copilot.evidenceDirectional": "Directional evidence",
  "copilot.evidenceStrong": "Strong evidence",
  "copilot.groundedClaims": "Grounded claims",
  "copilot.claimsAria": "Evidence-grounded claims",
  "copilot.citationOne": "{count} citation",
  "copilot.citationMany": "{count} citations",
  "copilot.claimAria": "{stance} claim: {text}. {citation} from {sources}.",
  "copilot.citationCountInline": "{count} citation{plural}",
  "copilot.sourceLabel": "Source: {sources}",
  "copilot.noneCited": "none cited",
  "copilot.noMatchingEvidence": "No matching evidence records found.",
  "copilot.title": "AI decision copilot",
  "copilot.subtitle": "Synthesize only recorded evidence into a cautious recommendation, counter-signals, risks, and next actions.",
  "copilot.briefCount": "{count}/{total} current briefs",
  "copilot.evidenceBound": "Evidence-bound",
  "copilot.preparing": "Preparing...",
  "copilot.generateAllBriefs": "Generate all briefs",
  "copilot.cancelBatch": "Cancel batch generation",
  "copilot.batchSrReady": "Brief {done} of {total} ready: {name}",
  "copilot.batchGenerating": "Generating {done} of {total}",
  "copilot.batchProgressAria": "Batch generation progress",
  "copilot.hypothesis": "Hypothesis",
  "copilot.hypothesisOption": "H{index} | {count} evidence | {status}",
  "copilot.noHypothesis": "No hypothesis available",
  "copilot.evidence": "Evidence",
  "copilot.confidence": "Confidence",
  "copilot.lastGenerated": "Last generated {time}",
  "copilot.staleBadge": "Stale - evidence changed",
  "copilot.previousRecs": "Previous recommendations",
  "copilot.restoreAriaGroup": "Restore an earlier recommendation",
  "copilot.restoreNotice": "Restored recommendation v{version} from {time}.",
  "copilot.restoreTitle": "Restore: {rec} generated {time}",
  "copilot.restoreAria": "Restore {rec} recommendation generated {time}",
  "copilot.clearHistory": "Clear history",
  "copilot.historyClearedNotice": "Recommendation history cleared.",
  "copilot.generateTitle": "Generate decision brief",
  "copilot.synthesizing": "Synthesizing evidence",
  "copilot.regenerate": "Regenerate brief",
  "copilot.generate": "Generate decision brief",
  "copilot.cancelGeneration": "Cancel generation",
  "copilot.changesToApply": "Changes to apply",
  "copilot.applyRecommendation": "Apply recommendation",
  "copilot.recordEvidenceHint": "Record evidence in the validation loop before asking AI for a recommendation.",
  "copilot.evidenceChangedWarn": "Evidence changed after the last brief. Regenerate before using it.",
  "copilot.synthesizingAria": "Synthesizing evidence",
  "copilot.weighingSignals": "Weighing signals against counter-signals...",
  "copilot.fallbackTag": "Fallback",
  "copilot.fallbackTagTitle": "Real AI provider failed; this is a deterministic fallback brief.",
  "copilot.aiTag": "AI",
  "copilot.aiTagTitle": "Generated by real AI provider.",
  "copilot.demoTag": "Demo",
  "copilot.demoTagTitle": "Demo mode - deterministic brief, no AI used.",
  "copilot.cited": "{provider} | {count} cited",
  "copilot.evidenceStrength": "Evidence strength",
  "copilot.evidenceStrengthAria": "Evidence strength",
  "copilot.unresolvedRisks": "Unresolved risks",
  "copilot.noRisk": "No unresolved risk returned.",
  "copilot.nextActions": "Recommended next actions",
  "copilot.noNextAction": "No next action returned.",
  "copilot.emptyTitle": "Evidence first, AI second",
  "copilot.emptyBody": "The copilot cannot create evidence. It summarizes the selected experiment and cites only evidence IDs already present in the workspace.",
  "copilot.applyNotice": "Recommendation applied to hypothesis status and decision.",
  "copilot.applySr": "Recommendation applied.",
  "copilot.batchNoopNotice": "All hypotheses with evidence already have decision briefs.",
  "copilot.batchStartSr": "Generating {count} decision briefs. This will take a moment.",
  "copilot.batchCancelledNotice": "Batch generation cancelled. {success} of {total} briefs saved, {fail} failed{pending}.",
  "copilot.batchCancelledPending": ", {count} still pending",
  "copilot.batchSummaryNotice": "{success} of {total} briefs generated successfully.",
  "copilot.batchFailedSr": "{summary} {fail} failed: {listed}{extra}.",
  "copilot.batchMore": ", plus {count} more",
  "copilot.needEvidenceError": "Add at least one evidence item before generating a brief.",
  "copilot.generatingSr": "Generating decision brief. Please wait.",
  "copilot.rateLimitError": "Too many decision requests - wait a moment and retry.",
  "copilot.parseError": "The decision brief returned by the provider could not be parsed. Please retry.",
  "copilot.genFailedError": "Decision brief generation failed.",
  "copilot.genFailedSr": "Decision brief generation failed: {msg}",
  "copilot.cancelledNotice": "Generation cancelled.",
  "copilot.cancelledSr": "Generation cancelled.",
  "copilot.realProviderLabel": "Real-provider",
  "copilot.demoLabel": "Demo",
  "copilot.fallbackNotice": "The real provider failed, so a deterministic demo brief was saved.",
  "copilot.realSavedNotice": "{mode} decision brief saved.",
  "copilot.fallbackSavedSr": "Decision brief saved using demo fallback.",
  "copilot.realSavedSr": "{mode} decision brief generated and saved.",
  "copilot.batchInProgressReason": "Batch generation in progress.",
  "copilot.waitSingleReason": "Wait for the current single brief to finish.",
  "copilot.noReadyReason": "No hypotheses are ready (need evidence and no existing brief).",
  "copilot.synthesizingReason": "Brief is being synthesized.",
  "copilot.selectHypothesisReason": "Select a hypothesis to generate a brief.",
  "copilot.needEvidenceReason": "Record at least one piece of evidence before generating.",
  "copilot.fieldStatus": "Status",
  "copilot.fieldDecision": "Decision",
  "copilot.fieldNextAction": "Next action",
  "copilot.emptyPlaceholder": "(empty)",
  "vBoard.confirm.bulkDeleteHypTitle": "Delete selected hypotheses?",
  "vBoard.confirm.bulkDeleteHypBody": "{count} hypothesis and all their evidence will be permanently removed from this workspace. This can be undone right away via toast.",
  "vBoard.confirm.bulkArchiveHypTitle": "Archive selected hypotheses?",
  "vBoard.confirm.bulkArchiveHypBody": "{count} hypotheses will be hidden from the main list. You can restore them from the archive at any time.",
  "vBoard.confirm.bulkDeleteEvidenceTitle": "Delete selected evidence?",
  "vBoard.confirm.bulkDeleteEvidenceBody": "{count} evidence item(s) will be removed from this hypothesis. Confidence will be recomputed automatically.",
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
  "profile.sectionAria": "输出档位选择",
  "profile.eyebrow": "输出档位",
  "profile.title": "为当前读者选择合适的信息密度",
  "profile.body": "底层 GTM 工作台数据会完整保留。档位只改变展示的信息密度、证据工作流和分析工具露出。",
  "profile.idea.label": "想法个人",
  "profile.idea.title": "白话行动版",
  "profile.idea.description": "适合只有产品想法的个人，先看懂下一步，不被高级指标淹没。",
  "profile.idea.audience": "有想法的个人 / 第一次做产品的人",
  "profile.idea.density": "轻量",
  "profile.founder.label": "创始团队",
  "profile.founder.title": "执行工作台",
  "profile.founder.description": "适合早期团队，保留验证、待办、启动计划和运营节奏。",
  "profile.founder.audience": "准备真实试跑的早期团队",
  "profile.founder.density": "均衡",
  "profile.analyst.label": "分析师",
  "profile.analyst.title": "完整证据视图",
  "profile.analyst.description": "适合专业读者，展开风险、证据、决策和执行深度。",
  "profile.analyst.audience": "分析师、投资人和专业审阅者",
  "profile.analyst.density": "完整",
  "profile.notice.idea": "当前为简化阅读视图；进入编辑时仍会展示完整工作台。",
  "profile.notice.founder": "当前为均衡模式：适合真实团队试跑，兼顾证据和执行。",
  "profile.notice.analyst": "当前为高密度模式：验证工具、决策助手、风险和运营资产全部可见。",
  "profile.hiddenItems": "此阅读视图已隐藏 {count} 个进阶条目。",
  "profile.switchAnalyst": "切到完整分析视图",
  "profile.integrityLabel": "数据保真渲染",
  "profile.integrityBody": "切换档位只改变可见密度；编辑、导出和保存仍保留完整 GTM 工作台。",
  "profile.audienceLabel": "适合",
  "profile.densityLabel": "信息密度",
  "analysis.sectionAria": "辅助分析面板",
  "analysis.eyebrow": "辅助分析",
  "analysis.title": "解释我正在看的内容",
  "analysis.toggleOn": "开启",
  "analysis.toggleOff": "关闭",
  "analysis.enabledHelp": "将鼠标移到指标或工作台模块上，或用键盘聚焦，即可查看如何解读。",
  "analysis.disabledHelp": "当你想用白话理解工作台时开启它；它不会改变任何数据。",
  "analysis.guardrail.hover": "悬停/聚焦高亮模块即可解读",
  "analysis.guardrail.noAi": "不额外调用 AI，不改写数据",
  "analysis.profile": "档位：{profile}",
  "analysis.insight.overview.label": "引导",
  "analysis.insight.overview.title": "开启辅助解读",
  "analysis.insight.overview.body": "这个面板会解释当前指标或模块该怎么看。它是确定性的内置解释：不额外调用 AI、不增加成本，也不会编造事实。",
  "analysis.insight.profile.label": "读者模式",
  "analysis.insight.profile.title": "输出档位改变密度，不改变数据",
  "analysis.insight.profile.body": "想法个人适合白话行动路径，创始团队适合运营执行，分析师适合完整证据深度。底层保存的工作台数据保持一致。",
  "analysis.insight.quality.label": "质量",
  "analysis.insight.quality.title": "生成结构是否完整",
  "analysis.insight.quality.body": "它检查生成结果是否包含应有的战略组件。高分代表结构完整，不代表市场方向已经被证明。",
  "analysis.insight.validation.label": "验证",
  "analysis.insight.validation.title": "计划有多少已经被证据支撑",
  "analysis.insight.validation.body": "它衡量假设是否已经记录证据。可以把它当成现实校验表：验证低时，应先收集信号，再投入更多资源。",
  "analysis.insight.execution.label": "执行",
  "analysis.insight.execution.title": "从方案到有人负责的行动",
  "analysis.insight.execution.body": "执行指标统计已完成的启动任务。它帮助区分“有用的计划”和“只停在文案里的 AI 报告”。",
  "analysis.insight.backlog.label": "待办",
  "analysis.insight.backlog.title": "等待优先级判断的产品工作",
  "analysis.insight.backlog.body": "待办项是潜在产品工作。它们最好能对应痛点、假设或启动目标，否则容易变成功能堆砌。",
  "analysis.insight.aiMode.label": "AI 模式",
  "analysis.insight.aiMode.title": "供应商与降级透明度",
  "analysis.insight.aiMode.body": "它告诉你工作台来自真实模型还是演示/Mock 模式。它用于信任和调试，不用于判断市场质量。",
  "analysis.insight.evidenceLoop.label": "证据",
  "analysis.insight.evidenceLoop.title": "假设变成决策的地方",
  "analysis.insight.evidenceLoop.body": "证据循环是审计链：假设、证据、置信度、决策和下一步。它避免工作台变成不可验证的 AI 文案。",
  "analysis.insight.decisionLayer.label": "决策",
  "analysis.insight.decisionLayer.title": "基于证据的 AI 建议",
  "analysis.insight.decisionLayer.body": "决策助手只总结已记录证据。它适合做综合判断，但最终产品判断仍应由人负责。",
  "analysis.insight.targetUsers.label": "受众",
  "analysis.insight.targetUsers.title": "谁的痛感强到愿意行动",
  "analysis.insight.targetUsers.body": "目标用户应该是可触达的人群，并带有具体工作场景和在意原因。受众越泛，GTM 建议越容易泛。",
  "analysis.insight.painMap.label": "痛点",
  "analysis.insight.painMap.title": "推动采用的真实压力",
  "analysis.insight.painMap.body": "痛点地图解释用户为什么会改变行为。强痛点通常是高频、高成本、紧急或在组织里足够可见。",
  "analysis.insight.mvpScope.label": "MVP",
  "analysis.insight.mvpScope.title": "最小但可信的验证范围",
  "analysis.insight.mvpScope.body": "MVP 范围应以最小表面积证明核心承诺。如果包含太多锦上添花的功能，第一次测试会变慢且噪声很大。",
  "analysis.insight.landingCopy.label": "表达",
  "analysis.insight.landingCopy.title": "如何把承诺讲给用户听",
  "analysis.insight.landingCopy.body": "落地页文案把策略翻译成用户语言。重点看它是否具体、可信，并能在访谈或广告中快速测试。",
  "analysis.insight.featureBacklog.label": "待办",
  "analysis.insight.featureBacklog.title": "未来产品赌注",
  "analysis.insight.featureBacklog.body": "功能待办记录接下来可能建设的东西。只有当它推进验证、激活、收入或留存时，才值得进入 P0/P1。",
  "analysis.insight.pricing.label": "定价",
  "analysis.insight.pricing.title": "关于付费意愿的假设",
  "analysis.insight.pricing.body": "定价不是最终真理。把价格档位看成关于买方价值、预算归属和使用频率的可测试故事。",
  "analysis.insight.launchPlan.label": "启动",
  "analysis.insight.launchPlan.title": "公开学习的执行顺序",
  "analysis.insight.launchPlan.body": "启动计划应尽快制造证据：先交付小东西，给正确的人看，再把学习结果反馈到产品范围。",
  "analysis.insight.assumptions.label": "假设",
  "analysis.insight.assumptions.title": "最需要验证的关键信念",
  "analysis.insight.assumptions.body": "假设是可能推翻计划的信念。好的假设应可证伪，并且和客户行为相关，而不是内部观点。",
  "analysis.insight.pricingRisks.label": "风险",
  "analysis.insight.pricingRisks.title": "商业模式可能断裂的位置",
  "analysis.insight.pricingRisks.body": "定价风险提示用户为什么不付费、不续费或不扩张。它适合转化成访谈问题和早期转化测试。",
  "analysis.insight.contentCalendar.label": "内容",
  "analysis.insight.contentCalendar.title": "分发实验",
  "analysis.insight.contentCalendar.body": "内容日历不是单纯发帖计划，而是学习系统。每个角度都应测试语言、渠道匹配或受众紧迫感。",
  "analysis.insight.executionTasks.label": "任务",
  "analysis.insight.executionTasks.title": "谁负责下一步证明",
  "analysis.insight.executionTasks.body": "执行任务让计划变得可追责。好任务应该有负责人、截止时间，以及能制造证据或推进发布的产出。",
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
  "sourceBrief.eyebrow": "研究来源",
  "sourceBrief.heading": "基于 Research Studio 情报报告生成",
  "sourceBrief.body": "这个 GTM 工作台由可审计的研究报告启动。可回到来源报告查看假设、引用、机会分和风险背景。",
  "sourceBrief.session": "会话",
  "sourceBrief.opportunity": "机会",
  "sourceBrief.risk": "风险",
  "sourceBrief.reportReady": "已链接报告",
  "sourceBrief.reportUnavailable": "仅本地简报",
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
  "toastChrome.dismissAllAria": "关闭所有通知",
  "toastChrome.dismissAll": "全部关闭",
  "toastChrome.dismissAria": "关闭通知",
  "toastChrome.timeRemaining": "剩余时间",
  "confirm.cancel": "取消",
  "copyLink.copiedAria": "链接已复制",
  "copyLink.copyAria": "复制分享链接",
  "copyLink.copied": "已复制",
  "copyLink.copy": "复制链接",
  "status.srRestored": "网络连接已恢复。正在检查系统状态。",
  "status.srLost": "网络连接已断开。显示离线指示。",
  "status.srRetrying": "正在重试系统状态检查。",
  "status.srCheckSucceeded": "系统状态检查成功。",
  "status.srCheckFailing": "系统状态检查仍失败。",
  "status.retrying": "重试中……",
  "status.checking": "检查中……",
  "status.offline": "离线",
  "status.unreachable": "状态不可达",
  "status.operational": "所有系统运行正常",
  "status.degraded": "降级模式",
  "status.ariaLabel": "系统状态",
  "status.detailsAria": "系统状态详情",
  "status.endpointError": "无法连接状态端点。应用可能离线或服务器正在重启。",
  "status.retry": "重试",
  "status.noNetwork": "浏览器报告无网络连接。本地草稿与导出仍可使用。",
  "status.aiProvider": "AI 模型供应商",
  "status.mockDemo": "模拟演示",
  "status.cloudStorage": "云端存储",
  "status.localOnly": "仅本地",
  "status.healthy": "健康",
  "status.unavailable": "不可用",
  "status.envPrefix": "环境：",
  "status.versionPrefix": "版本：",
  "status.contacting": "正在联系状态端点……",
  "palette.placeholder": "搜索或跳转至……",
  "palette.cat.Actions": "操作",
  "palette.cat.Navigate": "导航",
  "palette.cat.WorkspaceContent": "工作台内容",
  "palette.cat.Other": "其他",
  "palette.ariaLabel": "命令面板",
  "palette.closeAria": "关闭命令面板",
  "palette.searchAria": "搜索命令",
  "palette.close": "关闭",
  "palette.noResults": "未找到与“{query}”匹配的命令",
  "palette.footerNavigate": "导航",
  "palette.footerSelect": "选择",
  "palette.footerToggle": "切换",
  "helpHelp.ariaLabel": "键盘快捷键",
  "helpHelp.closeAria": "关闭快捷键",
  "helpHelp.title": "键盘快捷键",
  "helpHelp.close": "关闭",
  "helpHelp.quickGestures": "快捷手势",
  "helpHelp.toggleSelectMode": "切换假设多选模式以进行批量操作",
  "helpHelp.selectPill": "选择药丸",
  "helpHelp.filterTimeline": "按事件类型筛选时间线",
  "helpHelp.filterChips": "筛选标签",
  "helpHelp.reorder": "重排假设与证据",
  "helpHelp.dragHandle": "拖拽手柄",
  "vFilter.statusAll": "全部",
  "vFilter.statusActive": "进行中",
  "vFilter.statusDecided": "已决策",
  "vFilter.ariaLabel": "按状态筛选实验",
  "vFilter.tagsLabel": "标签：",
  "vFilter.anyTagTitle": "显示含任意标签的假设",
  "vFilter.anyTag": "全部",
  "vFilter.clearTagTitle": "清除标签筛选「{tag}」",
  "vFilter.filterTagTitle": "筛选含标签「{tag}」的假设（再次点击清除）",
  "vFilter.filterTagAria": "按标签 {tag} 筛选",
  "vFilter.searchPlaceholder": "搜索……",
  "vFilter.searchAria": "搜索假设、证据、标签",
  "vFilter.clearSearch": "清除搜索",
  "vFilter.sortTitle": "默认：手动顺序。置信度最高：从高到低。按状态：已支持/测试中/未测试/已反驳。证据最多：证据数降序。",
  "vFilter.sortAria": "排序假设",
  "vFilter.sortDefault": "默认顺序",
  "vFilter.sortConfidence": "置信度最高",
  "vFilter.sortStatus": "按状态",
  "vFilter.sortEvidence": "证据最多",
  "vBulk.ariaLabel": "对选中假设进行批量操作",
  "vBulk.selected": "已选",
  "vBulk.shiftRange": "Shift+点击范围",
  "vBulk.all": "全选",
  "vBulk.markUntested": "标记未测试",
  "vBulk.markTesting": "标记测试中",
  "vBulk.markSupported": "标记已支持",
  "vBulk.markRefuted": "标记已反驳",
  "vBulk.addTag": "+ 标签",
  "vBulk.addTagTitle": "添加「{tag}」（已用 {count} 次）",
  "vBulk.noTagsYet": "暂无已有标签。",
  "vBulk.newTagPlaceholder": "新标签或已有标签",
  "vBulk.add": "添加",
  "vBulk.removeTag": "- 标签",
  "vBulk.removeTagTitle": "移除「{tag}」",
  "vBulk.noTagsSelected": "选中项无标签。",
  "vBulk.removeTagPlaceholder": "要移除的标签",
  "vBulk.remove": "移除",
  "vBulk.briefsTitle": "为含证据但无简报的选中假设生成决策简报",
  "vBulk.briefs": "简报",
  "vBulk.archive": "归档",
  "vBulk.delete": "删除",
  "vBulk.clear": "清除",
  "vHistory.confidence": "置信度",
  "vHistory.status": "状态",
  "vHistory.ariaLabel": "状态随时间变化",
  "vExport.ariaLabel": "导出验证板",
  "vExport.allTitle": "导出全部假设",
  "vExport.export": "导出",
  "vExport.copyMarkdown": "复制 Markdown",
  "vExport.downloadMarkdown": "下载 Markdown",
  "vExport.downloadJson": "下载 JSON",
  "vFooter.tipPrefix": "提示：按 ",
  "vFooter.tipSearchTo": " 搜索，按 ",
  "vFooter.tipMultiTo": " 多选，按住 ",
  "vFooter.tipHoldFor": "+点击复选框进行范围选择，",
  "vFooter.tipOr": " 或 ",
  "vFooter.tipInSearch": " 在搜索中使用。",
  "vFooter.shortcutsPrefix": "快捷键：",
  "vFooter.shortcutsPalette": " 命令面板 ",
  "vFooter.shortcutsHelp": " 帮助",
  "vBoard.sectionAria": "验证循环",
  "vBoard.title": "验证循环",
  "vBoard.subtitle": "将生成的假设转化为有证据支撑的产品决策。",
  "vBoard.progress": "进度",
  "vBoard.evidenced": "已取证",
  "vBoard.decided": "已决策",
  "vBoard.weightsLabel": "权重：{preset}",
  "vBoard.weight.balanced": "均衡",
  "vBoard.weight.evidence": "侧重证据",
  "vBoard.weight.decision": "侧重决策",
  "vBoard.weight.balancedDesc": "所有检查点同等重要",
  "vBoard.weight.evidenceDesc": "证据收集占比更高",
  "vBoard.weight.decisionDesc": "得出结论占比更高",
  "vBoard.weightAria": "进度权重预设",
  "vBoard.selectTitle": "多选假设",
  "vBoard.selectLabel": "选择",
  "vBoard.newHypothesis": "新建假设",
  "vBoard.newShort": "新建",
  "vBoard.newHypothesisLabel": "新建假设",
  "vBoard.newHypothesisHint": "至少 5 个字符，按 Enter 添加。",
  "vBoard.newHypothesisPlaceholder": "你想验证什么假设？",
  "vBoard.newHypothesisDup": "已存在相同的假设。",
  "vBoard.newHypothesisTooShort": "请至少使用 5 个字符。",
  "vBoard.tagPlaceholder": "添加标签（按 Enter 添加，例如 acquisition）",
  "vBoard.removeTagAria": "移除标签 {tag}",
  "vBoard.cancel": "取消",
  "vBoard.addHypothesis": "添加假设",
  "vBoard.emptyTitle": "暂无验证实验",
  "vBoard.emptyBody": "生成一个工作台以填充初始假设，或在简报就绪后手动添加新假设。",
  "vBoard.hypothesisAria": "假设 {index}：{assumption}。状态：{status}。{count} 条证据。",
  "vBoard.gripAria": "拖拽以重排假设（Alt+上/下移动）",
  "vBoard.gripTitle": "拖拽以重排（聚焦时按 Alt+上/下）",
  "vBoard.pinUnarchiveTitle": "取消归档后才能置顶",
  "vBoard.pinUnpinTitle": "取消置顶假设",
  "vBoard.pinTitle": "将假设置顶到默认顺序顶部",
  "vBoard.pinUnpinAria": "取消置顶假设：{assumption}",
  "vBoard.pinAria": "将假设置顶：{assumption}",
  "vBoard.statusAria": "验证状态：{status}。{desc}",
  "vBoard.statusTitle": "{desc}",
  "vBoard.confidenceAria": "置信度：{confidence}。{desc}{mode}",
  "vBoard.confidenceTitleManual": "{desc}（手动设置）",
  "vBoard.confidenceTitleAuto": "{desc}（根据证据自动）",
  "vBoard.confidenceManualLabel": "手动",
  "vBoard.confidenceManualAria": "将置信度重置为自动计算",
  "vBoard.confidenceAuto": "自动",
  "vBoard.confidenceAutoSuffix": "-自动",
  "vBoard.confidenceManualSuffix": "手动设置",
  "vBoard.confidenceAutoEvidenceSuffix": "由证据自动计算",
  "vBoard.evidenceCountAria": "{count} 条证据",
  "vBoard.evidenceItem": "{count} 条证据",
  "vBoard.evidenceItems": "{count} 条证据",
  "vBoard.archiveTitle": "归档假设",
  "vBoard.unarchiveTitle": "取消归档",
  "vBoard.archiveAria": "归档假设",
  "vBoard.unarchiveAria": "取消归档",
  "vBoard.archiveSr": "假设已归档。",
  "vBoard.unarchiveSr": "假设已取消归档。",
  "vBoard.collapse": "收起",
  "vBoard.review": "查看",
  "vBoard.cancelEvidence": "取消",
  "vBoard.addEvidence": "添加证据",
  "vBoard.exportAria": "导出假设",
  "vBoard.exportTitle": "导出假设",
  "vBoard.removeHypothesisAria": "移除假设",
  "vBoard.removeConfirm": "移除此假设？所有证据都将丢失。",
  "vBoard.validationStatusLabel": "验证状态",
  "vBoard.confidenceLabel": "置信度",
  "vBoard.confidenceHint": "产品判断，非统计意义上的确定性。",
  "vBoard.linkedTaskLabel": "关联执行任务",
  "vBoard.noLinkedTask": "未关联任务",
  "vBoard.chipShowAllSignal": "显示全部证据",
  "vBoard.chipShowAllWeight": "显示全部权重",
  "vBoard.resetFilters": "重置筛选",
  "vBoard.exitSelect": "退出选择",
  "vBoard.select": "选择",
  "vBoard.selectModeTitleExit": "退出证据多选模式",
  "vBoard.selectModeTitle": "多选证据",
  "vBoard.bulkEvidenceAria": "假设 H{index} 的批量证据操作",
  "vBoard.selectAllAria": "全选可见证据",
  "vBoard.selectAllTitle": "全选可见证据",
  "vBoard.clearSelAria": "清除选择",
  "vBoard.clearSelTitle": "清除选择",
  "vBoard.all": "全部",
  "vBoard.proSupports": "设为支持",
  "vBoard.proChallenges": "设为反对",
  "vBoard.proNeutral": "设为中性",
  "vBoard.weightCycleTitle": "点击循环权重：强 -> 中等 -> 轶事",
  "vBoard.weightCycleShort": "权重",
  "vBoard.evidenceListAria": "证据列表",
  "vBoard.noEvidence": "尚未记录证据。添加访谈信号、指标或市场观察。",
  "vBoard.evidenceSourceAria": "证据来源",
  "vBoard.evidenceLabel": "证据",
  "vBoard.single": "单条",
  "vBoard.bulkPaste": "批量粘贴",
  "vBoard.snippetsLabel": "模板：",
  "vBoard.snippetTitle": "插入模板：{source} - {note}",
  "vBoard.bulkPasteLabel": "粘贴证据（每行一条）",
  "vBoard.bulkPlaceholder": "格式：[前缀] 来源 - 观察\n前缀：+ 支持 | - 反对 | ~ 中性\n附加 s/m/a 表示权重：+s 强，+m 中等，+a 轶事\n示例：\n+s 访谈 #12 - 愿意付费\n- 应用评论 #45 - 启动即崩溃\n+ 调查 Q3 - 70% 认为功能有用",
  "vBoard.bulkHint": "将添加 ",
  "vBoard.bulkHintItems": " 条证据",
  "vBoard.bulkHintAs": "，作为 {signal}（{weight} 权重）。每行前缀：",
  "vBoard.bulkHintWeight": " 表示信号，附加 ",
  "vBoard.bulkHintWeightExample": " 表示权重（例如 ",
  "vBoard.addAll": "全部添加",
  "vBoard.preview": "预览",
  "vBoard.previewUntitled": "未命名来源",
  "vBoard.previewObservation": "你的观察将显示在这里……",
  "vBoard.signalLabel": "信号",
  "vBoard.signalHint": "为这条验证发现选择证据信号强度。",
  "vBoard.weightLabel": "权重",
  "vBoard.weightHint": "为这条验证发现选择证据权重 / 强度。",
  "vBoard.sourceLabel": "来源",
  "vBoard.observationLabel": "观察",
  "vBoard.sourcePlaceholder": "访谈 #5、Mixpanel、应用商店评论……",
  "vBoard.observationPlaceholder": "你了解到了什么？（支持 Markdown：**粗体**、*斜体*、`代码`、[链接](url)）",
  "vBoard.save": "保存",
  "vBoard.record": "记录",
  "vBoard.decisionLabel": "决策",
  "vBoard.decisionPlaceholder": "因为这些证据，接下来会改变什么？",
  "vBoard.charactersSuffix": "{count}/800 字符",
  "vBoard.nextActionLabel": "下一步验证行动",
  "vBoard.nextActionPlaceholder": "接下来应收集什么证据？",
  "vBoard.status.untested": "未测试",
  "vBoard.status.testing": "测试中",
  "vBoard.status.supported": "已验证",
  "vBoard.status.refuted": "已证伪",
  "vBoard.signal.supports": "支持",
  "vBoard.signal.challenges": "反对",
  "vBoard.signal.neutral": "中性",
  "vBoard.weight.strong": "强",
  "vBoard.weight.moderate": "中等",
  "vBoard.weight.anecdotal": "轶事",
  "vBoard.confidence.low": "低",
  "vBoard.confidence.medium": "中",
  "vBoard.confidence.high": "高",
  "vBoard.statusDesc.untested": "未测试：尚未收集任何证据。",
  "vBoard.statusDesc.testing": "测试中：正在积极收集证据。",
  "vBoard.statusDesc.supported": "已验证：假设经受住了证据的检验。",
  "vBoard.statusDesc.refuted": "已证伪：证据与假设相矛盾。",
  "vBoard.signalDesc.supports": "支持：此证据强化了假设。",
  "vBoard.signalDesc.challenges": "反对：此证据反驳或削弱了假设。",
  "vBoard.signalDesc.neutral": "中性：此证据仅供参考，既不支持也不反对。",
  "vBoard.weightDesc.anecdotal": "轶事：单个故事或直觉，尚未形成规律。",
  "vBoard.weightDesc.moderate": "中等：已多次出现的规律，但尚无定论。",
  "vBoard.weightDesc.strong": "强：来自多个来源、重复且高质量的信号。",
  "vBoard.confidenceDesc.low": "低置信度：目前仍是猜测，需要更多证据。",
  "vBoard.confidenceDesc.medium": "中置信度：有一些支持性证据，但仍不确定。",
  "vBoard.confidenceDesc.high": "高置信度：目前已收集的证据有力地支撑了假设。",
  "vBoard.signalCycleTitle": "{desc}（点击循环：支持、反对、中性）",
  "vBoard.weightCycleHint": "{desc}（点击循环）",
  "vBoard.archived": "已归档",
  "vBoard.openSourceAria": "打开来源：{source}",
  "vBoard.moveEvidenceUpTitle": "上移证据",
  "vBoard.moveEvidenceDownTitle": "下移证据",
  "vBoard.moveEvidenceUpAria": "上移来自 {source} 的证据",
  "vBoard.moveEvidenceDownAria": "下移来自 {source} 的证据",
  "vBoard.unpinEvidenceTitle": "取消置顶证据",
  "vBoard.pinEvidenceTitle": "置顶",
  "vBoard.unpinEvidenceAria": "取消置顶来自 {source} 的证据",
  "vBoard.pinEvidenceAria": "置顶来自 {source} 的证据",
  "vBoard.duplicateEvidenceTitle": "复制证据",
  "vBoard.duplicateEvidenceAria": "复制来自 {source} 的证据",
  "vBoard.editEvidenceTitle": "编辑证据",
  "vBoard.editEvidenceAria": "编辑来自 {source} 的证据",
  "vBoard.confirmDeleteTitle": "确认删除",
  "vBoard.confirmDeleteAria": "确认删除来自 {source} 的证据",
  "vBoard.cancelDeleteTitle": "取消删除",
  "vBoard.cancelDeleteAria": "取消删除证据",
  "vBoard.removeEvidenceTitle": "移除证据",
  "vBoard.removeEvidenceAria": "移除来自 {source} 的证据",
  "vBoard.overflowAria": "来自 {source} 证据的更多操作",
  "vBoard.overflowDuplicate": "复制",
  "vBoard.overflowEdit": "编辑",
  "vBoard.overflowDelete": "删除",
  "vBoard.dragReorder": "拖拽以重排",
  "vBoard.snippet.interview": "访谈",
  "vBoard.snippet.survey": "调查",
  "vBoard.snippet.review": "评论",
  "vBoard.snippet.support": "客服",
  "vBoard.snippet.analytics": "分析",
  "vBoard.snippet.usability": "可用性",
  "vBoard.snippet.salesCall": "销售通话",
  "vBoard.snippet.churn": "流失",
  "vBoard.err.sourceShort": "来源至少需要 2 个字符。",
  "vBoard.err.sourceLong": "来源过长（最多 {max} 个字符）。",
  "vBoard.err.noteShort": "观察至少需要 8 个字符。",
  "vBoard.err.noteLong": "观察过长（最多 {max} 个字符）。",
  "vBoard.err.pasteOneLine": "请至少粘贴一行证据。",
  "vBoard.err.maxEvidence": "每个假设最多 8 条证据。",
  "vBoard.err.noValidLines": "未找到有效的证据行。",
  "vBoard.err.fillSourceNote": "请在记录证据前填写来源与观察。",
  "vBoard.err.lengthLimits": "来源与观察须在长度限制内。",
  "vBoard.err.maxPerHypothesis": "每个假设最多 8 条证据。",
  "vBoard.sr.openEvidenceForm": "正在打开首个假设的证据表单。",
  "vBoard.sr.openNewHypothesis": "正在打开新建假设表单。",
  "vBoard.sr.newHypothesis": "已添加新假设：{assumption}",
  "vBoard.sr.signalChanged": "证据信号已改为 {signal}。",
  "vBoard.sr.weightChanged": "证据权重已改为 {weight}。",
  "vBoard.sr.evidenceMoved": "证据已{direction}移：{source}。",
  "vBoard.sr.evidenceReordered": "证据已重新排序。",
  "vBoard.sr.hypothesisMovedUp": "假设已上移。",
  "vBoard.sr.hypothesisMovedDown": "假设已下移。",
  "vBoard.sr.evidenceRemoved": "来自 {source} 的证据已移除。按 Ctrl+Z 可撤销。",
  "vBoard.sr.evidenceRestored": "来自 {source} 的证据已恢复。",
  "vBoard.sr.evidenceUpdated": "来自 {source} 的证据已更新。",
  "vBoard.sr.evidenceRecorded": "已记录证据：{source}。共 {count} 条。",
  "vBoard.sr.addedItems": "已添加 {count} 条证据。",
  "vBoard.sr.hypothesisRemoved": "假设「{assumption}」已移除。",
  "vBoard.sr.hypothesisRestored": "假设「{assumption}」已恢复。",
  "vBoard.sr.archived": "假设已归档。",
  "vBoard.sr.unarchived": "假设已取消归档。",
  "vBoard.toast.hypMdCopied": "假设 Markdown 已复制",
  "vBoard.toast.hypMdCopiedSr": "假设 Markdown 已复制到剪贴板。",
  "vBoard.toast.clipboardFail": "无法复制到剪贴板",
  "vBoard.toast.mdDownloaded": "Markdown 已下载",
  "vBoard.toast.hypMdDownloadedSr": "假设 Markdown 已下载。",
  "vBoard.toast.mdDownloadFail": "无法开始 Markdown 下载",
  "vBoard.toast.jsonDownloaded": "JSON 已下载",
  "vBoard.toast.hypJsonDownloadedSr": "假设 JSON 已下载。",
  "vBoard.toast.jsonDownloadFail": "无法开始 JSON 下载",
  "vBoard.toast.boardMdCopied": "验证板已复制为 Markdown",
  "vBoard.toast.boardMdCopiedSr": "验证板 Markdown 已复制到剪贴板。",
  "vBoard.toast.boardMdDownloadedSr": "验证板 Markdown 已下载。",
  "vBoard.toast.boardJsonDownloadedSr": "验证板 JSON 已下载。",
  "vBoard.toast.bulkStatus": "已将 {count} 条假设设为 {status}。",
  "vBoard.toast.bulkArchived": "已归档 {count} 条假设。",
  "vBoard.toast.bulkUnarchived": "已取消归档 {count} 条假设。",
  "vBoard.toast.bulkTagAdded": "已为 {count} 条假设添加标签「{tag}」。",
  "vBoard.toast.bulkTagRemoved": "已从 {count} 条假设移除标签「{tag}」。",
  "vBoard.toast.bulkNoBriefs": "所有选中的假设都已有简报或无证据。",
  "vBoard.toast.bulkBriefSummary": "已生成 {success} 份简报{plural}{failed}。",
  "vBoard.toast.bulkDeleted": "已删除 {count} 条假设。",
  "vBoard.toast.evidenceDeleted": "已删除 {count} 条证据。",
  "vBoard.toast.evidenceWeightSet": "已将 {count} 条的权重设为 {weight}。",
  "vBoard.toast.evidenceWeightCycle": "已将 {count} 条的权重设为 {weight}。",
  "vBoard.toast.evidenceSignalSet": "已将 {count} 条设为 {signal}。",
  "vBoard.toast.evidenceRemoved": "证据已移除",
  "vBoard.toast.hypothesisRemoved": "假设已移除",
  "vBoard.toast.undo": "撤销",
  "vBoard.toast.undoLabel": "撤销",
  "vBoard.toast.redo": "重做",
  "vBoard.toast.confidenceUpdated": "置信度已更新：{old} -> {new}",
  "vBoard.toast.confidenceChanged": "置信度已从 {old} 变为 {new}",
  "vBoard.toast.addedItems": "已添加 {count} 条证据。",
  "vBoard.sr.evidenceNotRecorded": "证据未记录。请填写来源和观察。",
  "vBoard.direction.up": "上",
  "vBoard.direction.down": "下",
  "vBoard.confirm.deleteHypTitle": "删除选中的假设？",
  "vBoard.confirm.deleteHypBody": "{count} 条假设及其所有证据将从此工作台永久移除。可立即通过通知撤销。",
  "vBoard.confirm.delete": "删除",
  "vBoard.confirm.archiveHypTitle": "归档选中的假设？",
  "vBoard.confirm.archiveHypBody": "{count} 条假设将从主列表中隐藏。你可随时从归档中恢复它们。",
  "vBoard.confirm.archive": "归档",
  "vBoard.confirm.deleteEvidenceTitle": "删除选中的证据？",
  "vBoard.confirm.deleteEvidenceBody": "{count} 条证据将从此假设中移除。置信度将自动重新计算。",
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
  "shareExpiry.expiresSentence": " {label}。",
  "rowExpiry.expired": "已过期",
  "rowExpiry.expiresIn": "{days}天后过期",
  "expiry.permanent": "永久有效",
  "expiry.permanentTitle": "此分享链接永不过期",
  "expiry.tomorrow": "明天过期",
  "expiry.tomorrowTitle": "一天内过期",
  "expiry.expiresYearsOne": "1 年后过期",
  "expiry.expiresYearsMany": "{n} 年后过期",
  "expiry.expiresMonthsOne": "1 个月后过期",
  "expiry.expiresMonthsMany": "{n} 个月后过期",
  "expiry.expiresWeeksOne": "1 周后过期",
  "expiry.expiresWeeksMany": "{n} 周后过期",
  "expiry.expiresDaysOne": "1 天后过期",
  "expiry.expiresDaysMany": "{n} 天后过期",
  "expiry.titlePrefix": "过期时间 ",
  "shareView.skipToDecisions": "跳转到验证决策",
  "shareView.brand": "LaunchLens AI",
  "shareView.defaultHeadline": "共享 GTM 工作台",
  "shareView.readonlySnapshot": "只读共享快照",
  "shareView.readonlyPill": "只读快照",
  "shareView.readonlyPillAria": "只读：仅可查看与导出",
  "shareView.readonlyPillTitle": "此共享快照为只读。你可以查看、复制或导出工作台，但不能编辑。",
  "shareView.readonlySr": "此共享快照为只读。可查看、复制与导出；编辑功能已关闭。",
  "shareView.openDemo": "打开 Demo",
  "shareView.openDemoAria": "打开 LaunchLens AI 演示（离开此只读快照并打开首页编辑器）",
  "shareView.generatedAt": "生成于 {time}",
  "shareView.sharedAt": "分享于 {time}",
  "shareView.generatedAtTitle": "生成于 {time}",
  "shareView.sharedAtTitle": "分享于 {time}",
  "shareView.targetUsers": "目标用户",
  "shareView.painMap": "痛点地图",
  "shareView.mvpScope": "MVP 范围",
  "shareView.landingCopy": "落地页文案",
  "shareView.featureBacklog": "功能待办",
  "shareView.pricingHypothesis": "定价假设",
  "shareView.launchPlan": "发布计划",
  "shareView.executionTasks": "执行任务",
  "shareView.validationDecisions": "验证决策",
  "shareView.validationIntro": "证据笔记与来源保持私密。此共享视图仅显示决策状态与证据计数。",
  "shareView.showingCount": "显示 {visible} / {total} 条假设",
  "shareView.archivedSuffix": "（{count} 条已归档）",
  "shareView.hideArchived": "隐藏已归档",
  "shareView.showArchived": "显示已归档",
  "shareView.showArchivedCount": "显示已归档（{count}）",
  "shareView.hideArchivedAria": "隐藏已归档假设",
  "shareView.showArchivedAria": "显示已归档假设",
  "shareView.hypothesisAria": "假设 {index} / {total}：{assumption}{archived}",
  "shareView.archivedTag": "已归档",
  "shareView.archivedTagTitle": "此假设已被所有者归档。",
  "shareView.evidenceItems": "{count} 条证据",
  "shareView.evidenceItemSingular": "{count} 条证据",
  "shareView.confidenceLabel": "{confidence} 置信度",
  "shareView.decision": "决策",
  "shareView.nextAction": "下一步行动",
  "shareView.linkedTask": "关联任务",
  "shareView.pending": "待定",
  "shareView.none": "无",
  "shareView.emptyActive": "暂无活跃假设。点击上方「显示已归档」可查看已归档内容。",
  "shareView.taskOwns": "{owner} 负责 {outcome}。",
  "shareView.taskDue": "截止 {due}。",
  "provider.minimax": "MiniMax 模型供应商",
  "provider.openai": "OpenAI 兼容模型供应商",
  "provider.mock": "演示 Mock 模型供应商",
  "generationMode.real": "真实供应商",
  "generationMode.demo": "演示模式",
  "decisionRec.proceed": "推进",
  "decisionRec.iterate": "迭代",
  "decisionRec.pivot": "转向",
  "decisionRec.pause": "暂停",
  "claimStatus.untested": "未测试",
  "claimStatus.testing": "测试中",
  "claimStatus.supported": "已验证",
  "claimStatus.refuted": "已证伪",
  "copilot.evidenceInsufficient": "证据不足",
  "copilot.evidenceMixed": "信号混合",
  "copilot.evidenceDirectional": "方向性证据",
  "copilot.evidenceStrong": "强证据",
  "copilot.groundedClaims": "证据支撑的主张",
  "copilot.claimsAria": "证据支撑的主张",
  "copilot.citationOne": "{count} 条引用",
  "copilot.citationMany": "{count} 条引用",
  "copilot.claimAria": "{stance} 主张：{text}。{citation}，来源：{sources}。",
  "copilot.citationCountInline": "{count} 条引用",
  "copilot.sourceLabel": "来源：{sources}",
  "copilot.noneCited": "未引用来源",
  "copilot.noMatchingEvidence": "未找到匹配的证据记录。",
  "copilot.title": "AI 决策助手",
  "copilot.subtitle": "仅基于已记录的证据，合成审慎的建议、反信号、风险与下一步行动。",
  "copilot.briefCount": "{count}/{total} 份当前简报",
  "copilot.evidenceBound": "受证据约束",
  "copilot.preparing": "准备中…",
  "copilot.generateAllBriefs": "生成全部简报",
  "copilot.cancelBatch": "取消批量生成",
  "copilot.batchSrReady": "简报 {done}/{total} 已就绪：{name}",
  "copilot.batchGenerating": "正在生成 {done}/{total}",
  "copilot.batchProgressAria": "批量生成进度",
  "copilot.hypothesis": "假设",
  "copilot.hypothesisOption": "H{index} | {count} 条证据 | {status}",
  "copilot.noHypothesis": "暂无假设",
  "copilot.evidence": "证据",
  "copilot.confidence": "置信度",
  "copilot.lastGenerated": "上次生成于 {time}",
  "copilot.staleBadge": "已过期 - 证据已变更",
  "copilot.previousRecs": "历史建议",
  "copilot.restoreAriaGroup": "恢复较早的建议",
  "copilot.restoreNotice": "已从 {time} 恢复建议 v{version}。",
  "copilot.restoreTitle": "恢复：{rec}，生成于 {time}",
  "copilot.restoreAria": "恢复 {rec} 建议，生成于 {time}",
  "copilot.clearHistory": "清除历史",
  "copilot.historyClearedNotice": "建议历史已清除。",
  "copilot.generateTitle": "生成决策简报",
  "copilot.synthesizing": "正在合成证据",
  "copilot.regenerate": "重新生成简报",
  "copilot.generate": "生成决策简报",
  "copilot.cancelGeneration": "取消生成",
  "copilot.changesToApply": "将应用的变更",
  "copilot.applyRecommendation": "应用建议",
  "copilot.recordEvidenceHint": "在验证循环中先记录证据，再让 AI 给出建议。",
  "copilot.evidenceChangedWarn": "上次简报后证据已变更，请先重新生成再使用。",
  "copilot.synthesizingAria": "正在合成证据",
  "copilot.weighingSignals": "正在权衡信号与反信号…",
  "copilot.fallbackTag": "兜底",
  "copilot.fallbackTagTitle": "真实 AI 供应商失败；此为确定性兜底简报。",
  "copilot.aiTag": "AI",
  "copilot.aiTagTitle": "由真实 AI 供应商生成。",
  "copilot.demoTag": "演示",
  "copilot.demoTagTitle": "演示模式 - 确定性简报，未使用 AI。",
  "copilot.cited": "{provider} | {count} 条引用",
  "copilot.evidenceStrength": "证据强度",
  "copilot.evidenceStrengthAria": "证据强度",
  "copilot.unresolvedRisks": "未解决的风险",
  "copilot.noRisk": "无未解决的风险。",
  "copilot.nextActions": "建议的下一步行动",
  "copilot.noNextAction": "无下一步行动。",
  "copilot.emptyTitle": "先证据，后 AI",
  "copilot.emptyBody": "助手无法创造证据。它仅总结所选实验，并只引用工作台中已存在的证据 ID。",
  "copilot.applyNotice": "建议已应用到假设状态与决策。",
  "copilot.applySr": "建议已应用。",
  "copilot.batchNoopNotice": "所有含证据的假设都已有决策简报。",
  "copilot.batchStartSr": "正在生成 {count} 份决策简报，请稍候。",
  "copilot.batchCancelledNotice": "批量生成已取消。{success}/{total} 份简报已保存，{fail} 份失败{pending}。",
  "copilot.batchCancelledPending": "，{count} 份仍在等待",
  "copilot.batchSummaryNotice": "{success}/{total} 份简报生成成功。",
  "copilot.batchFailedSr": "{summary} {fail} 份失败：{listed}{extra}。",
  "copilot.batchMore": "，另有 {count} 份",
  "copilot.needEvidenceError": "生成简报前请至少添加一条证据。",
  "copilot.generatingSr": "正在生成决策简报，请稍候。",
  "copilot.rateLimitError": "决策请求过多 - 请稍候再试。",
  "copilot.parseError": "供应商返回的决策简报无法解析，请重试。",
  "copilot.genFailedError": "决策简报生成失败。",
  "copilot.genFailedSr": "决策简报生成失败：{msg}",
  "copilot.cancelledNotice": "生成已取消。",
  "copilot.cancelledSr": "生成已取消。",
  "copilot.realProviderLabel": "真实供应商",
  "copilot.demoLabel": "演示",
  "copilot.fallbackNotice": "真实供应商失败，已保存确定性演示简报。",
  "copilot.realSavedNotice": "{mode} 决策简报已保存。",
  "copilot.fallbackSavedSr": "已使用演示兜底保存决策简报。",
  "copilot.realSavedSr": "{mode} 决策简报已生成并保存。",
  "copilot.batchInProgressReason": "批量生成进行中。",
  "copilot.waitSingleReason": "请等待当前单份简报完成。",
  "copilot.noReadyReason": "暂无就绪假设（需要证据且无现有简报）。",
  "copilot.synthesizingReason": "简报正在合成中。",
  "copilot.selectHypothesisReason": "请选择一个假设以生成简报。",
  "copilot.needEvidenceReason": "生成前请至少记录一条证据。",
  "copilot.fieldStatus": "状态",
  "copilot.fieldDecision": "决策",
  "copilot.fieldNextAction": "下一步行动",
  "copilot.emptyPlaceholder": "（空）",
  "vBoard.confirm.bulkDeleteHypTitle": "删除选中的假设？",
  "vBoard.confirm.bulkDeleteHypBody": "{count} 个假设及其全部证据将从该工作台永久移除。可通过提示立即撤销。",
  "vBoard.confirm.bulkArchiveHypTitle": "归档选中的假设？",
  "vBoard.confirm.bulkArchiveHypBody": "{count} 个假设将从主列表隐藏。你可随时从归档中恢复。",
  "vBoard.confirm.bulkDeleteEvidenceTitle": "删除选中的证据？",
  "vBoard.confirm.bulkDeleteEvidenceBody": "{count} 条证据将从该假设移除。置信度将自动重新计算。",
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
