import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, BookOpen, Zap, Shield, Eye, EyeOff, Info } from 'lucide-react';

interface LearningStep {
  id: number;
  title: string;
  description: string;
  animation: 'photon' | 'basis' | 'measurement' | 'sifting' | 'eve' | 'qber';
  details: string[];
  interactive?: boolean;
}

const learningSteps: LearningStep[] = [
  {
    id: 1,
    title: 'Introduction to BB84',
    description: 'Learn about the BB84 protocol and quantum key distribution',
    animation: 'photon',
    details: [
      'BB84 is the first quantum key distribution protocol',
      'Developed by Charles Bennett and Gilles Brassard in 1984',
      'Uses quantum mechanics principles for secure key exchange',
      'Provides unconditional security based on quantum physics'
    ]
  },
  {
    id: 2,
    title: 'Quantum Bits and Bases',
    description: 'Understanding quantum bits and measurement bases',
    animation: 'basis',
    details: [
      'Quantum bits (qubits) can be in superposition states',
      'Two measurement bases: Rectilinear (+) and Diagonal (×)',
      'Measuring in wrong basis gives random result',
      'Only same basis measurements are reliable'
    ]
  },
  {
    id: 3,
    title: 'Alice\'s Bit Generation',
    description: 'Alice generates random bits and chooses random bases',
    animation: 'photon',
    details: [
      'Alice generates random binary bits (0 or 1)',
      'For each bit, she randomly chooses a measurement basis',
      'She prepares photons in corresponding quantum states',
      'States: |0⟩, |1⟩ (rectilinear) or |+⟩, |-⟩ (diagonal)'
    ]
  },
  {
    id: 4,
    title: 'Quantum Transmission',
    description: 'Photons travel through quantum channel to Bob',
    animation: 'photon',
    details: [
      'Alice sends photons through quantum channel',
      'Each photon carries one bit of information',
      'Channel can be optical fiber or free space',
      'Quantum states are fragile and sensitive to measurement'
    ]
  },
  {
    id: 5,
    title: 'Bob\'s Measurement',
    description: 'Bob measures incoming photons with random bases',
    animation: 'measurement',
    details: [
      'Bob randomly chooses measurement basis for each photon',
      'If basis matches Alice\'s: gets correct bit',
      'If basis doesn\'t match: gets random result',
      'Bob doesn\'t know which measurements are correct'
    ]
  },
  {
    id: 6,
    title: 'Classical Communication',
    description: 'Alice and Bob publicly discuss their basis choices',
    animation: 'basis',
    details: [
      'Alice and Bob publicly announce their basis choices',
      'They keep only bits where bases matched',
      'This process is called "sifting"',
      'Public discussion doesn\'t reveal the actual bits'
    ]
  },
  {
    id: 7,
    title: 'Eve\'s Interception',
    description: 'How Eve can attempt to intercept the communication',
    animation: 'eve',
    details: [
      'Eve can intercept photons and measure them',
      'She must choose a measurement basis',
      'Wrong basis choice introduces errors',
      'Her presence increases Quantum Bit Error Rate (QBER)'
    ]
  },
  {
    id: 8,
    title: 'Error Detection',
    description: 'Using QBER to detect eavesdropping',
    animation: 'qber',
    details: [
      'Alice and Bob compare subset of their bits',
      'Calculate Quantum Bit Error Rate (QBER)',
      'QBER > 11% indicates potential eavesdropping',
      'Secure communication requires QBER < 11%'
    ]
  },
  {
    id: 9,
    title: 'Final Key Generation',
    description: 'Generating the final secure key',
    animation: 'sifting',
    details: [
      'Remove bits used for error estimation',
      'Apply privacy amplification',
      'Result is a shared secret key',
      'Key can be used for symmetric encryption'
    ]
  }
];

