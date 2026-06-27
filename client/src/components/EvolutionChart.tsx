import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { AnyTestResult } from '@/lib/types';

interface EvolutionChartProps {
  tests: AnyTestResult[];
  title: string;
  dataKey: string;
}

export function EvolutionChart({ tests, title, dataKey }: EvolutionChartProps) {
  const data = tests
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((test) => ({
      date: new Date(test.timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      value: test.score || (typeof test.value === 'number' ? test.value : 0),
      timestamp: test.timestamp,
    }));

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Nenhum dado disponivel para grafico</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.2)" />
          <XAxis dataKey="date" stroke="rgba(209, 213, 219, 0.5)" />
          <YAxis stroke="rgba(209, 213, 219, 0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#7C3AED"
            dot={{ fill: '#06B6D4', r: 5 }}
            activeDot={{ r: 7 }}
            strokeWidth={2}
            name={dataKey}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
