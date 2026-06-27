import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Eye, AlertCircle, RotateCcw } from 'lucide-react';
import { saveTestResult } from '@/lib/db';
import { VisionTest as VisionTestType } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

type Phase = 'idle' | 'running' | 'done';

// Snellen chart rows — largest to smallest
const SNELLEN_ROWS = [
  { letters: 'E', size: 72, label: '20/200', score: 5 },
  { letters: 'F P', size: 56, label: '20/100', score: 15 },
  { letters: 'T O Z', size: 44, label: '20/70', score: 30 },
  { letters: 'L P E D', size: 32, label: '20/50', score: 45 },
  { letters: 'P E C F D', size: 24, label: '20/40', score: 60 },
  { letters: 'E D F C Z P', size: 18, label: '20/30', score: 75 },
  { letters: 'F E L O P Z D', size: 14, label: '20/25', score: 88 },
  { letters: 'D E F P O T E C', size: 11, label: '20/20', score: 100 },
];

// Color blindness plates (simplified Ishihara-style)
const COLOR_PLATES = [
  { number: '6',  dotColor: '#cc2222', bgColor: '#44aa44', options: ['6', '9', '8', 'Nenhum'] },
  { number: '74', dotColor: '#2244cc', bgColor: '#dd8822', options: ['74', '21', '47', 'Nenhum'] },
  { number: '29', dotColor: '#aa33cc', bgColor: '#55aa55', options: ['29', '92', '62', 'Nenhum'] },
];

// Contrast text levels
const CONTRAST_LEVELS = [
  { opacity: 1.00, label: 'Nível 1 — Contraste máximo',    score: 20 },
  { opacity: 0.65, label: 'Nível 2 — Contraste médio',     score: 45 },
  { opacity: 0.35, label: 'Nível 3 — Contraste baixo',     score: 65 },
  { opacity: 0.18, label: 'Nível 4 — Contraste muito baixo', score: 85 },
  { opacity: 0.08, label: 'Nível 5 — Contraste mínimo',    score: 100 },
];

// Near-vision options
const PROXIMITY_OPTIONS = [
  { label: 'Só consigo ler texto grande (18px)',         result: 'Presbiopia avançada',   score: 20 },
  { label: 'Consigo ler texto médio (14px)',             result: 'Presbiopia moderada',   score: 45 },
  { label: 'Consigo ler texto pequeno (11px)',           result: 'Presbiopia leve',       score: 70 },
  { label: 'Consigo ler texto muito pequeno (8px)',      result: 'Visão de perto normal', score: 100 },
];

type VisionTestCategory = 'acuidade' | 'daltonismo' | 'astigmatismo' | 'contraste' | 'proximidade';

