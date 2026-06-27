import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Volume2, Brain, TrendingUp, ArrowLeft, ChevronRight, AlertCircle, Trash2, Activity, CheckCircle2, Clock, ShieldCheck, Home as HomeIcon, BarChart2 } from "lucide-react";
import { VisionTest } from "@/components/tests/VisionTest";
import { HearingTest } from "@/components/tests/HearingTest";
import { CognitionTest } from "@/components/tests/CognitionTest";
import { HealthSummary } from "@/components/HealthSummary";
import { useTestHistory } from "@/hooks/useTestHistory";
import { initDB, deleteTestResult } from "@/lib/db";
import { AnyTestResult } from "@/lib/types";
import { toast } from "sonner";

type Screen = "home" | "vision" | "hearing" | "cognition" | "history" | "summary";

const CARDS = [
  { id: "vision" as Screen, label: "Teste de Visao", labelFull: "Teste de Visao", desc: "Acuidade, daltonismo, astigmatismo e contraste", icon: Eye,    from: "#16a34a", to: "#15803d", accent: "rgba(22,163,74,0.4)",  badge: "5 categorias" },
  { id: "hearing" as Screen,   label: "Teste de Audicao",  labelFull: "Teste de Audicao",  desc: "Frequencia, equilibrio e reconhecimento de palavras", icon: Volume2, from: "#059669", to: "#047857", accent: "rgba(5,150,105,0.4)",  badge: "4 categorias" },
  { id: "cognition" as Screen, label: "Teste de Cognicao", labelFull: "Teste de Cognicao", desc: "Memoria, atencao, reacao e raciocinio",     icon: Brain,   from: "#10b981", to: "#065f46", accent: "rgba(16,185,129,0.4)", badge: "4 categorias" },
];

