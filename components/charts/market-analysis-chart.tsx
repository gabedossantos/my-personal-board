
'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MarketAnalysisChartProps {
  data: any[];
  config: any;
  chartType: 'pie' | 'bar' | 'donut';
  title: string;
  description?: string;
}

export default function MarketAnalysisChart({ data, config, chartType, title, description }: MarketAnalysisChartProps) {
  const colors = config.colors || ['#8B5CF6', '#06B6D4', '#84CC16', '#F59E0B', '#EF4444'];
  
  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart
          height={300}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <XAxis 
            dataKey={config.nameKey} 
            tickLine={false}
            tick={{ fontSize: 10 }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            tickLine={false}
            tick={{ fontSize: 10 }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={{ 
              value: 'Value', 
              angle: -90, 
              position: 'insideLeft', 
              style: { textAnchor: 'middle', fontSize: 11 } 
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px',
              fontSize: 11
            }}
          />
          <Bar
            dataKey={config.valueKey}
            fill={colors[0]}
            radius={[2, 2, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      );
    }

    // Pie or Donut chart
    return (
      <PieChart height={300}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={chartType === 'donut' ? 100 : 120}
          innerRadius={chartType === 'donut' ? 60 : 0}
          fill="#8884d8"
          dataKey={config.valueKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E5E7EB', 
            borderRadius: '8px',
            fontSize: 11
          }}
        />
        <Legend 
          verticalAlign="top" 
          wrapperStyle={{ fontSize: 11, paddingBottom: '20px' }}
        />
      </PieChart>
    );
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="w-full" style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
