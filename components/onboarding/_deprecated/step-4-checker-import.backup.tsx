// BACKUP: 기존 Step 4 (Checker Import) - 2026-08-07 보관
// 이 코드는 온보딩 구조 정리 후 사용되지 않으므로 백업으로 보관합니다.

{step === 4 && (
  <section key="step-4" className="space-y-5 transition-opacity duration-200" aria-label={t("common.habitCheck", locale)}>
    <img src="/onboarding/intro-02.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />

    {(checkerChoice === "pending" || checkerChoice === "loaded") && (
      <>
        {checkerChoice === "pending" && (
          <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground text-center">
              {t("onboarding.checkerImport.question", locale)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (diary.pendingCheckerContext) {
                    setAppliedCheckerSummary(diary.pendingCheckerContext)
                    diary.applyCheckerContext()
                    setCheckerChoice("loaded")
                  }
                }}
                className="flex-1 rounded-2xl border border-primary bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary-text transition-colors hover:bg-primary/20"
              >
                {t("onboarding.checkerImport.load", locale)}
              </button>
              <button
                type="button"
                onClick={() => {
                  diary.dismissCheckerContext()
                  setCheckerChoice("dismissed")
                }}
                className="flex-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                {t("onboarding.checkerImport.skip", locale)}
              </button>
            </div>
          </div>
        )}

        {checkerChoice === "loaded" && appliedCheckerSummary && (
          <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {appliedCheckerSummary.concern !== "none" && (
                <>
                  {CONCERN_LABEL[appliedCheckerSummary.concern]} 고민,{" "}
                </>
              )}
              {appliedCheckerSummary.supportOwned.length > 0 && (
                <>
                  {appliedCheckerSummary.supportOwned.map(id => SUPPORT_LABEL[id]).join("·")} 성분 보유 중이시네요.
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("onboarding.checkerImport.bridge", locale)}
            </p>
          </div>
        )}
      </>
    )}

    <Button
      type="button"
      size="lg"
      onClick={() => setStep(5)}
      className="h-auto w-full rounded-full py-3 text-[15px]"
    >
      {t("onboarding.ingredientCheck.next", locale)}
    </Button>
  </section>
)}
