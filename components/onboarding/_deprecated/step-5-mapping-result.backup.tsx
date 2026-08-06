// BACKUP: 기존 Step 5 (Mapping Result) - 2026-08-07 보관
// 이 코드는 온보딩 구조 정리 후 사용되지 않으므로 백업으로 보관합니다.

{step === 5 && (
  <section key="step-3" className="space-y-5 text-center transition-opacity duration-200" aria-label={t("common.mappingResult", locale)}>
    <img src="/onboarding/intro-03.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />

    <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{t("onboarding.mappingResult.conditionQuestion", locale)}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCondition("good")}
          className={cn(
            "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
            condition === "good" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
          )}
          aria-pressed={condition === "good"}
        >
          {t("onboarding.mappingResult.condition_good", locale)}
        </button>
        <button
          type="button"
          onClick={() => setCondition("neutral")}
          className={cn(
            "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
            condition === "neutral" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
          )}
          aria-pressed={condition === "neutral"}
        >
          {t("onboarding.mappingResult.condition_neutral", locale)}
        </button>
        <button
          type="button"
          onClick={() => setCondition("bad")}
          className={cn(
            "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
            condition === "bad" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
          )}
          aria-pressed={condition === "bad"}
        >
          {t("onboarding.mappingResult.condition_bad", locale)}
        </button>
      </div>
    </div>

    <Button
      type="button"
      size="lg"
      disabled={condition === null}
      onClick={() => onComplete(activeIngredients, dataConsent, condition!)}
      className="h-auto w-full rounded-full py-3 text-[15px]"
    >
      {t("onboarding.mappingResult.start", locale)}
    </Button>
  </section>
)}
