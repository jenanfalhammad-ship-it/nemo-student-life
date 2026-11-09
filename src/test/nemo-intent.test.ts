import { describe, expect, it } from "vitest";
import { isNemoAdviceMessage } from "@/lib/nemo-intent";

describe("Nemo advice intent", () => {
  it("recognizes the Saudi Arabic question about where to put something", () => {
    expect(isNemoAdviceMessage("شرايك وين أحط هذا؟")).toBe(true);
  });

  it("recognizes Arabic recommendation requests without punctuation", () => {
    expect(isNemoAdviceMessage("وش تنصحني أسوي مع هالمهمة")).toBe(true);
  });

  it("recognizes English opinion questions", () => {
    expect(isNemoAdviceMessage("What do you think — should I study biology first?")).toBe(true);
  });

  it("does not classify a clear create command as advice", () => {
    expect(isNemoAdviceMessage("ضيف مهمة مذاكرة رياضيات بكرة الساعة ٤")).toBe(false);
    expect(isNemoAdviceMessage("Add a math study task tomorrow at 4 PM")).toBe(false);
  });
});
