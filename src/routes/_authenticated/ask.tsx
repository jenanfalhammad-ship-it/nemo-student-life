import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Bot, ShieldCheck } from "lucide-react";
import { Card, PageHeader } from "@/components/kit";
import { Nemo } from "@/components/nemo";
import { Button } from "@/components/ui/button";
import { useTx } from "@/lib/tx";

export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({
    meta: [
      { title: "Ask Nemo — NEMO" },
      { name: "description", content: "Ask Nemo in NEMO." },
      { property: "og:title", content: "Ask Nemo — NEMO" },
      { property: "og:description", content: "Ask Nemo in NEMO." },
    ],
  }),
  component: AskNemo,
});

function AskNemo() {
  const { tx, dir } = useTx();
  const [showLimits, setShowLimits] = useState(false);

  return (
    <div dir={dir}>
      <PageHeader
        title={tx("Ask Nemo", "اسأل نيمو")}
        sub={tx(
          "A transparent status for Nemo's assistant features.",
          "حالة واضحة لميزات مساعد نيمو.",
        )}
      />

      <div className="mx-auto grid max-w-3xl gap-4">
        <Card className="overflow-hidden border border-amber-500/30 bg-amber-500/5 p-5 sm:p-7">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Nemo mood="studying" className="h-20 w-20 shrink-0" />
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {tx("AI service not connected", "خدمة الذكاء الاصطناعي غير متصلة")}
              </div>
              <h2 className="text-lg font-bold">
                {tx("Nemo can't answer questions yet", "لا يستطيع نيمو الإجابة عن الأسئلة حاليًا")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {tx(
                  "There is no documented, configured AI endpoint in this app right now. Your question will not be sent or answered, and no AI response is being simulated. A saved chat log by itself is not an AI service.",
                  "لا توجد حاليًا نقطة اتصال موثقة ومهيأة للذكاء الاصطناعي في التطبيق. لن يُرسل سؤالك ولن تتلقى إجابة، ولن نحاكي ردًا ذكيًا. وجود سجل محادثة محفوظ وحده لا يعني وجود خدمة ذكاء اصطناعي.",
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLimits((current) => !current)}
              aria-expanded={showLimits}
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              {showLimits
                ? tx("Hide feature limits", "إخفاء حدود الميزات")
                : tx("View feature limits", "عرض حدود الميزات")}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/settings">
                {tx("Privacy and chat-history settings", "إعدادات الخصوصية وسجل المحادثة")}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Card>

        {showLimits && (
          <Card title={tx("What is and isn't available", "ما هو متاح وما ليس متاحًا")}>
            <ul className="grid gap-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {tx(
                  "No live AI replies, planning, or advice are available until a secure server-side endpoint is configured.",
                  "لا تتوفر ردود أو تخطيطات أو نصائح مباشرة من الذكاء الاصطناعي قبل إعداد نقطة اتصال آمنة على الخادم.",
                )}
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {tx(
                  "Nemo cannot read your tasks or calendar to answer questions, and cannot change them on your behalf.",
                  "لا يستطيع نيمو قراءة مهامك أو تقويمك للإجابة، ولا يمكنه تغييرها نيابةً عنك.",
                )}
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {tx(
                  "No AI credentials are stored in or sent from this page.",
                  "لا تُخزَّن مفاتيح الذكاء الاصطناعي في هذه الصفحة ولا تُرسل منها.",
                )}
              </li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