export default function Home() {
  const { allTests, loading, refresh } = useTestHistory();
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    initDB().then(() => {
      setAccepted(localStorage.getItem("disclaimerAccepted") === "true");
      setReady(true);
    }).catch(console.error);
  }, []);

  const accept = () => { localStorage.setItem("disclaimerAccepted", "true"); setAccepted(true); };

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const typeLabel = (t: string) => t === "vision" ? "Visao" : t === "hearing" ? "Audicao" : t === "cognition" ? "Cognicao" : t;
  const delTest = async (id: string) => { try { await deleteTestResult(id); await refresh(); toast.success("Removido"); } catch { toast.error("Erro ao remover"); } };

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#052e16,#14532d,#052e16)" }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-green-500/30 border-t-green-400 rounded-full mx-auto animate-spin mb-4" />
        <p className="text-green-200 text-sm">Carregando...</p>
      </div>
    </div>
  );

  if (!accepted) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#052e16,#14532d,#052e16)" }}>
      <div className="w-full max-w-md rounded-3xl border border-green-500/20 p-7 sm:p-9" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(251,191,36,0.15)" }}>
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-1">Aviso Importante</h1>
        <p className="text-gray-400 text-sm text-center mb-7">Leia antes de continuar</p>
        <ul className="space-y-3 mb-8">
          {["Os resultados sao apenas indicativos e nao substituem avaliacao medica.","Testes de audicao dependem da qualidade dos fones e do ambiente.","Testes de visao podem ser influenciados pelo brilho da tela.","Seus dados ficam somente neste dispositivo. Nada e enviado externamente."].map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
              <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{t}
            </li>
          ))}
        </ul>
        <Button onClick={accept} className="w-full py-5 text-base font-semibold rounded-2xl border-0 text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
          Entendi e Aceito
        </Button>
      </div>
    </div>
  );

  const isTest = ["vision","hearing","cognition"].includes(screen);
  const card = CARDS.find(c => c.id === screen);
  const screenTitle = isTest ? card?.labelFull : screen === "history" ? "Historico" : screen === "summary" ? "Resumo de Saude" : "Autoavaliacao Sensorial";

  const NAV_ITEMS = [
    { id: "home" as Screen,    label: "Inicio",    icon: HomeIcon },
    { id: "history" as Screen, label: "Historico", icon: TrendingUp },
    { id: "summary" as Screen, label: "Resumo",    icon: BarChart2 },
  ];

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-green-500/10"
      style={{ background: "rgba(5,46,22,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-2xl mx-auto flex items-stretch">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = screen === id;
          return (
            <button key={id} onClick={() => setScreen(id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
              aria-label={label}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200"
                style={active ? { background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 14px rgba(22,163,74,0.45)" } : {}}>
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-green-700"}`} />
              </div>
              <span className={`text-xs font-medium transition-colors ${active ? "text-green-400" : "text-green-800"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  const Header = () => (
    <header className="sticky top-0 z-50 border-b border-green-500/10" style={{ background: "rgba(5,46,22,0.75)", backdropFilter: "blur(16px)" }}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {isTest && (
          <button onClick={() => setScreen("home")} aria-label="Voltar" className="w-8 h-8 rounded-xl flex items-center justify-center text-green-400 hover:text-white hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>
          <Brain className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm font-semibold text-white truncate flex-1">{screenTitle}</p>
      </div>
    </header>
  );

  if (isTest) return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#052e16,#14532d,#052e16)" }}>
      <Header />
      <div className="max-w-2xl mx-auto px-3 py-5">
        {screen === "vision" && <VisionTest />}
        {screen === "hearing" && <HearingTest />}
        {screen === "cognition" && <CognitionTest />}
      </div>
    </div>
  );

  if (screen === "history") return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#052e16,#14532d,#052e16)" }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-400 rounded-full mx-auto animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Carregando...</p>
          </div>
        ) : allTests.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-white font-medium">Nenhum teste realizado</p>
            <p className="text-gray-500 text-sm mt-1 mb-5">Faca um teste para ver o historico aqui.</p>
            <Button onClick={() => setScreen("home")} className="rounded-xl border-0 text-white" style={{ background: "linear-gradient(135deg,#16a34a,#059669)" }}>Fazer um teste</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-500 text-xs px-1 mb-3">{allTests.length} resultado{allTests.length!==1?"s":""} salvos</p>
            {allTests.map((t: AnyTestResult) => {
              const clr = "#16a34a";
              const Ic = t.type === "vision" ? Eye : t.type === "hearing" ? Volume2 : Brain;
              return (
                <div key={t.id} className="rounded-2xl border border-green-500/15 p-3.5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: clr+"25" }}>
                    <Ic className="w-4 h-4" style={{ color: clr }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{typeLabel(t.type)} · <span className="text-gray-400 font-normal capitalize">{t.category}</span></p>
                    <p className="text-gray-500 text-xs">{fmtDate(t.timestamp)}</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0 text-green-400">{String(t.value).slice(0,12)}</p>
                  <button onClick={() => delTest(t.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );

  if (screen === "summary") return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#052e16,#14532d,#052e16)" }}>
      <Header />
      <div className="max-w-2xl mx-auto px-3 py-5 pb-28"><HealthSummary tests={allTests} /></div>
      <BottomNav />
    </div>
  );

  const done = allTests.length;
  const lastTs = allTests[0]?.timestamp;

  return (
    <div className="min-h-screen pb-8" style={{ background: "linear-gradient(135deg,#052e16,#14532d,#052e16)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 420, height: 420, top: -120, right: -80, background: "radial-gradient(circle,rgba(22,163,74,0.2) 0%,transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute rounded-full" style={{ width: 360, height: 360, bottom: 60, left: -80, background: "radial-gradient(circle,rgba(5,150,105,0.18) 0%,transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, top: "45%", left: "40%", background: "radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)", filter: "blur(50px)" }} />
      </div>
      <div className="relative" style={{ zIndex: 1 }}>
        <Header />
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center pt-8 pb-7">
            <div className="relative inline-flex mb-5">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 0 48px rgba(22,163,74,0.55)" }}>
                <Activity className="w-10 h-10 text-white" />
              </div>
              {done > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#16a34a" }}>{done}</div>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ola! Pronto para testar?</h2>
            <p className="text-green-200/60 text-sm max-w-xs mx-auto">Avalie sua saude sensorial com testes rapidos e precisos</p>
            {done > 0 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <div className="flex items-center gap-1.5 text-xs text-green-400 px-3 py-1.5 rounded-full" style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.2)" }}>
                  <CheckCircle2 className="w-3 h-3" />{done} teste{done!==1?"s":""} feito{done!==1?"s":""}
                </div>
                {lastTs && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Clock className="w-3 h-3" />{fmtDate(lastTs)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 mb-4">
            {CARDS.map(({ id, label, desc, icon: Icon, from, to, accent, badge }) => {
              const last = allTests.find(t => t.type === id);
              return (
                <button key={id} onClick={() => setScreen(id)}
                  className="w-full text-left rounded-3xl p-5 border border-white/10 active:scale-[0.98] transition-all duration-150"
                  style={{ background: `linear-gradient(135deg,${from}cc,${to}bb)`, boxShadow: `0 8px 32px ${accent}` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-bold text-base">{label}</p>
                        {last && <CheckCircle2 className="w-4 h-4 text-white/80 flex-shrink-0" />}
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
                      <p className="text-white/40 text-xs mt-1">{badge}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <ChevronRight className="w-4 h-4 text-white/80" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setScreen("history")} className="flex items-center gap-3 rounded-2xl p-4 border border-white/8 active:scale-[0.97] transition-all" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,163,74,0.2)" }}>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Historico</p>
                <p className="text-gray-500 text-xs">{done} resultado{done!==1?"s":""}</p>
              </div>
            </button>
            <button onClick={() => setScreen("summary")} className="flex items-center gap-3 rounded-2xl p-4 border border-white/8 active:scale-[0.97] transition-all" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,163,74,0.2)" }}>
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Resumo</p>
                <p className="text-gray-500 text-xs">Analise geral</p>
              </div>
            </button>
          </div>
          <p className="text-center text-green-900/60 text-xs mt-4">Dados salvos apenas neste dispositivo</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
