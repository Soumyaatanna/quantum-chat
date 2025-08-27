import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Eye, EyeOff, Zap, Shield, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

interface BB84Step {
  name: string;
  detail: string;
  aliceBits?: number[];
  aliceBases?: number[];
  bobBases?: number[];
  bobMeasurements?: number[];
  siftedKey?: number[];
  qber?: number;
  eveDetected?: boolean;
}

interface BB84Result {
  keyBits: number[];
  keyHex: string;
  steps: BB84Step[];
  qber: number;
  eveDetected: boolean;
}

export default function QKDSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [eveEnabled, setEveEnabled] = useState(false);
  const [numPhotons, setNumPhotons] = useState(128);
  const [result, setResult] = useState<BB84Result | null>(null);
  const [error, setError] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);

  const runSimulation = async () => {
    setIsRunning(true);
    setError('');
    setCurrentStep(0);
    setResult(null);

    try {
      const response = await api.post('/api/qkd/bb84', {
        numPhotons,
        eve: eveEnabled
      });
      
      setResult(response.data);
      if (autoPlay) {
        setCurrentStep(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Simulation failed');
    } finally {
      setIsRunning(false);
    }
  };

  const resetSimulation = () => {
    setCurrentStep(0);
    setResult(null);
    setError('');
  };

  const nextStep = () => {
    if (result && currentStep < result.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = result?.steps[currentStep];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">BB84 Quantum Key Distribution</h2>
          <p className="text-gray-600">Simulate quantum key exchange with optional eavesdropper detection</p>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Simulation</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetSimulation}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 rounded-lg p-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Photons
            </label>
            <input
              type="range"
              min="64"
              max="256"
              step="64"
              value={numPhotons}
              onChange={(e) => setNumPhotons(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">{numPhotons} photons</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eve Attack Simulation
            </label>
            <button
              onClick={() => setEveEnabled(!eveEnabled)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                eveEnabled 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {eveEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{eveEnabled ? 'Eve Active' : 'Eve Inactive'}</span>
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Play
            </label>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoPlay 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{autoPlay ? 'Auto Play On' : 'Auto Play Off'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </motion.div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Results Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Key Length</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{result.keyBits.length * 8} bits</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-medium">QBER</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{(result.qber * 100).toFixed(1)}%</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                {result.eveDetected ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Shield className="w-5 h-5 text-green-500" />
                )}
                <span className="font-medium">Security Status</span>
              </div>
              <div className={`text-lg font-bold ${result.eveDetected ? 'text-red-600' : 'text-green-600'}`}>
                {result.eveDetected ? 'Eve Detected!' : 'Secure'}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Generated Key</span>
              </div>
              <div className="text-sm font-mono text-gray-600 break-all">
                {result.keyHex.substring(0, 16)}...
              </div>
            </div>
          </motion.div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-3 py-1 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {result.steps.length}
              </span>
              
              <button
                onClick={nextStep}
                disabled={currentStep === result.steps.length - 1}
                className="px-3 py-1 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="flex space-x-2">
              {result.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-purple-500' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Step Visualization */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg border p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {currentStepData?.name}
              </h3>
              
              <p className="text-gray-600 mb-6">{currentStepData?.detail}</p>
              
              {/* Step-specific visualizations */}
              {currentStepData?.aliceBits && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Alice's Bits:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentStepData.aliceBits.map((bit, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono ${
                          bit === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {bit}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentStepData?.aliceBases && currentStepData?.bobBases && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Basis Selection:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Alice's Bases:</div>
                      <div className="flex flex-wrap gap-1">
                        {currentStepData.aliceBases.map((basis, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono ${
                              basis === 0 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                            }`}
                          >
                            {basis === 0 ? '+' : '×'}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Bob's Bases:</div>
                      <div className="flex flex-wrap gap-1">
                        {currentStepData.bobBases.map((basis, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono ${
                              basis === 0 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                            }`}
                          >
                            {basis === 0 ? '+' : '×'}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStepData?.siftedKey && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Sifted Key:</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentStepData.siftedKey.map((bit, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="w-6 h-6 rounded bg-purple-500 text-white flex items-center justify-center text-xs font-mono"
                      >
                        {bit}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentStepData?.qber !== undefined && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Quantum Bit Error Rate:</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentStepData.qber * 100}%` }}
                        className={`h-2 rounded-full ${
                          currentStepData.qber > 0.11 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(currentStepData.qber * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              
              {currentStepData?.eveDetected !== undefined && (
                <div className="p-4 rounded-lg border-2 border-dashed border-red-300 bg-red-50">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">
                      {currentStepData.eveDetected ? 'Eve Detected!' : 'No Eve Detected'}
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    {currentStepData.eveDetected 
                      ? 'QBER is above threshold. Communication may be compromised.'
                      : 'QBER is within acceptable limits. Communication is secure.'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

