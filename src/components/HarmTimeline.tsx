const STEPS = ["Promise made", "Service failed", "User affected", "Resolution attempted", "Redress filed"];

export function HarmTimeline({ activeIndex = 4 }: { activeIndex?: number }) {
  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: i <= activeIndex ? "var(--redress-amber)" : "var(--line-ash)",
              }}
            />
            {i < STEPS.length - 1 && (
              <span
                className="w-px flex-1 min-h-[24px]"
                style={{ background: i < activeIndex ? "var(--redress-amber)" : "var(--line-ash)", opacity: 0.5 }}
              />
            )}
          </div>
          <p
            className="text-sm pb-5 -mt-0.5"
            style={{ color: i <= activeIndex ? "var(--paper-white)" : "var(--soft-grey)" }}
          >
            {step}
          </p>
        </div>
      ))}
    </div>
  );
}
