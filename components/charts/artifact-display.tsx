
'use client';

import { TrendingUp, PieChart, Calendar, FileText } from 'lucide-react';
import FinancialChart from './financial-chart';
import MarketAnalysisChart from './market-analysis-chart';
import TimelineChart from './timeline-chart';

interface ArtifactDisplayProps {
  artifact: {
    id: string;
    type: string;
    chartType?: string;
    title: string;
    description?: string;
    data: any;
    config?: any;
    createdAt: string;
  };
}

export default function ArtifactDisplay({ artifact }: ArtifactDisplayProps) {
  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'financial_chart':
      case 'pdf_analysis_chart':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'market_analysis':
        return <PieChart className="w-5 h-5 text-purple-600" />;
      case 'timeline':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderChart = () => {
    switch (artifact.type) {
      case 'financial_chart':
      case 'pdf_analysis_chart':
        return (
          <FinancialChart
            data={artifact.data}
            config={artifact.config || {}}
            chartType={artifact.chartType as 'line' | 'bar' | 'area'}
            title={artifact.title}
            description={artifact.description}
          />
        );
      
      case 'market_analysis':
        return (
          <MarketAnalysisChart
            data={artifact.data}
            config={artifact.config || {}}
            chartType={artifact.chartType as 'pie' | 'bar' | 'donut'}
            title={artifact.title}
            description={artifact.description}
          />
        );
      
      case 'timeline':
        return (
          <TimelineChart
            data={artifact.data}
            config={artifact.config || {}}
            title={artifact.title}
            description={artifact.description}
          />
        );
      
      default:
        // Generic chart fallback
        return (
          <FinancialChart
            data={artifact.data}
            config={artifact.config || {}}
            chartType="bar"
            title={artifact.title}
            description={artifact.description}
          />
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      {/* Artifact header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-50">
          {getArtifactIcon(artifact.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">Generated Visualization</h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              {artifact.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Created {new Date(artifact.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      {renderChart()}
    </div>
  );
}
