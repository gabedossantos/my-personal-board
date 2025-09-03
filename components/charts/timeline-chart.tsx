
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface TimelineChartProps {
  data: any[];
  config: any;
  title: string;
  description?: string;
}

export default function TimelineChart({ data, config, title, description }: TimelineChartProps) {
  const statusColors = config.statusColors || {
    planned: '#94A3B8',
    'in-progress': '#3B82F6',
    completed: '#10B981'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `${diffDays} days`;
      } else if (diffDays < 365) {
        return `${Math.round(diffDays / 30)} months`;
      } else {
        return `${Math.round(diffDays / 365)} years`;
      }
    } catch {
      return 'Unknown duration';
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      
      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index} className="relative">
            {/* Timeline connector line */}
            {index < data.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
            )}
            
            <div className="flex items-start gap-4">
              {/* Status icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center relative z-10">
                {getStatusIcon(item.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-medium text-gray-900">{item.name}</h4>
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${statusColors[item.status as keyof typeof statusColors] || '#94A3B8'}20`,
                      color: statusColors[item.status as keyof typeof statusColors] || '#94A3B8'
                    }}
                  >
                    {item.status.replace('-', ' ')}
                  </span>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Start: {formatDate(item.start)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>End: {formatDate(item.end)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Duration: {calculateDuration(item.start, item.end)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Status legend */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h5>
        <div className="flex gap-6">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color as string }}
              />
              <span className="text-xs text-gray-600 capitalize">
                {status.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
