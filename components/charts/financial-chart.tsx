
'use client';

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialChartProps {
  data: any[];
  config: any;
  chartType: 'line' | 'bar' | 'area';
  title: string;
  description?: string;
}

export default function FinancialChart({ data, config, chartType, title, description }: FinancialChartProps) {
  const colors = config.colors || ['#10B981', '#EF4444', '#3B82F6'];
  
  const renderChart = () => {
    const commonProps = {
      height: 300,
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis 
              dataKey={config.xAxisKey} 
              tickLine={false}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#E5E7EB' }}
              label={{ 
                value: 'Amount ($)', 
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
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ fontSize: 11, paddingBottom: '20px' }}
            />
            {config.yAxisKeys?.map((key: string, index: number) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <XAxis 
              dataKey={config.xAxisKey} 
              tickLine={false}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#E5E7EB' }}
              label={{ 
                value: 'Amount ($)', 
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
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ fontSize: 11, paddingBottom: '20px' }}
            />
            {config.yAxisKeys?.map((key: string, index: number) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                fillOpacity={0.3}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <XAxis 
              dataKey={config.xAxisKey} 
              tickLine={false}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tickLine={false}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#E5E7EB' }}
              label={{ 
                value: 'Amount ($)', 
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
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ fontSize: 11, paddingBottom: '20px' }}
            />
            {config.yAxisKeys?.map((key: string, index: number) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );
    }
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
