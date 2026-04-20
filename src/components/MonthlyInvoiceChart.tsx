import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyInvoiceStats } from '../services/tableService';

interface MonthlyInvoiceChartProps {
  data: MonthlyInvoiceStats[];
  loading?: boolean;
}

export default function MonthlyInvoiceChart({ data, loading }: MonthlyInvoiceChartProps) {
  if (loading) {
    return <div className="text-center py-8">Chargement du graphique...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>;
  }

  // Custom tooltip to display formatted currency and number of invoices with labels
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const getLabel = (dataKey: string) => {
        if (dataKey === 'totalRecu') return 'Total reçu';
        if (dataKey === 'totalPaye') return 'Total payé';
        if (dataKey === 'totalReste') return 'Total restant';
        return dataKey;
      };

      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-gray-800">{payload[0].payload.month}</p>
          <p className="text-xs text-gray-600 mb-2">({payload[0].payload.nombreFactures} facture{payload[0].payload.nombreFactures > 1 ? 's' : ''})</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
              {getLabel(entry.dataKey)}: {entry.value.toLocaleString()} USD
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Évolution mensuelle des factures</h3>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
              if (value === 'totalRecu') return 'Total reçu';
              if (value === 'totalPaye') return 'Total payé';
              if (value === 'totalReste') return 'Total restant';
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="totalRecu"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
            name="Total reçu"
          />
          <Line
            type="monotone"
            dataKey="totalPaye"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
            name="Total payé"
          />
          <Line
            type="monotone"
            dataKey="totalReste"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 7 }}
            name="Total restant"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
