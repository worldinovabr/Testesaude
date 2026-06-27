import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Eye, Volume2, Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AnyTestResult } from '@/lib/types';

interface HealthSummaryProps {
  tests: AnyTestResult[];
}

type Status = 'excellent' | 'good' | 'attention' | 'poor' | 'untested';

interface CategoryResult {
  label: string;
  status: Status;
  score: number;
  value: string;
  expected: string;
  detail: string;
  date: number | null;
}

interface SectionResult {
  type: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  borderColor: string;
  overallScore: number;
  overallStatus: Status;
  categories: CategoryResult[];
}

// ── Benchmark helpers ──────────────────────────────────────────

function visionAcuidadeScore(value: string): { score: number; status: Status; detail: string } {
  const map: Record<string, { score: number; status: Status; detail: string }> = {
    '20/10': { score: 100, status: 'excellent', detail: 'Acuidade excepcional' },
    '20/15': { score: 95,  status: 'excellent', detail: 'Acuidade excepcional' },
    '20/20': { score: 90,  status: 'excellent', detail: 'Visão normal esperada' },
    '20/25': { score: 75,  status: 'good',      detail: 'Levemente reduzida' },
    '20/30': { score: 60,  status: 'attention', detail: 'Atenção recomendada' },
    '20/40': { score: 40,  status: 'attention', detail: 'Consulte um oftalmologista' },
    '20/50': { score: 25,  status: 'poor',      detail: 'Visão reduzida — avalie com profissional' },
    '20/70': { score: 15,  status: 'poor',      detail: 'Visão muito reduzida' },
    '20/200':{ score: 5,   status: 'poor',      detail: 'Baixa visão — consulte especialista' },
  };
  return map[value] ?? { score: 50, status: 'attention', detail: 'Resultado atípico' };
}

function hearingFreqScore(hz: number): { score: number; status: Status; detail: string } {
  if (hz >= 16000) return { score: 100, status: 'excellent', detail: 'Audição excepcional (≥16 kHz)' };
  if (hz >= 14000) return { score: 85,  status: 'excellent', detail: 'Audição muito boa (≥14 kHz)' };
  if (hz >= 10000) return { score: 70,  status: 'good',      detail: 'Audição boa (≥10 kHz)' };
  if (hz >= 8000)  return { score: 55,  status: 'good',      detail: 'Audição adequada (≥8 kHz)' };
  if (hz >= 6000)  return { score: 40,  status: 'attention', detail: 'Faixa reduzida — avalie com fonoaudiólogo' };
  if (hz >= 4000)  return { score: 25,  status: 'poor',      detail: 'Perda auditiva possível' };
  return           { score: 10,  status: 'poor',      detail: 'Audição muito reduzida' };
}

function reactionScore(ms: number): { score: number; status: Status; detail: string } {
  if (ms <= 180)  return { score: 100, status: 'excellent', detail: 'Reação excepcional (≤180 ms)' };
  if (ms <= 250)  return { score: 85,  status: 'excellent', detail: 'Reação muito rápida (≤250 ms)' };
  if (ms <= 350)  return { score: 70,  status: 'good',      detail: 'Reação normal (≤350 ms)' };
  if (ms <= 450)  return { score: 50,  status: 'attention', detail: 'Reação um pouco lenta' };
  if (ms <= 600)  return { score: 30,  status: 'attention', detail: 'Reação lenta — avalie seu estado' };
  return          { score: 15,  status: 'poor',      detail: 'Reação muito lenta' };
}

function percentScore(pct: number): { score: number; status: Status; detail: string } {
  if (pct >= 90)  return { score: 100, status: 'excellent', detail: `${pct}% — Excelente` };
  if (pct >= 80)  return { score: 80,  status: 'excellent', detail: `${pct}% — Muito bom` };
  if (pct >= 70)  return { score: 65,  status: 'good',      detail: `${pct}% — Bom` };
  if (pct >= 60)  return { score: 50,  status: 'attention', detail: `${pct}% — Atenção recomendada` };
  return          { score: 30,  status: 'poor',      detail: `${pct}% — Resultado baixo` };
}

