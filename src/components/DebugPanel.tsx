import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ImageGenerationService } from '../services/imageService';

const DebugPanel: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'missing'>('checking');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    setApiKeyStatus('checking');
    try {
      const isValid = await ImageGenerationService.testApiKey();
      setApiKeyStatus(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error('API key check failed:', error);
      setApiKeyStatus('invalid');
    }
  };

  const testGeneration = async () => {
    try {
      console.log('Testing SDXL generation...');
      await ImageGenerationService.generateImage({
        prompt: 'A simple red apple on a white background',
        aspectRatio: '1:1',
        guidanceScale: 7.5,
        inferenceSteps: 20
      });
    } catch (error) {
      console.error('Test generation failed:', error);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 glass rounded-lg p-4 max-w-sm z-50">
      <div className="text-sm text-white mb-2 font-semibold">SDXL Debug Panel</div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          {apiKeyStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
          {apiKeyStatus === 'valid' && <CheckCircle className="w-3 h-3 text-green-400" />}
          {(apiKeyStatus === 'invalid' || apiKeyStatus === 'missing') && <AlertCircle className="w-3 h-3 text-red-400" />}
          
          <span className="text-gray-300">
            API Key: {
              apiKeyStatus === 'checking' ? 'Checking...' :
              apiKeyStatus === 'valid' ? 'Valid' :
              apiKeyStatus === 'invalid' ? 'Invalid' :
              'Missing'
            }
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={checkApiKey}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Recheck
          </button>
          
          <button
            onClick={testGeneration}
            disabled={apiKeyStatus !== 'valid'}
            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            Test Gen
          </button>
        </div>

        {apiKeyStatus === 'invalid' && (
          <div className="text-xs text-red-300">
            Check console for API errors
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;