export function VisionTest() {
  const [category, setCategory] = useState<VisionTestCategory>('acuidade');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState('');
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);

  // Daltonismo multi-round state
  const [plateIndex, setPlateIndex] = useState(0);
  const [plateCorrect, setPlateCorrect] = useState(0);

  const resetTest = () => {
    setPhase('idle');
    setResult('');
    setScore(0);
    setPlateIndex(0);
    setPlateCorrect(0);
  };

  const finishTest = (res: string, sc: number) => {
    setResult(res);
    setScore(sc);
    setPhase('done');
  };

  // ── Acuidade ──
  const handleAcuidadeSelect = (row: typeof SNELLEN_ROWS[0]) => finishTest(row.label, row.score);

  // ── Daltonismo ──
  const handleColorAnswer = (answer: string) => {
    const plate = COLOR_PLATES[plateIndex];
    const newCorrect = plateCorrect + (answer === plate.number ? 1 : 0);
    setPlateCorrect(newCorrect);

    if (plateIndex + 1 >= COLOR_PLATES.length) {
      const pct = Math.round((newCorrect / COLOR_PLATES.length) * 100);
      finishTest(
        pct === 100
          ? 'Normal — Visão de cores preservada'
          : pct >= 67
          ? 'Possível daltonismo leve'
          : 'Possível deficiência de cor significativa',
        pct,
      );
    } else {
      setPlateIndex(plateIndex + 1);
    }
  };

  // ── Astigmatismo ──
  const handleAstigResponse = (opt: 'iguais' | 'algumas' | 'muito') => {
    const map = {
      iguais: { result: 'Sem astigmatismo detectado',          score: 95 },
      algumas: { result: 'Possível astigmatismo leve',          score: 60 },
      muito:  { result: 'Possível astigmatismo significativo', score: 30 },
    };
    finishTest(map[opt].result, map[opt].score);
  };

  // ── Salvar ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const testResult: VisionTestType = {
        id: nanoid(), type: 'vision', category, value: result, score, timestamp: Date.now(),
      };
      await saveTestResult(testResult);
      toast.success('Resultado salvo com sucesso!');
      resetTest();
    } catch {
      toast.error('Erro ao salvar resultado');
    } finally {
      setSaving(false);
    }
  };

  // ── Renderers ──

  const renderAcuidade = () => (
    <div className="space-y-3">
      <p className="text-gray-300 text-sm">
        Fique a ~40 cm da tela. Clique na <strong>menor linha que você consegue ler com clareza</strong>.
      </p>
      <div className="bg-white rounded-lg p-5 space-y-1 text-center">
        {SNELLEN_ROWS.map((row) => (
          <button
            key={row.label}
            onClick={() => handleAcuidadeSelect(row)}
            className="w-full rounded py-0.5 hover:bg-blue-100 transition-colors text-black font-mono tracking-widest block"
            style={{ fontSize: row.size, lineHeight: 1.15 }}
          >
            {row.letters}
          </button>
        ))}
      </div>
      <p className="text-gray-500 text-xs text-center">↑ Clique na menor linha legível</p>
    </div>
  );

  const renderDaltonismo = () => {
    const plate = COLOR_PLATES[plateIndex];
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Placa {plateIndex + 1} de {COLOR_PLATES.length}</span>
          <span>Acertos: {plateCorrect}</span>
        </div>
        <Progress value={(plateIndex / COLOR_PLATES.length) * 100} className="h-2" />
        <p className="text-gray-300 text-sm text-center">Qual número você vê no círculo?</p>
        <div className="flex justify-center">
          <div
            className="w-44 h-44 rounded-full flex items-center justify-center text-5xl font-black border-4 border-gray-600 select-none"
            style={{ backgroundColor: plate.bgColor, color: plate.dotColor }}
          >
            {plate.number}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {plate.options.map((opt) => (
            <Button key={opt} onClick={() => handleColorAnswer(opt)} variant="outline"
              className="border-purple-500/30 text-white hover:bg-purple-500/20 text-lg py-4">
              {opt}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderAstigmatismo = () => (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">
        Olhe para o <strong>ponto central</strong> da figura. Alguma linha parece mais escura, grossa ou diferente?
      </p>
      <div className="bg-white rounded-lg p-4 flex justify-center">
        <svg width="220" height="220" viewBox="-110 -110 220 220">
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i * Math.PI) / 18;
            return (
              <line key={i}
                x1={Math.cos(angle) * 100} y1={Math.sin(angle) * 100}
                x2={Math.cos(angle + Math.PI) * 100} y2={Math.sin(angle + Math.PI) * 100}
                stroke="#111" strokeWidth="1.5"
              />
            );
          })}
          <circle cx="0" cy="0" r="5" fill="#333" />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => handleAstigResponse('iguais')}
          className="bg-green-600/80 hover:bg-green-700 text-white h-auto py-3 text-sm">
          Todas iguais
        </Button>
        <Button onClick={() => handleAstigResponse('algumas')}
          className="bg-yellow-600/80 hover:bg-yellow-700 text-white h-auto py-3 text-sm">
          Algumas diferentes
        </Button>
        <Button onClick={() => handleAstigResponse('muito')}
          className="bg-red-600/80 hover:bg-red-700 text-white h-auto py-3 text-sm">
          Muito diferentes
        </Button>
      </div>
    </div>
  );

  const renderContraste = () => (
    <div className="space-y-3">
      <p className="text-gray-300 text-sm">
        Clique no <strong>último nível que você ainda consegue ler o texto</strong> com clareza.
      </p>
      {CONTRAST_LEVELS.map((level) => (
        <button key={level.label} onClick={() => finishTest(level.label, level.score)}
          className="w-full bg-white rounded-lg p-3 hover:ring-2 hover:ring-purple-400 transition-all text-left">
          <p className="font-mono font-bold text-base text-center" style={{ opacity: level.opacity, color: '#000' }}>
            AUTOAVALIAÇÃO SENSORIAL
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">{level.label}</p>
        </button>
      ))}
    </div>
  );

  const renderProximidade = () => (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">
        Fique a ~30–35 cm da tela. Qual é o menor texto que você lê com nitidez?
      </p>
      <div className="bg-white rounded-lg p-5 text-black text-center space-y-2">
        <p style={{ fontSize: 18 }}>Texto 18px — leitura fácil</p>
        <p style={{ fontSize: 14 }}>Texto 14px — leitura normal</p>
        <p style={{ fontSize: 11 }}>Texto 11px — leitura pequena</p>
        <p style={{ fontSize: 8 }}>Texto 8px — muito pequeno</p>
      </div>
      <div className="space-y-2">
        {PROXIMITY_OPTIONS.map((opt) => (
          <Button key={opt.result} onClick={() => finishTest(opt.result, opt.score)}
            variant="outline"
            className="w-full border-purple-500/30 text-white hover:bg-purple-500/20 text-sm h-auto py-3 justify-start">
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="bg-black/40 rounded-lg p-8 text-center flex flex-col items-center gap-4 min-h-48">
      <div className="text-5xl">{score >= 70 ? '✅' : score >= 40 ? '⚠️' : '❌'}</div>
      <p className="text-2xl font-bold text-cyan-400">{result}</p>
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Pontuação</span><span>{score}/100</span>
        </div>
        <Progress value={score} className="h-3" />
      </div>
      <p className="text-gray-400 text-sm">
        {score >= 70 ? 'Resultado dentro da normalidade.'
          : score >= 40 ? 'Pode haver alteração — acompanhe.'
          : 'Considere consultar um oftalmologista.'}
      </p>
    </div>
  );

  const renderIdle = () => (
    <div className="bg-black/40 rounded-lg p-10 text-center flex flex-col items-center gap-3 min-h-48">
      <Eye className="w-14 h-14 text-purple-400 opacity-40" />
      <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
      <p className="text-gray-500 text-sm">Siga as instruções que aparecerem na tela</p>
    </div>
  );

  const renderContent = () => {
    if (phase === 'idle') return renderIdle();
    if (phase === 'done') return renderResult();
    switch (category) {
      case 'acuidade':    return renderAcuidade();
      case 'daltonismo':  return renderDaltonismo();
      case 'astigmatismo': return renderAstigmatismo();
      case 'contraste':   return renderContraste();
      case 'proximidade': return renderProximidade();
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Teste de Visão</h2>
        </div>

        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-100">
            Indicativo apenas. Para avaliação profissional, consulte um oftalmologista.
          </p>
        </div>

        <Tabs value={category} onValueChange={(val) => { setCategory(val as VisionTestCategory); resetTest(); }}>
          <TabsList className="grid w-full grid-cols-5 bg-purple-900/30 border border-purple-500/30">
            <TabsTrigger value="acuidade"    className="text-xs">Acuidade</TabsTrigger>
            <TabsTrigger value="daltonismo"  className="text-xs">Daltonismo</TabsTrigger>
            <TabsTrigger value="astigmatismo" className="text-xs">Astigmatismo</TabsTrigger>
            <TabsTrigger value="contraste"   className="text-xs">Contraste</TabsTrigger>
            <TabsTrigger value="proximidade" className="text-xs">Proximidade</TabsTrigger>
          </TabsList>

          {(['acuidade', 'daltonismo', 'astigmatismo', 'contraste', 'proximidade'] as VisionTestCategory[]).map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6">{renderContent()}</TabsContent>
          ))}
        </Tabs>

        <div className="flex gap-3 mt-6">
          {phase === 'idle' && (
            <Button onClick={() => setPhase('running')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold">
              Iniciar Teste
            </Button>
          )}
          {phase === 'done' && (
            <>
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold">
                {saving ? 'Salvando...' : 'Salvar Resultado'}
              </Button>
              <Button onClick={resetTest} variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                <RotateCcw className="w-4 h-4 mr-2" />Repetir
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