function statusColor(s: Status) {
  switch (s) {
    case 'excellent': return 'text-emerald-400';
    case 'good':      return 'text-cyan-400';
    case 'attention': return 'text-amber-400';
    case 'poor':      return 'text-red-400';
    default:          return 'text-gray-500';
  }
}

function statusBg(s: Status) {
  switch (s) {
    case 'excellent': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'good':      return 'bg-cyan-500/10 border-cyan-500/30';
    case 'attention': return 'bg-amber-500/10 border-amber-500/30';
    case 'poor':      return 'bg-red-500/10 border-red-500/30';
    default:          return 'bg-gray-800/40 border-gray-700/30';
  }
}

function statusLabel(s: Status) {
  switch (s) {
    case 'excellent': return 'Excelente';
    case 'good':      return 'Bom';
    case 'attention': return 'Atenção';
    case 'poor':      return 'Baixo';
    default:          return 'Não testado';
  }
}

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case 'excellent':
    case 'good':
      return <CheckCircle className={`w-4 h-4 ${statusColor(status)}`} />;
    case 'attention':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'poor':
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
}

function progressColor(s: Status) {
  switch (s) {
    case 'excellent': return '[&>div]:bg-emerald-500';
    case 'good':      return '[&>div]:bg-cyan-500';
    case 'attention': return '[&>div]:bg-amber-500';
    case 'poor':      return '[&>div]:bg-red-500';
    default:          return '[&>div]:bg-gray-600';
  }
}

function avgScore(cats: CategoryResult[]): number {
  const tested = cats.filter(c => c.status !== 'untested');
  if (tested.length === 0) return 0;
  return Math.round(tested.reduce((s, c) => s + c.score, 0) / tested.length);
}

