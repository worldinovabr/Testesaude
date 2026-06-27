content = """\
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, AlertCircle } from 'lucide-react';
import { saveTestResult } from '@/lib/db';
import { CognitionTest as CognitionTestType, CoordinationTest as CoordinationTestType } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

type TestCategory = 'reacao' | 'memoria' | 'atencao' | 'sequencia' | 'precisao' | 'trajetoria' | 'velocidade';
interface TestResult { score: number; label: string }

// ── Reação ─────────────────────────────────────────────────────
function ReacaoTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'go' | 'early' | 'done'>('idle');
  const [ms, setMs] = useState(0);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const start = () => {
    setPhase('waiting');
    timerRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase('go');
    }, 1500 + Math.random() * 2500);
  };

  const handleClick = () => {
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setPhase('early');
    } else if (phase === 'go') {
      const t = Date.now() - startRef.current;
      setMs(t);
      setPhase('done');
      onDone({ score: Math.max(0, Math.min(100, Math.round((700 - t) / 5))), label: `${t} ms` });
    }
  };

  const rating = ms < 200 ? 'Reflexo excepcional!' : ms < 300 ? 'Reflexo ótimo!' : ms < 450 ? 'Bom reflexo' : 'Reflexo normal';

  return (
    <div className="space-y-4">
      <p className="text-gray-300">Clique na área quando ela ficar <span className="text-green-400 font-bold">verde</span>. Não antecipe!</p>
      <div
        onClick={handleClick}
        className={`rounded-xl min-h-52 flex flex-col items-center justify-center cursor-pointer select-none transition-colors ${
          phase === 'go' ? 'bg-green-500/30 border-2 border-green-500' :
          phase === 'waiting' ? 'bg-red-900/30 border-2 border-red-700' :
          'bg-black/40 border border-white/10'
        }`}
      >
        {phase === 'idle' && <p className="text-gray-400 text-lg">Pressione "Iniciar" para começar</p>}
        {phase === 'waiting' && <p className="text-red-300 text-2xl font-bold animate-pulse">Aguarde...</p>}
        {phase === 'go' && <p className="text-green-300 text-4xl font-bold">CLIQUE AGORA!</p>}
        {phase === 'early' && (
          <div className="text-center space-y-3">
            <p className="text-yellow-400 text-xl font-bold">Muito cedo! Aguarde o verde.</p>
            <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-300"
              onClick={e => { e.stopPropagation(); setPhase('idle'); }}>
              Tentar de novo
            </Button>
          </div>
        )}
        {phase === 'done' && (
          <div className="text-center">
            <p className="text-5xl font-bold text-cyan-400 mb-2">{ms} ms</p>
            <p className="text-gray-400">{rating}</p>
          </div>
        )}
      </div>
      {phase === 'idle' && (
        <Button onClick={start} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>
      )}
    </div>
  );
}

// ── Memória ─────────────────────────────────────────────────────
function MemoriaTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'done'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(3);
  const LEN = 5;

  const start = () => {
    const seq = Array.from({ length: LEN }, () => Math.floor(Math.random() * 9) + 1);
    setSequence(seq); setInput([]); setCountdown(3); setPhase('showing');
  };

  useEffect(() => {
    if (phase !== 'showing') return;
    if (countdown <= 0) { setPhase('input'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const handleDigit = (n: number) => {
    if (phase !== 'input') return;
    const next = [...input, n];
    setInput(next);
    if (next.length === LEN) {
      const correct = next.filter((v, i) => v === sequence[i]).length;
      setPhase('done');
      onDone({ score: Math.round((correct / LEN) * 100), label: `${correct}/${LEN} corretos` });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300">Memorize a sequência de {LEN} números e repita na mesma ordem.</p>
      <div className="bg-black/40 rounded-xl p-6 min-h-52 flex flex-col items-center justify-center gap-4">
        {phase === 'idle' && <p className="text-gray-400">Pressione "Iniciar" para ver a sequência</p>}
        {phase === 'showing' && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">Memorize! Sumirá em {countdown}s</p>
            <div className="flex gap-3">
              {sequence.map((n, i) => (
                <div key={i} className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">{n}</div>
              ))}
            </div>
          </div>
        )}
        {phase === 'input' && (
          <div className="text-center w-full">
            <p className="text-gray-300 text-sm mb-3">Qual era a sequência? ({input.length}/{LEN})</p>
            <div className="flex gap-2 justify-center mb-4">
              {Array.from({ length: LEN }).map((_, i) => (
                <div key={i} className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-xl font-bold ${i < input.length ? 'bg-cyan-700' : 'border border-gray-600'}`}>
                  {input[i] ?? ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-44 mx-auto">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => handleDigit(n)}
                  className="w-12 h-12 rounded-lg bg-purple-900/50 border border-purple-500/30 text-white text-xl font-bold hover:bg-purple-700/50 transition-colors">
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Gabarito (verde = acerto, vermelho = erro):</p>
            <div className="flex gap-2 justify-center">
              {sequence.map((n, i) => (
                <div key={i} className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-xl font-bold ${input[i] === n ? 'bg-green-600' : 'bg-red-600'}`}>{n}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      {phase === 'idle' && <Button onClick={start} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>}
    </div>
  );
}

// ── Atenção ─────────────────────────────────────────────────────
const ALL_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ATENCAO_SECS = 20;

function AtencaoTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [grid, setGrid] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [timeLeft, setTimeLeft] = useState(ATENCAO_SECS);
  const clickedRef = useRef<Set<number>>(new Set());
  const [clickedState, setClickedState] = useState<Set<number>>(new Set());
  const gridRef = useRef<string[]>([]);

  const finish = (g: string[], clicked: Set<number>) => {
    setPhase('done');
    const total = g.filter(c => c === target).length;
    const hits = [...clicked].filter(i => g[i] === target).length;
    const wrong = [...clicked].filter(i => g[i] !== target).length;
    onDone({ score: Math.max(0, Math.round((hits / Math.max(1, total)) * 100 - wrong * 15)), label: `${hits}/${total} encontrados` });
  };

  const start = () => {
    const t = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    const count = 6 + Math.floor(Math.random() * 5);
    const cells: string[] = Array.from({ length: 35 }, (_, i) => {
      if (i < count) return t;
      let r = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
      while (r === t) r = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
      return r;
    }).sort(() => Math.random() - 0.5);
    clickedRef.current = new Set();
    setClickedState(new Set());
    gridRef.current = cells;
    setGrid(cells);
    setTarget(t);
    setTimeLeft(ATENCAO_SECS);
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') return;
    if (timeLeft <= 0) { finish(gridRef.current, clickedRef.current); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleCell = (i: number) => {
    if (phase !== 'running' || clickedRef.current.has(i)) return;
    const next = new Set([...clickedRef.current, i]);
    clickedRef.current = next;
    setClickedState(new Set(next));
  };

  return (
    <div className="space-y-3">
      <p className="text-gray-300">
        Clique em todas as letras <span className="font-bold text-yellow-300 text-xl">"{target || '?'}"</span> em {ATENCAO_SECS} segundos.
      </p>
      {phase !== 'idle' && (
        <div className="flex items-center gap-2">
          <Progress value={(timeLeft / ATENCAO_SECS) * 100} className="flex-1 h-2" />
          <span className="text-white text-sm font-bold w-8">{timeLeft}s</span>
        </div>
      )}
      <div className="bg-black/40 rounded-xl p-3 min-h-52 flex flex-col items-center justify-center">
        {phase === 'idle' && <p className="text-gray-400">Pressione "Iniciar"</p>}
        {(phase === 'running' || phase === 'done') && (
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {grid.map((letter, i) => {
              const isClicked = clickedState.has(i);
              let cls = 'bg-gray-800/60 hover:bg-gray-700/60 text-gray-200';
              if (phase === 'done') {
                cls = grid[i] === target && isClicked ? 'bg-green-700 text-white' :
                      grid[i] === target ? 'bg-red-800/80 text-white ring-1 ring-red-500' :
                      isClicked ? 'bg-red-500 text-white' : 'bg-gray-800/40 text-gray-500';
              } else if (isClicked) cls = 'bg-purple-600 text-white';
              return (
                <button key={i} onClick={() => handleCell(i)}
                  className={`w-9 h-9 rounded font-bold text-sm transition-colors ${cls}`}>
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {phase === 'idle' && <Button onClick={start} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>}
      {phase === 'running' && (
        <Button onClick={() => finish(gridRef.current, clickedRef.current)} variant="outline" className="w-full border-purple-500/30 text-purple-300">
          Confirmar seleção
        </Button>
      )}
    </div>
  );
}

// ── Sequência (Simon Says) ──────────────────────────────────────
const SIMON_COLORS = [
  { bg: 'bg-red-500',    active: 'bg-red-300 ring-4 ring-red-300',    label: 'Vermelho' },
  { bg: 'bg-green-500',  active: 'bg-green-300 ring-4 ring-green-300',  label: 'Verde'    },
  { bg: 'bg-blue-500',   active: 'bg-blue-300 ring-4 ring-blue-300',   label: 'Azul'     },
  { bg: 'bg-yellow-500', active: 'bg-yellow-300 ring-4 ring-yellow-300', label: 'Amarelo'  },
];
const SIMON_ROUNDS = 5;

function SequenciaTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'fail' | 'done'>('idle');
  const [seq, setSeq] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const flash = async (sequence: number[]) => {
    if (!mountedRef.current) return;
    setPhase('showing');
    setUserSeq([]);
    await sleep(400);
    for (const c of sequence) {
      if (!mountedRef.current) return;
      setActive(c);
      await sleep(600);
      if (!mountedRef.current) return;
      setActive(null);
      await sleep(300);
    }
    if (!mountedRef.current) return;
    setPhase('input');
  };

  const start = async () => {
    const first = [Math.floor(Math.random() * 4)];
    setSeq(first);
    setRound(1);
    await flash(first);
  };

  const handleColor = async (idx: number) => {
    if (phase !== 'input') return;
    const next = [...userSeq, idx];
    if (next[next.length - 1] !== seq[next.length - 1]) {
      setPhase('fail');
      onDone({ score: Math.round(((round - 1) / SIMON_ROUNDS) * 100), label: `${round - 1}/${SIMON_ROUNDS} rodadas` });
      return;
    }
    setUserSeq(next);
    if (next.length === seq.length) {
      if (round >= SIMON_ROUNDS) {
        setPhase('done');
        onDone({ score: 100, label: `${SIMON_ROUNDS}/${SIMON_ROUNDS} rodadas` });
        return;
      }
      const nextSeq = [...seq, Math.floor(Math.random() * 4)];
      setSeq(nextSeq);
      setRound(r => r + 1);
      await flash(nextSeq);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300">Repita a sequência de cores. {SIMON_ROUNDS} rodadas, ficando mais longa a cada vez.</p>
      <div className="bg-black/40 rounded-xl p-6 flex flex-col items-center gap-4 min-h-52">
        {phase === 'idle' && <p className="text-gray-400 mt-6">Pressione "Iniciar"</p>}
        {phase !== 'idle' && (
          <>
            <p className="text-gray-400 text-sm">Rodada {Math.min(round, SIMON_ROUNDS)}/{SIMON_ROUNDS}</p>
            <div className="grid grid-cols-2 gap-3">
              {SIMON_COLORS.map((c, i) => (
                <button key={i} onClick={() => handleColor(i)} disabled={phase !== 'input'}
                  className={`w-24 h-24 rounded-2xl font-bold text-white text-xs shadow-lg transition-all
                    ${active === i ? c.active + ' scale-110' : c.bg}
                    ${phase === 'input' ? 'hover:opacity-90 cursor-pointer' : 'cursor-default opacity-80'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            {phase === 'showing' && <p className="text-yellow-300 text-sm animate-pulse">Observe a sequência...</p>}
            {phase === 'input' && <p className="text-green-300 text-sm font-semibold">Sua vez! Repita a sequência.</p>}
            {phase === 'fail' && <p className="text-red-400 font-bold">Sequência errada! {round - 1}/{SIMON_ROUNDS} rodadas.</p>}
            {phase === 'done' && <p className="text-green-400 font-bold">Parabéns! Completou todas as rodadas!</p>}
          </>
        )}
      </div>
      {phase === 'idle' && <Button onClick={start} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>}
    </div>
  );
}

// ── Precisão ────────────────────────────────────────────────────
const PREC_TOTAL = 10;
const PREC_SECS = 20;

function PrecisaoTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [targets] = useState(() =>
    Array.from({ length: PREC_TOTAL }, (_, i) => ({ id: i, x: 8 + Math.random() * 84, y: 8 + Math.random() * 84 }))
  );
  const [hit, setHit] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(PREC_SECS);
  const hitRef = useRef<Set<number>>(new Set());

  const start = () => { hitRef.current = new Set(); setHit(new Set()); setTimeLeft(PREC_SECS); setPhase('running'); };

  useEffect(() => {
    if (phase !== 'running') return;
    if (timeLeft <= 0) {
      setPhase('done');
      onDone({ score: Math.round((hitRef.current.size / PREC_TOTAL) * 100), label: `${hitRef.current.size}/${PREC_TOTAL} acertos` });
      return;
    }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleHit = (id: number) => {
    if (phase !== 'running' || hitRef.current.has(id)) return;
    const next = new Set([...hitRef.current, id]);
    hitRef.current = next;
    setHit(new Set(next));
    if (next.size === PREC_TOTAL) {
      setPhase('done');
      onDone({ score: 100, label: `${PREC_TOTAL}/${PREC_TOTAL} acertos` });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300">Clique em todos os {PREC_TOTAL} alvos antes do tempo acabar.</p>
      {phase !== 'idle' && (
        <div className="flex items-center gap-2">
          <Progress value={(timeLeft / PREC_SECS) * 100} className="flex-1 h-2" />
          <span className="text-white text-sm font-bold">{timeLeft}s | {hit.size}/{PREC_TOTAL}</span>
        </div>
      )}
      <div className="relative bg-black/40 rounded-xl overflow-hidden" style={{ height: '210px' }}>
        {phase === 'idle' && (
          <div className="flex items-center justify-center h-full"><p className="text-gray-400">Pressione "Iniciar"</p></div>
        )}
        {(phase === 'running' || phase === 'done') && targets.map(t => (
          <button key={t.id} onClick={() => handleHit(t.id)}
            disabled={hit.has(t.id) || phase === 'done'}
            className={`absolute w-11 h-11 rounded-full text-xs font-bold transition-all ${
              hit.has(t.id)
                ? 'bg-green-600/60 border border-green-500/40 cursor-default scale-90 text-green-300'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 hover:scale-110 cursor-pointer text-white'
            }`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}>
            {hit.has(t.id) ? '\\u2713' : t.id + 1}
          </button>
        ))}
        {phase === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{hit.size}/{PREC_TOTAL}</p>
              <p className="text-gray-400 text-sm">acertos</p>
            </div>
          </div>
        )}
      </div>
      {phase === 'idle' && <Button onClick={start} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>}
    </div>
  );
}

// ── Trajetória ──────────────────────────────────────────────────
const TRAJ_DOTS = [
  { id: 0, x: 8,  y: 30 }, { id: 1, x: 22, y: 70 }, { id: 2, x: 36, y: 30 },
  { id: 3, x: 50, y: 70 }, { id: 4, x: 64, y: 30 }, { id: 5, x: 78, y: 70 }, { id: 6, x: 92, y: 30 },
];

function TrajetoriaTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [clicked, setClicked] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const N = TRAJ_DOTS.length;

  const handleDot = (id: number) => {
    if (phase !== 'running') return;
    if (id === clicked.length) {
      const next = [...clicked, id];
      setClicked(next);
      if (next.length === N) {
        setPhase('done');
        onDone({ score: Math.max(0, Math.round(((N - errors) / N) * 100)), label: `${errors} erros` });
      }
    } else {
      setErrors(e => e + 1);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300">Clique nos pontos numerados <span className="text-cyan-400 font-bold">em ordem</span> seguindo o caminho.</p>
      <div className="relative bg-black/40 rounded-xl overflow-hidden" style={{ height: '190px' }}>
        {phase === 'idle' && (
          <div className="flex items-center justify-center h-full"><p className="text-gray-400">Pressione "Iniciar"</p></div>
        )}
        {phase !== 'idle' && (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {TRAJ_DOTS.slice(0, -1).map((d, i) => (
                <line key={i}
                  x1={`${d.x}%`} y1={`${d.y}%`}
                  x2={`${TRAJ_DOTS[i+1].x}%`} y2={`${TRAJ_DOTS[i+1].y}%`}
                  stroke={clicked.length > i + 1 ? '#22c55e' : '#374151'}
                  strokeWidth="2"
                  strokeDasharray={clicked.length <= i ? '5 5' : '0'} />
              ))}
            </svg>
            {TRAJ_DOTS.map(d => {
              const isDone = clicked.includes(d.id);
              const isCurrent = d.id === clicked.length && phase === 'running';
              return (
                <button key={d.id} onClick={() => handleDot(d.id)}
                  className={`absolute w-10 h-10 rounded-full border-2 text-sm font-bold transition-all
                    ${isDone ? 'bg-green-500 border-green-400 text-white scale-90' :
                      isCurrent ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-pulse scale-110' :
                      'bg-gray-700/50 border-gray-500 text-gray-400'}`}
                  style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}>
                  {d.id + 1}
                </button>
              );
            })}
          </>
        )}
        {phase === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <p className="text-green-400 font-bold text-xl">Concluído! {errors} erros.</p>
          </div>
        )}
      </div>
      {phase === 'running' && <p className="text-center text-sm text-gray-400">{clicked.length}/{N} pontos | {errors} erros</p>}
      {phase === 'idle' && <Button onClick={() => setPhase('running')} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>}
    </div>
  );
}

// ── Velocidade ──────────────────────────────────────────────────
const SPEED_SECS = 15;

function VelocidadeTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [timeLeft, setTimeLeft] = useState(SPEED_SECS);
  const [displayClicks, setDisplayClicks] = useState(0);
  const clicksRef = useRef(0);
  const doneRef = useRef(false);

  const newPos = () => setPos({ x: 12 + Math.random() * 76, y: 12 + Math.random() * 76 });

  const start = () => {
    clicksRef.current = 0;
    doneRef.current = false;
    setDisplayClicks(0);
    setTimeLeft(SPEED_SECS);
    newPos();
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => setTimeLeft(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && timeLeft === 0 && !doneRef.current) {
      doneRef.current = true;
      const c = clicksRef.current;
      setPhase('done');
      onDone({ score: Math.min(100, Math.round((c / 25) * 100)), label: `${c} cliques em ${SPEED_SECS}s` });
    }
  }, [timeLeft, phase]);

  const handleClick = () => {
    if (phase !== 'running') return;
    clicksRef.current += 1;
    setDisplayClicks(clicksRef.current);
    newPos();
  };

  const speedRating = displayClicks < 10 ? 'Continue praticando!' : displayClicks < 20 ? 'Bom resultado!' : 'Excelente velocidade!';

  return (
    <div className="space-y-4">
      <p className="text-gray-300">Clique no alvo o máximo de vezes em {SPEED_SECS} segundos. Ele se move a cada clique!</p>
      {phase === 'running' && (
        <div className="flex items-center gap-2">
          <Progress value={(timeLeft / SPEED_SECS) * 100} className="flex-1 h-2" />
          <span className="text-white font-bold text-sm w-28 text-right">{timeLeft}s | {displayClicks} cliques</span>
        </div>
      )}
      <div className="relative bg-black/40 rounded-xl overflow-hidden" style={{ height: '210px' }}>
        {phase === 'idle' && (
          <div className="flex items-center justify-center h-full"><p className="text-gray-400">Pressione "Iniciar"</p></div>
        )}
        {phase === 'running' && (
          <button onClick={handleClick}
            className="absolute w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
            <Zap className="w-6 h-6 text-white mx-auto" />
          </button>
        )}
        {phase === 'done' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-400 mb-1">{displayClicks}</p>
              <p className="text-gray-400 text-sm">cliques em {SPEED_SECS} segundos</p>
              <p className="text-gray-500 text-xs mt-1">{speedRating}</p>
            </div>
          </div>
        )}
      </div>
      {phase === 'idle' && <Button onClick={start} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">Iniciar</Button>}
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────────
export function CognitionTest() {
  const [category, setCategory] = useState<TestCategory>('reacao');
  const [result, setResult] = useState<TestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [testKey, setTestKey] = useState(0);

  const handleDone = (r: TestResult) => setResult(r);
  const reset = () => { setResult(null); setTestKey(k => k + 1); };
  const changeCategory = (v: string) => { setCategory(v as TestCategory); reset(); };
  const isCognition = ['reacao', 'memoria', 'atencao', 'sequencia'].includes(category);

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      if (isCognition) {
        await saveTestResult({
          id: nanoid(), type: 'cognition',
          category: category as CognitionTestType['category'],
          value: result.label, score: result.score, timestamp: Date.now(),
        } as CognitionTestType);
      } else {
        await saveTestResult({
          id: nanoid(), type: 'coordination',
          category: category as CoordinationTestType['category'],
          value: result.label, score: result.score, timestamp: Date.now(),
        } as CoordinationTestType);
      }
      toast.success('Resultado salvo!');
      reset();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const renderTest = () => {
    const props = { onDone: handleDone, key: testKey };
    switch (category) {
      case 'reacao':     return <ReacaoTest {...props} />;
      case 'memoria':    return <MemoriaTest {...props} />;
      case 'atencao':    return <AtencaoTest {...props} />;
      case 'sequencia':  return <SequenciaTest {...props} />;
      case 'precisao':   return <PrecisaoTest {...props} />;
      case 'trajetoria': return <TrajetoriaTest {...props} />;
      case 'velocidade': return <VelocidadeTest {...props} />;
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">
            {isCognition ? 'Teste de Cognição' : 'Teste de Coordenação'}
          </h2>
        </div>

        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-100">
            Indicativo apenas. Resultados podem variar conforme seu estado físico e mental.
          </p>
        </div>

        <Tabs value={category} onValueChange={changeCategory}>
          <TabsList className="grid w-full grid-cols-7 bg-purple-900/30 border border-purple-500/30">
            <TabsTrigger value="reacao"     className="text-xs">Reação</TabsTrigger>
            <TabsTrigger value="memoria"    className="text-xs">Memória</TabsTrigger>
            <TabsTrigger value="atencao"    className="text-xs">Atenção</TabsTrigger>
            <TabsTrigger value="sequencia"  className="text-xs">Sequência</TabsTrigger>
            <TabsTrigger value="precisao"   className="text-xs">Precisão</TabsTrigger>
            <TabsTrigger value="trajetoria" className="text-xs">Trajetória</TabsTrigger>
            <TabsTrigger value="velocidade" className="text-xs">Velocidade</TabsTrigger>
          </TabsList>

          <TabsContent value={category} className="mt-6">
            {renderTest()}
          </TabsContent>
        </Tabs>

        {result && (
          <div className="flex gap-3 mt-6">
            <div className="flex-1 p-3 bg-black/30 rounded-lg border border-white/5">
              <p className="text-gray-400 text-xs mb-1">Resultado</p>
              <p className="text-white font-bold">{result.label}</p>
              <p className="text-gray-500 text-xs">Pontuação: {result.score}/100</p>
            </div>
            <Button onClick={handleSave} disabled={saving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button onClick={reset} variant="outline" className="border-purple-500/30 text-purple-300">
              Repetir
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
"""

# Fix the unicode escape that was needed to avoid Python string issues
content = content.replace("'\\\\u2713'", "'\\u2713'")

with open('client/src/components/tests/CognitionTest.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('Written', len(content.splitlines()), 'lines')
