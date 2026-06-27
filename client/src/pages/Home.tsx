import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Volume2, Brain, TrendingUp, Settings, AlertCircle } from 'lucide-react';
import { VisionTest } from '@/components/tests/VisionTest';
import { HearingTest } from '@/components/tests/HearingTest';
import { CognitionTest } from '@/components/tests/CognitionTest';
import { useTestHistory } from '@/hooks/useTestHistory';
import { initDB } from '@/lib/db';
import { AnyTestResult } from '@/lib/types';

export default function Home() {
  const { allTests, loading } = useTestHistory();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        const accepted = localStorage.getItem('disclaimerAccepted') === 'true';
        setDisclaimerAccepted(accepted);
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    init();
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setDisclaimerAccepted(true);
  };

  const getLatestTestByType = (type: string) => {
    return allTests.find((t) => t.type === type);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto" />
          </div>
          <p className="text-gray-300">Inicializando aplicativo...</p>
        </div>
      </div>
    );
  }

  if (!disclaimerAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border-purple-500/30">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Aviso Importante</h1>
            </div>

            <div className="space-y-4 mb-6 text-gray-200">
              <p>
                <strong>Os resultados apresentados sao apenas indicativos</strong> e nao substituem avaliacao realizada por profissionais de saude.
              </p>
              <p>
                Este aplicativo foi desenvolvido como uma ferramenta de autoavaliacao pessoal para acompanhar possiveis mudancas ao longo do tempo.
              </p>
              <p className="text-sm text-gray-400">
                <strong>Limitacoes tecnicas:</strong>
              </p>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li>Testes de audicao dependem da qualidade dos fones e do ambiente</li>
                <li>Testes de visao podem ser influenciados pelo tamanho e brilho da tela</li>
                <li>Testes de cognicao variam conforme seu estado fisico e mental</li>
              </ul>
              <p>
                <strong>Seus dados sao armazenados apenas no seu dispositivo.</strong> Nenhuma informacao e enviada para servidores externos.
              </p>
            </div>

            <Button
              onClick={handleAcceptDisclaimer}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-6 text-lg"
            >
              Entendi e Aceito
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Autoavaliacao Sensorial</h1>
                <p className="text-xs text-gray-400">Acompanhe sua evolucao sensorial</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuracoes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="testes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-purple-900/30 border border-purple-500/30 mb-8">
            <TabsTrigger value="testes" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Testes
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Historico
            </TabsTrigger>
            <TabsTrigger value="resumo" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Resumo
            </TabsTrigger>
          </TabsList>

          {/* Testes Tab */}
          <TabsContent value="testes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VisionTest />
              <HearingTest />
            </div>
            <CognitionTest />
          </TabsContent>

          {/* Historico Tab */}
          <TabsContent value="historico" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin mb-4">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto" />
                </div>
                <p className="text-gray-300">Carregando historico...</p>
              </div>
            ) : allTests.length === 0 ? (
              <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 p-8 text-center">
                <p className="text-gray-300 mb-4">Nenhum teste realizado ainda.</p>
                <p className="text-gray-400 text-sm">Comece realizando um teste na aba "Testes" para ver seu historico aqui.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {allTests.map((test: AnyTestResult) => (
                  <Card
                    key={test.id}
                    className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border-purple-500/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {test.type === 'vision' && <Eye className="w-5 h-5 text-purple-400" />}
                        {test.type === 'hearing' && <Volume2 className="w-5 h-5 text-cyan-400" />}
                        {(test.type === 'cognition' || test.type === 'coordination') && (
                          <Brain className="w-5 h-5 text-purple-400" />
                        )}
                        <div>
                          <p className="text-white font-semibold capitalize">
                            {test.type === 'vision' && 'Visao'}
                            {test.type === 'hearing' && 'Audicao'}
                            {test.type === 'cognition' && 'Cognicao'}
                            {test.type === 'coordination' && 'Coordenacao'} - {test.category}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(test.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-400">{test.value}</p>
                        {test.score !== undefined && (
                          <p className="text-xs text-gray-400">Score: {test.score.toFixed(0)}/100</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Resumo Tab */}
          <TabsContent value="resumo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border-purple-500/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <p className="text-gray-300 text-sm">Ultimo Teste de Visao</p>
                </div>
                {getLatestTestByType('vision') ? (
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{getLatestTestByType('vision')?.value}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(getLatestTestByType('vision')?.timestamp || 0)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum teste realizado</p>
                )}
              </Card>

              <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-900/10 border-cyan-500/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  <p className="text-gray-300 text-sm">Ultimo Teste de Audicao</p>
                </div>
                {getLatestTestByType('hearing') ? (
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{getLatestTestByType('hearing')?.value}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(getLatestTestByType('hearing')?.timestamp || 0)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum teste realizado</p>
                )}
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border-purple-500/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <p className="text-gray-300 text-sm">Ultimo Teste de Cognicao</p>
                </div>
                {getLatestTestByType('cognition') ? (
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{getLatestTestByType('cognition')?.value}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(getLatestTestByType('cognition')?.timestamp || 0)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum teste realizado</p>
                )}
              </Card>

              <Card className="bg-gradient-to-br from-pink-900/30 to-pink-900/10 border-pink-500/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                  <p className="text-gray-300 text-sm">Total de Testes</p>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{allTests.length}</p>
                <p className="text-xs text-gray-400 mt-1">Todos os testes realizados</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-black/20 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>
            Seus dados sao armazenados apenas no seu dispositivo. Nenhuma informacao e enviada para servidores externos.
          </p>
        </div>
      </footer>
    </div>
  );
}
