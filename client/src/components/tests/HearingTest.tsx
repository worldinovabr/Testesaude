import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Volume2, AlertCircle, Headphones, RotateCcw } from 'lucide-react';
import { saveTestResult } from '@/lib/db';
import { HearingTest as HearingTestType } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

type HearingTestCategory = 'frequencia' | 'equilibrio' | 'palavras' | 'ruido';
type Phase = 'idle' | 'running' | 'done';

// Frequencies to test (Hz) in ascending order
const FREQUENCIES = [1000, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000];

// Words for speech recognition test
const TEST_WORDS = ['casa', 'bola', 'porta', 'mesa', 'livro'];

// â”€â”€ Audio helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function playTone(frequency: number, duration: number, pan = 0, volume = 0.15): (() => void) {
  try {
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return () => {};
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    panner.pan.value = pan;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    const id = setTimeout(() => { try { ctx.close(); } catch { /* empty */ } }, (duration + 0.6) * 1000);
    return () => { clearTimeout(id); try { ctx.close(); } catch { /* empty */ } };
  } catch {
    return () => {};
  }
}

function playNoiseWithOptionalTone(duration: number, hasTone: boolean, toneFreq = 800): (() => void) {
  try {
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return () => {};
    const ctx = new AudioCtx();

    // White noise
    const bufLen = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);

    if (hasTone) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = toneFreq;
      const toneGain = ctx.createGain();
      toneGain.gain.value = 0.035;
      osc.connect(toneGain);
      toneGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }

    const id = setTimeout(() => { try { ctx.close(); } catch { /* empty */ } }, (duration + 0.6) * 1000);
    return () => { clearTimeout(id); try { ctx.close(); } catch { /* empty */ } };
  } catch {
    return () => {};
  }
}