export default function InteractiveLearning() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEve, setShowEve] = useState(false);
  const [animationData, setAnimationData] = useState({
    aliceBits: [1, 0, 1, 1, 0, 0, 1, 0],
    aliceBases: [0, 1, 0, 1, 0, 1, 0, 1],
    bobBases: [0, 0, 1, 1, 0, 1, 1, 0],
    bobResults: [1, 0, 0, 1, 0, 1, 0, 0],
    siftedKey: [1, 0, 1, 0],
    qber: 0.05
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < learningSteps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextStep = () => {
    if (currentStep < learningSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetLearning = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentStepData = learningSteps[currentStep];

  const renderAnimation = () => {
    switch (currentStepData.animation) {
      case 'photon':
        return (
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 mb-2">Alice</div>
              <div className="flex space-x-2">
                {animationData.aliceBits.map((bit, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${
                      bit === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {bit}
                  </motion.div>
                ))}
              </div>
            </div>
            
            <motion.div
              animate={{ x: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              →
            </motion.div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">Bob</div>
              <div className="flex space-x-2">
                {animationData.bobResults.map((bit, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${
                      bit === 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {bit}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'basis':
        return (
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 mb-2">Alice's Bases</div>
              <div className="flex space-x-2">
                {animationData.aliceBases.map((basis, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${
                      basis === 0 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {basis === 0 ? '+' : '×'}
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 mb-2">Bob's Bases</div>
              <div className="flex space-x-2">
                {animationData.bobBases.map((basis, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${
                      basis === 0 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {basis === 0 ? '+' : '×'}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'measurement':
        return (
          <div className="text-center">
            <div className="mb-4">
              <div className="text-lg font-semibold text-purple-600 mb-2">Measurement Process</div>
              <div className="flex justify-center space-x-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center"
                >
                  <Zap className="w-8 h-8 text-purple-600" />
                </motion.div>
                <div className="flex flex-col justify-center">
                  <div className="text-sm text-gray-600">Quantum Measurement</div>
                  <div className="text-xs text-gray-500">Collapses superposition</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sifting':
        return (
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600 mb-4">Key Sifting</div>
            <div className="flex justify-center space-x-2">
              {animationData.siftedKey.map((bit, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="w-10 h-10 rounded bg-purple-500 text-white flex items-center justify-center text-sm font-mono"
                >
                  {bit}
                </motion.div>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Only bits with matching bases
            </div>
          </div>
        );

      case 'eve':
        return (
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 mb-4">Eve's Interception</div>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-blue-600 mb-1">Alice</div>
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 bg-blue-500 rounded-full"
                />
              </div>
              
              <div className="text-center">
                <div className="text-sm text-red-600 mb-1">Eve</div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <Eye className="w-3 h-3 text-white" />
                </motion.div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-green-600 mb-1">Bob</div>
                <motion.div
                  animate={{ x: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 bg-green-500 rounded-full"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Eve's measurement introduces errors
            </div>
          </div>
        );

      case 'qber':
        return (
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600 mb-4">Quantum Bit Error Rate</div>
            <div className="w-64 mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>0%</span>
                <span>QBER: {(animationData.qber * 100).toFixed(1)}%</span>
                <span>11%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${animationData.qber * 100}%` }}
                  className={`h-3 rounded-full ${
                    animationData.qber > 0.11 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {animationData.qber > 0.11 ? 'Eve Detected!' : 'Secure Communication'}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Interactive Learning</h2>
            <p className="text-gray-600">Step-by-step guide to quantum cryptography</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetLearning}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {learningSteps.length}</span>
            <span>{Math.round(((currentStep + 1) / learningSteps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / learningSteps.length) * 100}%` }}
              className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-80 border-r bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Learning Steps</h3>
          <div className="space-y-2">
            {learningSteps.map((step, index) => (
              <motion.div
                key={step.id}
                whileHover={{ backgroundColor: '#f3f4f6' }}
                onClick={() => setCurrentStep(index)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentStep ? 'bg-purple-100 border-purple-200' : 'bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    index === currentStep 
                      ? 'bg-purple-500 text-white' 
                      : index < currentStep 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index < currentStep ? '✓' : step.id}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Step Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {currentStepData.title}
                  </h3>
                  <p className="text-gray-600 text-lg">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Animation Area */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <div className="bg-white rounded-lg border p-8 shadow-sm">
                    {renderAnimation()}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Info className="w-5 h-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-800">Key Points</h4>
                  </div>
                  <ul className="space-y-2">
                    {currentStepData.details.map((detail, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-2"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="p-6 border-t bg-white">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowEve(!showEve)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    showEve 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {showEve ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{showEve ? 'Hide Eve' : 'Show Eve'}</span>
                </button>
              </div>
              
              <button
                onClick={nextStep}
                disabled={currentStep === learningSteps.length - 1}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

