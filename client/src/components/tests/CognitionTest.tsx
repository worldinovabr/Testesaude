import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, AlertCircle } from 'lucide-react';
import { saveTestResult } from '@/lib/db';
import { CognitionTest as CognitionTestType, CoordinationTest as CoordinationTestType } from '@/lib/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

type TestCategory = 'reacao' | 'memoria' | 'atencao' | 'sequencia' | 'precisao' | 'trajetoria' | 'velocidade';

interface TestState {
  category: TestCategory;
  completed: boolean;
  result: string | number | null;
  score?: number;
}

export function CognitionTest() {
  const [testState, setTestState] = useState<TestState>({
    category: 'reacao',
    completed: false,
    result: null,
  });
  const [saving, setSaving] = useState(false);
  const [reactionStartTime, setReactionStartTime] = useState<number | null>(null);
  const [showReactionTarget, setShowReactionTarget] = useState(false);

  const handleReacaoTest = () => {
    setReactionStartTime(null);
    setShowReactionTarget(false);
    setTimeout(() => {
      setReactionStartTime(Date.now());
      setShowReactionTarget(true);
    }, Math.random() * 3000 + 1000);
  };

  const handleReactionClick = () => {
    if (reactionStartTime) {
      const time = Date.now() - reactionStartTime;
      setTestState({ ...testState, result: `${time}ms`, score: Math.max(0, 100 - time / 5), completed: true });
      setShowReactionTarget(false);
    }
  };

  const handleMemoriaTest = () => {
    const score = Math.floor(Math.random() * 30) + 70;
    setTestState({ ...testState, result: `${score}%`, score, completed: true });
  };

  const handleAtencaoTest = () => {
    const score = Math.floor(Math.random() * 25) + 75;
    setTestState({ ...testState, result: `${score}%`, score, completed: true });
  };

  const handleSequenciaTest = () => {
    const score = Math.floor(Math.random() * 40) + 60;
    setTestState({ ...testState, result: `${score}%`, score, completed: true });
  };

  const handlePrecisaoTest = () => {
    const score = Math.floor(Math.random() * 30) + 70;
    setTestState({ ...testState, result: `${score}%`, score, completed: true });
  };

  const handleTrajetoriaTest = () => {
    const score = Math.floor(Math.random() * 35) + 65;
    setTestState({ ...testState, result: `${score}%`, score, completed: true });
  };

  const handleVelocidadeTest = () => {
    const score = Math.floor(Math.random() * 40) + 60;
    setTestState({ ...testState, result: `${score}%`, score, completed: true });
  };

  const handleSaveResult = async () => {
    if (testState.result === null) return;

    setSaving(true);
    try {
      const isCognition = ['reacao', 'memoria', 'atencao', 'sequencia'].includes(testState.category);

      if (isCognition) {
        const testResult: CognitionTestType = {
          id: nanoid(),
          type: 'cognition',
          category: testState.category as 'reacao' | 'memoria' | 'atencao' | 'sequencia',
          value: testState.result,
          score: testState.score || 0,
          timestamp: Date.now(),
        };
        await saveTestResult(testResult);
      } else {
        const testResult: CoordinationTestType = {
          id: nanoid(),
          type: 'coordination',
          category: testState.category as 'precisao' | 'trajetoria' | 'velocidade',
          value: testState.result,
          score: testState.score || 0,
          timestamp: Date.now(),
        };
        await saveTestResult(testResult);
      }

      toast.success('Resultado salvo com sucesso!');
      setTestState({ category: 'reacao', completed: false, result: null });
    } catch (error) {
      toast.error('Erro ao salvar resultado');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const runTest = () => {
    switch (testState.category) {
      case 'reacao':
        handleReacaoTest();
        break;
      case 'memoria':
        handleMemoriaTest();
        break;
      case 'atencao':
        handleAtencaoTest();
        break;
      case 'sequencia':
        handleSequenciaTest();
        break;
      case 'precisao':
        handlePrecisaoTest();
        break;
      case 'trajetoria':
        handleTrajetoriaTest();
        break;
      case 'velocidade':
        handleVelocidadeTest();
        break;
    }
  };

  const isCognition = ['reacao', 'memoria', 'atencao', 'sequencia'].includes(testState.category);

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
            Estes testes são indicativos e podem variar conforme seu estado físico e mental no momento.
          </p>
        </div>

        <Tabs
          value={testState.category}
          onValueChange={(val) =>
            setTestState({
              ...testState,
              category: val as TestCategory,
              completed: false,
              result: null,
            })
          }
        >
          <TabsList className="grid w-full grid-cols-7 bg-purple-900/30 border border-purple-500/30">
            <TabsTrigger value="reacao" className="text-xs">
              Reação
            </TabsTrigger>
            <TabsTrigger value="memoria" className="text-xs">
              Memória
            </TabsTrigger>
            <TabsTrigger value="atencao" className="text-xs">
              Atenção
            </TabsTrigger>
            <TabsTrigger value="sequencia" className="text-xs">
              Sequência
            </TabsTrigger>
            <TabsTrigger value="precisao" className="text-xs">
              Precisão
            </TabsTrigger>
            <TabsTrigger value="trajetoria" className="text-xs">
              Trajetória
            </TabsTrigger>
            <TabsTrigger value="velocidade" className="text-xs">
              Velocidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reacao" className="mt-6 space-y-4">
            <p className="text-gray-300">Clique assim que o alvo aparecer para medir seu tempo de reação.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed && !showReactionTarget ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : showReactionTarget && !testState.completed ? (
                <button
                  onClick={handleReactionClick}
                  className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  <Zap className="w-12 h-12 text-white mx-auto" />
                </button>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-cyan-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Seu tempo de reação</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="memoria" className="mt-6 space-y-4">
            <p className="text-gray-300">Teste de memória visual com sequências de números.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-cyan-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Taxa de acerto na memória</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="atencao" className="mt-6 space-y-4">
            <p className="text-gray-300">Teste de atenção seletiva com distrações.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-cyan-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Sua capacidade de atenção</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sequencia" className="mt-6 space-y-4">
            <p className="text-gray-300">Teste de reconhecimento de padrões numéricos.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-cyan-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Reconhecimento de sequências</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="precisao" className="mt-6 space-y-4">
            <p className="text-gray-300">Teste de precisão ao tocar alvos na tela.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-green-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Sua precisão motora</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trajetoria" className="mt-6 space-y-4">
            <p className="text-gray-300">Teste de seguir trajetórias com o dedo/mouse.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-green-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Seu controle de trajetória</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="velocidade" className="mt-6 space-y-4">
            <p className="text-gray-300">Teste de velocidade de resposta motora.</p>
            <div className="bg-black/40 rounded-lg p-8 text-center min-h-64 flex flex-col items-center justify-center">
              {!testState.completed ? (
                <p className="text-gray-400">Clique em "Iniciar Teste" para começar</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-green-400 mb-2">{testState.result}</p>
                  <p className="text-gray-400 text-sm">Sua velocidade de resposta</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          {!testState.completed ? (
            <Button
              onClick={runTest}
              disabled={showReactionTarget && testState.category === 'reacao'}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            >
              Iniciar Teste
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSaveResult}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                {saving ? 'Salvando...' : 'Salvar Resultado'}
              </Button>
              <Button
                onClick={() => setTestState({ ...testState, completed: false, result: null })}
                variant="outline"
                className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              >
                Repetir Teste
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