function worstStatus(cats: CategoryResult[]): Status {
  const order: Status[] = ['poor', 'attention', 'good', 'excellent', 'untested'];
  for (const s of order) {
    if (cats.some(c => c.status === s)) return s;
  }
  return 'untested';
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Main component ─────────────────────────────────────────────

export function HealthSummary({ tests }: HealthSummaryProps) {
  const sections = useMemo<SectionResult[]>(() => {
    const latest = (type: string, cat: string) =>
      tests.filter(t => t.type === type && t.category === cat)
           .sort((a, b) => b.timestamp - a.timestamp)[0] ?? null;

    // ── Visão ──────────────────────────────────────────────────
    const vAcuid = latest('vision', 'acuidade');
    const vDalt  = latest('vision', 'daltonismo');
    const vAstig = latest('vision', 'astigmatismo');
    const vContr = latest('vision', 'contraste');
    const vProx  = latest('vision', 'proximidade');

    const acuidCat: CategoryResult = vAcuid ? (() => {
      const { score, status, detail } = visionAcuidadeScore(String(vAcuid.value));
      return { label: 'Acuidade Visual', status, score, value: String(vAcuid.value), expected: '20/20', detail, date: vAcuid.timestamp };
    })() : { label: 'Acuidade Visual', status: 'untested', score: 0, value: '—', expected: '20/20', detail: 'Não testado', date: null };

    const daltCat: CategoryResult = vDalt ? (() => {
      const ok = String(vDalt.value).toLowerCase().includes('normal') || String(vDalt.value) === 'pass';
      return { label: 'Daltonismo', status: ok ? 'excellent' : 'attention', score: ok ? 95 : 40, value: String(vDalt.value), expected: 'Normal', detail: ok ? 'Sem sinais de daltonismo' : 'Possível deficiência de cor', date: vDalt.timestamp };
    })() : { label: 'Daltonismo', status: 'untested', score: 0, value: '—', expected: 'Normal', detail: 'Não testado', date: null };

    const astigCat: CategoryResult = vAstig ? (() => {
      const ok = String(vAstig.value).toLowerCase().includes('normal') || String(vAstig.value) === 'pass';
      return { label: 'Astigmatismo', status: ok ? 'excellent' : 'attention', score: ok ? 90 : 45, value: String(vAstig.value), expected: 'Normal', detail: ok ? 'Sem sinais de astigmatismo' : 'Possível astigmatismo', date: vAstig.timestamp };
    })() : { label: 'Astigmatismo', status: 'untested', score: 0, value: '—', expected: 'Normal', detail: 'Não testado', date: null };

    const contrCat: CategoryResult = vContr ? (() => {
      const num = parseFloat(String(vContr.score ?? vContr.value));
      const { score, status, detail } = isNaN(num) ? { score: 70, status: 'good' as Status, detail: String(vContr.value) } : percentScore(num);
      return { label: 'Sensibilidade ao Contraste', status, score, value: String(vContr.value), expected: '≥80%', detail, date: vContr.timestamp };
    })() : { label: 'Sensibilidade ao Contraste', status: 'untested', score: 0, value: '—', expected: '≥80%', detail: 'Não testado', date: null };

    const proxCat: CategoryResult = vProx ? (() => {
      const ok = String(vProx.value).toLowerCase().includes('normal') || String(vProx.value).includes('cm') && parseInt(String(vProx.value)) >= 30;
      return { label: 'Visão de Perto', status: ok ? 'good' : 'attention', score: ok ? 80 : 50, value: String(vProx.value), expected: '≥30 cm', detail: ok ? 'Visão de perto adequada' : 'Possível presbiopia', date: vProx.timestamp };
    })() : { label: 'Visão de Perto', status: 'untested', score: 0, value: '—', expected: '≥30 cm', detail: 'Não testado', date: null };

    const visionCats = [acuidCat, daltCat, astigCat, contrCat, proxCat];

    // ── Audição ────────────────────────────────────────────────
    const hFreq  = latest('hearing', 'frequencia');
    const hEquil = latest('hearing', 'equilibrio');
    const hPal   = latest('hearing', 'palavras');
    const hRuido = latest('hearing', 'ruido');

    const freqCat: CategoryResult = hFreq ? (() => {
      const hz = parseInt(String(hFreq.value));
      const { score, status, detail } = isNaN(hz) ? { score: 60, status: 'good' as Status, detail: String(hFreq.value) } : hearingFreqScore(hz);
      return { label: 'Frequência Audível', status, score, value: isNaN(hz) ? String(hFreq.value) : `${hz.toLocaleString('pt-BR')} Hz`, expected: '≥14.000 Hz', detail, date: hFreq.timestamp };
    })() : { label: 'Frequência Audível', status: 'untested', score: 0, value: '—', expected: '≥14.000 Hz', detail: 'Não testado', date: null };

    const equilCat: CategoryResult = hEquil ? (() => {
      const ok = String(hEquil.value).toLowerCase().includes('normal');
      const score = ok ? 90 : String(hEquil.value).toLowerCase().includes('leve') ? 65 : 35;
      const status: Status = ok ? 'excellent' : score >= 60 ? 'attention' : 'poor';
      return { label: 'Equilíbrio Auditivo', status, score, value: String(hEquil.value), expected: 'Normal', detail: ok ? 'Equilíbrio simétrico entre os ouvidos' : 'Assimetria auditiva detectada', date: hEquil.timestamp };
    })() : { label: 'Equilíbrio Auditivo', status: 'untested', score: 0, value: '—', expected: 'Normal', detail: 'Não testado', date: null };

    const palCat: CategoryResult = hPal ? (() => {
      const pct = parseInt(String(hPal.value));
      const { score, status, detail } = isNaN(pct) ? { score: 70, status: 'good' as Status, detail: String(hPal.value) } : percentScore(pct);
      return { label: 'Reconhecimento de Palavras', status, score, value: String(hPal.value), expected: '≥85%', detail, date: hPal.timestamp };
    })() : { label: 'Reconhecimento de Palavras', status: 'untested', score: 0, value: '—', expected: '≥85%', detail: 'Não testado', date: null };

    const ruidoCat: CategoryResult = hRuido ? (() => {
      const pct = parseInt(String(hRuido.value));
      const { score, status, detail } = isNaN(pct) ? { score: 65, status: 'good' as Status, detail: String(hRuido.value) } : percentScore(pct);
      return { label: 'Compreensão com Ruído', status, score, value: String(hRuido.value), expected: '≥70%', detail, date: hRuido.timestamp };
    })() : { label: 'Compreensão com Ruído', status: 'untested', score: 0, value: '—', expected: '≥70%', detail: 'Não testado', date: null };

    const hearingCats = [freqCat, equilCat, palCat, ruidoCat];

    // ── Cognição ───────────────────────────────────────────────
    const cReac = latest('cognition', 'reacao');
    const cMem  = latest('cognition', 'memoria');
    const cAten = latest('cognition', 'atencao');
    const cSeq  = latest('cognition', 'sequencia');

    const reacCat: CategoryResult = cReac ? (() => {
      const ms = parseInt(String(cReac.value));
      const { score, status, detail } = isNaN(ms) ? { score: 70, status: 'good' as Status, detail: String(cReac.value) } : reactionScore(ms);
      return { label: 'Tempo de Reação', status, score, value: isNaN(ms) ? String(cReac.value) : `${ms} ms`, expected: '≤350 ms', detail, date: cReac.timestamp };
    })() : { label: 'Tempo de Reação', status: 'untested', score: 0, value: '—', expected: '≤350 ms', detail: 'Não testado', date: null };

    const memCat: CategoryResult = cMem ? (() => {
      const pct = typeof cMem.score === 'number' ? cMem.score : parseInt(String(cMem.value));
      const { score, status, detail } = isNaN(pct) ? { score: 70, status: 'good' as Status, detail: String(cMem.value) } : percentScore(pct);
      return { label: 'Memória de Trabalho', status, score, value: String(cMem.value), expected: '≥80%', detail, date: cMem.timestamp };
    })() : { label: 'Memória de Trabalho', status: 'untested', score: 0, value: '—', expected: '≥80%', detail: 'Não testado', date: null };

    const atenCat: CategoryResult = cAten ? (() => {
      const pct = typeof cAten.score === 'number' ? cAten.score : parseInt(String(cAten.value));
      const { score, status, detail } = isNaN(pct) ? { score: 70, status: 'good' as Status, detail: String(cAten.value) } : percentScore(pct);
      return { label: 'Atenção Sustentada', status, score, value: String(cAten.value), expected: '≥80%', detail, date: cAten.timestamp };
    })() : { label: 'Atenção Sustentada', status: 'untested', score: 0, value: '—', expected: '≥80%', detail: 'Não testado', date: null };

    const seqCat: CategoryResult = cSeq ? (() => {
      const pct = typeof cSeq.score === 'number' ? cSeq.score : parseInt(String(cSeq.value));
      const { score, status, detail } = isNaN(pct) ? { score: 70, status: 'good' as Status, detail: String(cSeq.value) } : percentScore(pct);
      return { label: 'Memória Sequencial', status, score, value: String(cSeq.value), expected: '≥75%', detail, date: cSeq.timestamp };
    })() : { label: 'Memória Sequencial', status: 'untested', score: 0, value: '—', expected: '≥75%', detail: 'Não testado', date: null };

    const cognCats = [reacCat, memCat, atenCat, seqCat];

    return [
      {
        type: 'vision',
        icon: <Eye className="w-5 h-5" />,
        label: 'Visão',
        color: 'text-purple-400',
        borderColor: 'border-purple-500/30',
        overallScore: avgScore(visionCats),
        overallStatus: worstStatus(visionCats),
        categories: visionCats,
      },
      {
        type: 'hearing',
        icon: <Volume2 className="w-5 h-5" />,
        label: 'Audição',
        color: 'text-cyan-400',
        borderColor: 'border-cyan-500/30',
        overallScore: avgScore(hearingCats),
        overallStatus: worstStatus(hearingCats),
        categories: hearingCats,
      },
      {
        type: 'cognition',
        icon: <Brain className="w-5 h-5" />,
        label: 'Cognição',
        color: 'text-pink-400',
        borderColor: 'border-pink-500/30',
        overallScore: avgScore(cognCats),
        overallStatus: worstStatus(cognCats),
        categories: cognCats,
      },
    ];
  }, [tests]);

  const totalTested = tests.length;
  const overallScore = useMemo(() => {
    const scored = sections.filter(s => s.overallScore > 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((s, sec) => s + sec.overallScore, 0) / scored.length);
  }, [sections]);

  const overallStatus: Status = useMemo(() => {
    return worstStatus(sections.map(s => ({ status: s.overallStatus } as CategoryResult)));
  }, [sections]);

  // Overall status display
  const overallStatusLabel = statusLabel(overallStatus);
  const overallStatusColor = statusColor(overallStatus);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Resumo Geral de Saúde Sensorial</h2>
        </div>

        {totalTested === 0 ? (
          <div className="text-center py-6">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 font-medium mb-1">Nenhum teste realizado ainda</p>
            <p className="text-gray-500 text-sm">Vá até a aba "Testes" e realize pelo menos um teste para ver seu resumo aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={overallStatus === 'excellent' ? '#10b981' : overallStatus === 'good' ? '#06b6d4' : overallStatus === 'attention' ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={`${2.51327 * overallScore} ${251.327 - 2.51327 * overallScore}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${overallStatusColor}`}>{overallScore}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
              </div>
              <p className={`mt-2 font-semibold ${overallStatusColor}`}>{overallStatusLabel}</p>
              <p className="text-xs text-gray-400">{totalTested} teste{totalTested !== 1 ? 's' : ''} realizado{totalTested !== 1 ? 's' : ''}</p>
            </div>

            {/* Section mini scores */}
            <div className="col-span-2 space-y-3">
              {sections.map(sec => (
                <div key={sec.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-2 ${sec.color}`}>
                      {sec.icon}
                      <span className="text-sm font-medium text-white">{sec.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={sec.overallStatus} />
                      <span className={`text-sm font-semibold ${statusColor(sec.overallStatus)}`}>
                        {sec.overallScore > 0 ? `${sec.overallScore}/100` : '—'}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={sec.overallScore}
                    className={`h-2 bg-white/10 ${progressColor(sec.overallStatus)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Sections detail */}
      {sections.map(sec => (
        <Card key={sec.type} className={`bg-black/20 ${sec.borderColor} border p-5`}>
          <div className={`flex items-center gap-2 mb-4 ${sec.color}`}>
            {sec.icon}
            <h3 className="text-lg font-bold text-white">{sec.label}</h3>
            {sec.overallScore > 0 && (
              <span className={`ml-auto text-sm font-semibold px-2 py-0.5 rounded-full border ${statusBg(sec.overallStatus)} ${statusColor(sec.overallStatus)}`}>
                {statusLabel(sec.overallStatus)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sec.categories.map(cat => (
              <div
                key={cat.label}
                className={`rounded-lg border p-3 ${statusBg(cat.status)}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-white">{cat.label}</p>
                  <StatusIcon status={cat.status} />
                </div>

                <div className="flex items-end justify-between mb-1">
                  <div>
                    <p className={`text-xl font-bold ${statusColor(cat.status)}`}>{cat.value}</p>
                    <p className="text-xs text-gray-500">Obtido</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-300">{cat.expected}</p>
                    <p className="text-xs text-gray-500">Esperado</p>
                  </div>
                </div>

                {cat.status !== 'untested' && (
                  <>
                    <Progress
                      value={cat.score}
                      className={`h-1.5 bg-white/10 mb-1.5 ${progressColor(cat.status)}`}
                    />
                    <p className="text-xs text-gray-400">{cat.detail}</p>
                    {cat.date && (
                      <p className="text-xs text-gray-600 mt-1">Último teste: {formatDate(cat.date)}</p>
                    )}
                  </>
                )}
                {cat.status === 'untested' && (
                  <p className="text-xs text-gray-500 mt-1">Realize este teste para ver seu resultado</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Disclaimer */}
      <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200">
          Os resultados são indicativos e baseados em médias populacionais. Não substituem avaliação profissional. Em caso de dúvida, consulte um especialista.
        </p>
      </div>
    </div>
  );
}
