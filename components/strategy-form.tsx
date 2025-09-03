
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessStrategy, FileUploadResult } from '@/lib/types';
import FileUpload from './file-upload';
import { Lightbulb, Users, AlertTriangle, DollarSign, Target, FileText, Sparkles } from 'lucide-react';

export default function StrategyForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<BusinessStrategy>>({
    projectName: '',
    oneSentenceSummary: '',
    targetCustomer: '',
    keyProblem: '',
    estimatedCost: '',
    detailedDescription: '',
  });
  const [uploadedFile, setUploadedFile] = useState<FileUploadResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    // No mandatory validation - all fields are now optional
    // The board members will ask clarifying questions for missing information
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const strategy: BusinessStrategy = {
        projectName: formData.projectName?.trim() || undefined,
        oneSentenceSummary: formData.oneSentenceSummary?.trim() || undefined,
        targetCustomer: formData.targetCustomer?.trim() || undefined,
        keyProblem: formData.keyProblem?.trim() || undefined,
        estimatedCost: formData.estimatedCost?.trim() || undefined,
        detailedDescription: formData.detailedDescription?.trim() || undefined,
        supplementaryFile: uploadedFile ? {
          name: uploadedFile.fileName || '',
          content: uploadedFile.content || '',
          type: uploadedFile.fileType || '',
        } : undefined,
      };

      // Store strategy in sessionStorage for the simulation
      sessionStorage.setItem('businessStrategy', JSON.stringify(strategy));
      
      // Navigate to simulation page
      router.push('/simulation');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit strategy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BusinessStrategy, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-emerald-600 font-medium">Share Your Vision</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">
          Present Your Strategy
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Share what you know about your startup idea. Our animal-spirited advisors will ask the right questions to help you build something amazing.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-1 rounded-lg">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                Project Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="projectName"
                value={formData.projectName || ''}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className={`w-full px-4 py-4 border-0 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                  errors.projectName ? 'ring-2 ring-red-300' : ''
                }`}
                placeholder="e.g., EcoShip Logistics Platform"
              />
              {errors.projectName && <p className="mt-2 text-sm text-red-600">{errors.projectName}</p>}
            </div>

            {/* Estimated Cost */}
            <div>
              <label htmlFor="estimatedCost" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-1 rounded-lg">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                </div>
                Estimated Cost <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="estimatedCost"
                value={formData.estimatedCost || ''}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                className={`w-full px-4 py-4 border-0 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                  errors.estimatedCost ? 'ring-2 ring-red-300' : ''
                }`}
                placeholder="e.g., $500K initial investment"
              />
              {errors.estimatedCost && <p className="mt-2 text-sm text-red-600">{errors.estimatedCost}</p>}
            </div>
          </div>

          {/* One-Sentence Summary */}
          <div>
            <label htmlFor="oneSentenceSummary" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-1 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              One-Sentence Summary <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="oneSentenceSummary"
              value={formData.oneSentenceSummary || ''}
              onChange={(e) => handleInputChange('oneSentenceSummary', e.target.value)}
              className={`w-full px-4 py-4 border-0 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                errors.oneSentenceSummary ? 'ring-2 ring-red-300' : ''
              }`}
              placeholder="Describe your project in one compelling sentence"
            />
            {errors.oneSentenceSummary && <p className="mt-2 text-sm text-red-600">{errors.oneSentenceSummary}</p>}
          </div>

          {/* Target Customer */}
          <div>
            <label htmlFor="targetCustomer" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <div className="bg-gradient-to-br from-rose-100 to-rose-200 p-1 rounded-lg">
                <Users className="w-4 h-4 text-rose-600" />
              </div>
              Target Customer <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="targetCustomer"
              value={formData.targetCustomer || ''}
              onChange={(e) => handleInputChange('targetCustomer', e.target.value)}
              className={`w-full px-4 py-4 border-0 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all duration-200 ${
                errors.targetCustomer ? 'ring-2 ring-red-300' : ''
              }`}
              placeholder="e.g., Small to medium-sized e-commerce businesses"
            />
            {errors.targetCustomer && <p className="mt-2 text-sm text-red-600">{errors.targetCustomer}</p>}
          </div>

          {/* Key Problem */}
          <div>
            <label htmlFor="keyProblem" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-1 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              Key Problem Being Solved <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="keyProblem"
              value={formData.keyProblem || ''}
              onChange={(e) => handleInputChange('keyProblem', e.target.value)}
              rows={3}
              className={`w-full px-4 py-4 border-0 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all duration-200 resize-none ${
                errors.keyProblem ? 'ring-2 ring-red-300' : ''
              }`}
              placeholder="What specific problem does your solution address?"
            />
            {errors.keyProblem && <p className="mt-2 text-sm text-red-600">{errors.keyProblem}</p>}
          </div>

          {/* Detailed Description */}
          <div>
            <label htmlFor="detailedDescription" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-1 rounded-lg">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              Detailed Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="detailedDescription"
              value={formData.detailedDescription || ''}
              onChange={(e) => handleInputChange('detailedDescription', e.target.value)}
              rows={6}
              className={`w-full px-4 py-4 border-0 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all duration-200 resize-none ${
                errors.detailedDescription ? 'ring-2 ring-red-300' : ''
              }`}
              placeholder="Provide a comprehensive description of your business strategy, including your business model, competitive advantages, market opportunity, and implementation plan..."
            />
            <div className="mt-2 flex justify-between items-center">
              {errors.detailedDescription && <p className="text-sm text-red-600">{errors.detailedDescription}</p>}
              <p className="text-xs text-gray-400 ml-auto">
                {formData.detailedDescription?.length || 0} characters
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Supplementary Materials (Optional)
            </label>
            <FileUpload
              onFileProcessed={setUploadedFile}
              currentFile={uploadedFile}
              onRemoveFile={() => setUploadedFile(null)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-600 focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {isSubmitting ? 'Starting Simulation...' : 'Enter the Boardroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