function speakWord(word: string) {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = 'pt-BR';
  utt.rate = 0.85;
  utt.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function HearingTest() {
  const [category, setCategory] = useState<HearingTestCategory>('frequencia');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState('');
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);

  // FrequÃªncia
  const [freqStep, setFreqStep] = useState(0);

  // EquilÃ­brio
  const [balanceStep, setBalanceStep] = useState(0); // 0=left, 1=right
  const [balanceResults, setBalanceResults] = useState<boolean[]>([]);

  // Palavras
  const [wordIndex, setWordIndex] = useState(0);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [wordCorrect, setWordCorrect] = useState(0);

  // RuÃ­do
  const [noiseAttempt, setNoiseAttempt] = useState(0);
  const [noiseCorrect, setNoiseCorrect] = useState(0);
  const noiseHasToneRef = useRef(false);

  const stopAudio = useRef<(() => void)>(() => {});

  const resetTest = () => {
    stopAudio.current();
    setPhase('idle');
    setResult('');
    setScore(0);
    setPlaying(false);
    setFreqStep(0);
    setBalanceStep(0);
    setBalanceResults([]);
    setWordIndex(0);
    setWordOptions([]);
    setWordCorrect(0);
    setNoiseAttempt(0);
    setNoiseCorrect(0);
    noiseHasToneRef.current = false;
  };

  const finishTest = (res: string, sc: number) => {
    setResult(res);
    setScore(sc);
    setPhase('done');
  };

  const withPlaying = (fn: () => (() => void), durationMs: number) => {
    stopAudio.current();
    setPlaying(true);
    const stop = fn();
    stopAudio.current = stop;
    setTimeout(() => { setPlaying(false); stopAudio.current = () => {}; }, durationMs);
  };

  // â”€â”€ FrequÃªncia â”€â”€

  const freqScoreMap: Record<number, number> = {
    16000: 100, 14000: 90, 12000: 80, 10000: 70,
    8000: 55, 6000: 40, 4000: 25, 2000: 15, 1000: 5,
  };

  const finishFreqTest = (maxHz: number) => {
    finishTest(maxHz > 0 ? `AtÃ© ${maxHz} Hz` : 'Abaixo de 1000 Hz', freqScoreMap[maxHz] ?? 0);
  };

  const handleFreqPlay = () =>
    withPlaying(() => playTone(FREQUENCIES[freqStep], 2.0), 2200);

  const handleFreqHeard = (heard: boolean) => {
    if (heard) {
      if (freqStep + 1 >= FREQUENCIES.length) {
        finishFreqTest(FREQUENCIES[freqStep]);
      } else {
        setFreqStep(freqStep + 1);
      }
    } else {
      finishFreqTest(freqStep > 0 ? FREQUENCIES[freqStep - 1] : 0);
    }
  };

  // â”€â”€ EquilÃ­brio â”€â”€

  const handleBalancePlay = () => {
    const pan = balanceStep === 0 ? -1 : 1;
    withPlaying(() => playTone(1000, 2.0, pan, 0.2), 2200);
  };

  const handleBalanceResponse = (heard: boolean) => {
    const newResults = [...balanceResults, heard];
    setBalanceResults(newResults);
    if (balanceStep + 1 >= 2) {
      const [heardL, heardR] = [newResults[0], newResults[1]];
      let res = 'EquilÃ­brio auditivo normal';
      let sc = 90;
      if (heardL && !heardR)  { res = 'PossÃ­vel diferenÃ§a no ouvido direito';   sc = 50; }
      if (!heardL && heardR)  { res = 'PossÃ­vel diferenÃ§a no ouvido esquerdo';  sc = 50; }
      if (!heardL && !heardR) { res = 'AudiÃ§Ã£o muito baixa em ambos os lados';  sc = 20; }
      finishTest(res, sc);
    } else {
      setBalanceStep(1);
    }
  };

  // â”€â”€ Palavras â”€â”€

  const makeWordOptions = (word: string) =>
    shuffled([word, ...shuffled(TEST_WORDS.filter(w => w !== word)).slice(0, 3)]);

  const startPalavras = () => {
    setWordIndex(0);
    setWordCorrect(0);
    setWordOptions(makeWordOptions(TEST_WORDS[0]));
    setPhase('running');
  };

  const handleWordPlay = () => {
    speakWord(TEST_WORDS[wordIndex]);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 1500);
  };

  const handleWordAnswer = (answer: string) => {
    const correct = answer === TEST_WORDS[wordIndex];
    const newCorrect = wordCorrect + (correct ? 1 : 0);
    setWordCorrect(newCorrect);
    if (wordIndex + 1 >= TEST_WORDS.length) {
      const pct = Math.round((newCorrect / TEST_WORDS.length) * 100);
      finishTest(`${newCorrect}/${TEST_WORDS.length} palavras corretas`, pct);
    } else {
      const next = wordIndex + 1;
      setWordIndex(next);
      setWordOptions(makeWordOptions(TEST_WORDS[next]));
    }
  };

  // â”€â”€ RuÃ­do â”€â”€

  const handleNoisePlay = () => {
    const hasTone = Math.random() > 0.35;
    noiseHasToneRef.current = hasTone;
    withPlaying(() => playNoiseWithOptionalTone(2.0, hasTone), 2200);
  };

  const handleNoiseResponse = (heardTone: boolean) => {
    const correct = heardTone === noiseHasToneRef.current;
    const newCorrect = noiseCorrect + (correct ? 1 : 0);
    const newAttempt = noiseAttempt + 1;
    setNoiseCorrect(newCorrect);
    setNoiseAttempt(newAttempt);

    if (newAttempt >= 5) {
      const pct = Math.round((newCorrect / newAttempt) * 100);
      finishTest(`${newCorrect}/5 corretos com ruÃ­do`, pct);
    } else {
      // pre-decide next round
      noiseHasToneRef.current = Math.random() > 0.35;
    }
  };

  // â”€â”€ Salvar â”€â”€

  const handleSave = async () => {
    setSaving(true);
    try {
      const testResult: HearingTestType = {
        id: nanoid(), type: 'hearing', category, value: result, timestamp: Date.now(),
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

  // â”€â”€ Renderers â”€â”€

  const renderFrequencia = () => (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-400">
        <span>FrequÃªncia: <strong className="text-cyan-400">{FREQUENCIES[freqStep]} Hz</strong></span>
        <span>Passo {freqStep + 1}/{FREQUENCIES.length}</span>
      </div>
      <Progress value={(freqStep / FREQUENCIES.length) * 100} className="h-2" />
      <div className="bg-black/40 rounded-lg p-6 text-center space-y-4">
        <Headphones className="w-14 h-14 text-cyan-400 mx-auto opacity-80" />
        <p className="text-gray-300 text-sm">
          Clique em <strong>Reproduzir</strong> e indique se consegue ouvir o tom em{' '}
          <strong>{FREQUENCIES[freqStep]} Hz</strong>.
        </p>
        <p className="text-gray-500 text-xs">Use fones de ouvido para maior precisÃ£o.</p>
        <Button onClick={handleFreqPlay} disabled={playing}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
          {playing ? 'â–¶ Reproduzindoâ€¦' : 'â–¶ Reproduzir Tom'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => handleFreqHeard(true)} disabled={playing}
          className="bg-green-600/80 hover:bg-green-700 text-white">
          âœ“ Consigo ouvir
        </Button>
        <Button onClick={() => handleFreqHeard(false)} disabled={playing} variant="outline"
          className="border-red-500/30 text-red-300 hover:bg-red-500/20">
          âœ— NÃ£o consigo ouvir
        </Button>
      </div>
    </div>
  );

  const renderEquilibrio = () => {
    const side = balanceStep === 0 ? 'Esquerdo' : 'Direito';
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Testando: <strong className="text-cyan-400">Ouvido {side}</strong></span>
          <span>Passo {balanceStep + 1}/2</span>
        </div>
        <Progress value={(balanceStep / 2) * 100} className="h-2" />
        <div className="bg-black/40 rounded-lg p-6 text-center space-y-4">
          <Headphones className="w-14 h-14 text-cyan-400 mx-auto opacity-80" />
          <p className="text-gray-300 text-sm">
            O som tocarÃ¡ <strong>apenas no ouvido {side.toLowerCase()}</strong>.
            Consegue ouvi-lo claramente?
          </p>
          <Button onClick={handleBalancePlay} disabled={playing}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
            {playing ? 'â–¶ Reproduzindoâ€¦' : 'â–¶ Reproduzir Som'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleBalanceResponse(true)} disabled={playing}
            className="bg-green-600/80 hover:bg-green-700 text-white">
            âœ“ Ouvi claramente
          </Button>
          <Button onClick={() => handleBalanceResponse(false)} disabled={playing} variant="outline"
            className="border-red-500/30 text-red-300 hover:bg-red-500/20">
            âœ— NÃ£o ouvi bem
          </Button>
        </div>
      </div>
    );
  };

  const renderPalavras = () => (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-400">
        <span>Palavra {wordIndex + 1}/{TEST_WORDS.length}</span>
        <span>Acertos: {wordCorrect}</span>
      </div>
      <Progress value={(wordIndex / TEST_WORDS.length) * 100} className="h-2" />
      <div className="bg-black/40 rounded-lg p-6 text-center space-y-3">
        <p className="text-gray-300 text-sm">
          Clique em <strong>Reproduzir</strong> e selecione a palavra que vocÃª ouviu.
        </p>
        {'speechSynthesis' in window ? (
          <Button onClick={handleWordPlay} disabled={playing}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
            {playing ? 'â–¶ Reproduzindoâ€¦' : 'â–¶ Reproduzir Palavra'}
          </Button>
        ) : (
          <p className="text-yellow-400 text-sm">SÃ­ntese de voz nÃ£o disponÃ­vel neste navegador.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {wordOptions.map((opt) => (
          <Button key={opt} onClick={() => handleWordAnswer(opt)} variant="outline"
            className="border-cyan-500/30 text-white hover:bg-cyan-500/20 text-lg py-4 capitalize">
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderRuido = () => (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-400">
        <span>Tentativa {noiseAttempt + 1}/5</span>
        <span>Acertos: {noiseCorrect}</span>
      </div>
      <Progress value={(noiseAttempt / 5) * 100} className="h-2" />
      <div className="bg-black/40 rounded-lg p-6 text-center space-y-3">
        <p className="text-gray-300 text-sm">
          OuÃ§a o som. HÃ¡ um <strong>tom puro</strong> misturado ao ruÃ­do de fundo?
        </p>
        <Button onClick={handleNoisePlay} disabled={playing}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
          {playing ? 'â–¶ Reproduzindoâ€¦' : 'â–¶ Reproduzir'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => handleNoiseResponse(true)} disabled={playing}
          className="bg-green-600/80 hover:bg-green-700 text-white">
          âœ“ Ouvi um tom
        </Button>
        <Button onClick={() => handleNoiseResponse(false)} disabled={playing} variant="outline"
          className="border-red-500/30 text-red-300 hover:bg-red-500/20">
          âœ— SÃ³ ruÃ­do
        </Button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="bg-black/40 rounded-lg p-8 text-center flex flex-col items-center gap-4 min-h-48">
      <div className="text-5xl">{score >= 70 ? 'âœ…' : score >= 40 ? 'âš ï¸' : 'âŒ'}</div>
      <p className="text-2xl font-bold text-cyan-400">{result}</p>
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>PontuaÃ§Ã£o</span><span>{score}/100</span>
        </div>
        <Progress value={score} className="h-3" />
      </div>
      <p className="text-gray-400 text-sm">
        {score >= 70 ? 'Resultado dentro da normalidade.'
          : score >= 40 ? 'Pode haver alguma alteraÃ§Ã£o â€” acompanhe.'
          : 'Considere consultar um fonoaudiÃ³logo ou otorrinolaringologista.'}
      </p>
    </div>
  );

  const renderIdle = () => (
    <div className="bg-black/40 rounded-lg p-10 text-center flex flex-col items-center gap-3 min-h-48">
      <Volume2 className="w-14 h-14 text-cyan-400 opacity-40" />
      <p className="text-gray-400">Clique em "Iniciar Teste" para comeÃ§ar</p>
      <p className="text-gray-500 text-sm">Use fones de ouvido para melhores resultados</p>
    </div>
  );

  const renderContent = () => {
    if (phase === 'idle') return renderIdle();
    if (phase === 'done') return renderResult();
    switch (category) {
      case 'frequencia': return renderFrequencia();
      case 'equilibrio': return renderEquilibrio();
      case 'palavras':   return renderPalavras();
      case 'ruido':      return renderRuido();
    }
  };

  const handleStart = () => {
    resetTest();
    if (category === 'palavras') {
      startPalavras();
    } else {
      setPhase('running');
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-cyan-500/30">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Teste de AudiÃ§Ã£o</h2>
        </div>

        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-100">
            Use fones de ouvido de qualidade. A precisÃ£o depende do equipamento e do ambiente.
          </p>
        </div>

        <Tabs value={category} onValueChange={(val) => { setCategory(val as HearingTestCategory); resetTest(); }}>
          <TabsList className="grid w-full grid-cols-4 bg-cyan-900/30 border border-cyan-500/30">
            <TabsTrigger value="frequencia" className="text-xs">FrequÃªncia</TabsTrigger>
            <TabsTrigger value="equilibrio" className="text-xs">EquilÃ­brio</TabsTrigger>
            <TabsTrigger value="palavras"   className="text-xs">Palavras</TabsTrigger>
            <TabsTrigger value="ruido"      className="text-xs">RuÃ­do</TabsTrigger>
          </TabsList>

          {(['frequencia', 'equilibrio', 'palavras', 'ruido'] as HearingTestCategory[]).map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6">{renderContent()}</TabsContent>
          ))}
        </Tabs>

        <div className="flex gap-3 mt-6">
          {phase === 'idle' && (
            <Button onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold">
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
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                <RotateCcw className="w-4 h-4 mr-2" />Repetir
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
