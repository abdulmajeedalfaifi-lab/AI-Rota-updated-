
import React, { useState, useEffect } from 'react';
import { analyzeRotaConflicts, generateRotaSchedule, parseRotaFromImage } from '../services/geminiService';
import { Shift, Doctor, GenerationParams, ShiftStatus, ShiftType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { X, Bot, Loader2, AlertTriangle, Wand2, Calendar, CheckCircle, Upload, FileImage, FileSpreadsheet, ScanLine } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  doctors: Doctor[];
  onApplySchedule: (newShifts: Shift[]) => void;
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, shifts, doctors, onApplySchedule }) => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate' | 'import'>('analyze');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [generatedShifts, setGeneratedShifts] = useState<Shift[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Generation State
  const [genParams, setGenParams] = useState<GenerationParams>({
    startDate: '2023-11-01',
    endDate: '2023-11-07',
    department: 'Emergency',
    shiftsPerDay: 3,
    minDoctors: 2
  });

  // UX: Simulate AI "Thinking" steps to build trust
  useEffect(() => {
    if (loading) {
      const steps = activeTab === 'import' 
        ? ['Scanning document structure...', 'Identifying dates & times...', 'Matching doctor names...', 'Formatting final rota...']
        : ['Analyzing constraints...', 'Checking doctor availability...', 'Optimizing coverage...', 'Finalizing schedule...'];
      
      let i = 0;
      setLoadingStep(steps[0]);
      const interval = setInterval(() => {
        i = (i + 1) % steps.length;
        setLoadingStep(steps[i]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading, activeTab]);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    const analysis = await analyzeRotaConflicts(shifts, doctors);
    setResult(analysis || "No response from AI.");
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setGeneratedShifts([]);
    
    const scheduleText = await generateRotaSchedule(genParams, doctors);
    processAIResponse(scheduleText, 'generate');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setLoading(true);
    setResult(null);
    setGeneratedShifts([]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const extractedJson = await parseRotaFromImage(base64String);
        processAIResponse(extractedJson, 'import');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setResult("Error reading file.");
      setLoading(false);
    }
  };

  const processAIResponse = (responseText: string | undefined, source: 'generate' | 'import') => {
      if (!responseText) {
          setResult("Error processing AI response.");
          setLoading(false);
          return;
      }
      
      try {
        let cleanJson = responseText;
        if (responseText.includes('```json')) {
          cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '');
        } else if (responseText.includes('```')) {
          cleanJson = responseText.replace(/```/g, '');
        }
  
        const parsedData = JSON.parse(cleanJson);
        
        const newShifts: Shift[] = Array.isArray(parsedData) ? parsedData.map((s: any, index: number) => {
          const docName = s.assignedDoctorName || s.assignedDoctor;
          
          // Improved matching: exact match first, then fuzzy
          let matchedDoctor = undefined;
          if (docName && docName !== 'Open') {
             matchedDoctor = doctors.find(d => d.name.toLowerCase() === docName.toLowerCase());
             if (!matchedDoctor) {
                matchedDoctor = doctors.find(d => d.name.toLowerCase().includes(docName.toLowerCase()) || docName.toLowerCase().includes(d.name.toLowerCase()));
             }
          }

          // Determine Center Name based on source
          let centerName = s.centerName;
          if (!centerName || centerName === 'Unknown') {
             centerName = source === 'generate' ? 'Auto-Generated Schedule' : 'Imported Rota';
          }

          return {
            id: `ai-${source}-${Date.now()}-${index}`,
            centerName: centerName,
            date: s.date,
            type: s.type as ShiftType || ShiftType.MORNING,
            startTime: s.startTime,
            endTime: s.endTime,
            status: (!docName || docName === 'Open') ? ShiftStatus.OPEN : ShiftStatus.ASSIGNED,
            specialtyRequired: genParams.department,
            assignedDoctorId: matchedDoctor?.id,
            location: 'Riyadh' // Default location
          };
        }) : [];
  
        setGeneratedShifts(newShifts);
        setResult(source === 'import' ? "Rota extracted from image successfully." : "Draft Schedule Generated Successfully.");
      } catch (e) {
        console.error(e);
        setResult(responseText || "Error generating schedule");
      }
      setLoading(false);
  };

  const applyScheduleToCalendar = () => {
    if (generatedShifts.length > 0) {
      onApplySchedule(generatedShifts);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-scale ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('aiAssistant')}</h2>
                <p className="text-xs text-indigo-100">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-2 relative z-10">
            {[
              { id: 'analyze', label: 'Analyze' },
              { id: 'generate', label: 'Generate' },
              { id: 'import', label: t('import') }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setResult(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg transform -translate-y-0.5' : 'bg-indigo-800/30 hover:bg-indigo-800/50 text-indigo-100'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {activeTab === 'analyze' && (
             <>
               {!result && !loading && (
                <div className="text-center py-8 animate-fade-in">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 inline-flex p-5 rounded-full mb-5 shadow-inner">
                    <AlertTriangle size={48} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Deep Schedule Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto text-sm">
                    Detect double-bookings, travel conflicts, and rest period violations instantly.
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none w-full transform active:scale-95"
                  >
                    {t('analyze')}
                  </button>
                </div>
              )}
             </>
          )}

          {activeTab === 'generate' && !result && !loading && (
            <div className="space-y-5 animate-fade-in">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase block mb-1.5 ml-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={genParams.startDate}
                      onChange={e => setGenParams({...genParams, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase block mb-1.5 ml-1">End Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={genParams.endDate}
                      onChange={e => setGenParams({...genParams, endDate: e.target.value})}
                    />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-gray-500 font-bold uppercase block mb-1.5 ml-1">Department</label>
                  <select 
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    value={genParams.department}
                    onChange={e => setGenParams({...genParams, department: e.target.value})}
                  >
                    <option>Emergency Medicine</option>
                    <option>Pediatrics</option>
                    <option>Cardiology</option>
                  </select>
               </div>
               <button
                  onClick={handleGenerate}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 px-6 rounded-xl transition shadow-lg shadow-purple-200 dark:shadow-none w-full flex items-center justify-center gap-2 mt-4 group"
                >
                  <Wand2 size={18} className="group-hover:rotate-12 transition" />
                  Generate Draft Schedule
                </button>
            </div>
          )}

          {activeTab === 'import' && !result && !loading && (
             <div className="text-center py-4 space-y-4 animate-fade-in">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 transition relative cursor-pointer flex flex-col items-center justify-center min-h-[220px]
                    ${isDragging 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.02]' 
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                   <div className={`p-4 rounded-full mb-3 transition ${isDragging ? 'bg-indigo-200' : 'bg-indigo-50 dark:bg-indigo-900/50'}`}>
                      <FileImage size={48} className="text-indigo-500 dark:text-indigo-400" />
                   </div>
                   <p className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">{t('uploadImage')}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">Drag & Drop or Click to Browse<br/>(JPG, PNG, PDF supported)</p>
                   
                   <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 justify-center bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                   <ScanLine size={14} />
                   <span>AI Vision automatically identifies dates & names</span>
                </div>
             </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-indigo-600">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg border border-indigo-100 dark:border-gray-700">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
              </div>
              <p className="font-bold text-lg mt-6 text-gray-800 dark:text-white animate-pulse">
                {activeTab === 'analyze' ? 'Analyzing Patterns...' : activeTab === 'import' ? 'Reading Document...' : 'Optimizing Rota...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">{loadingStep}</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold mb-4 pb-2 border-b dark:border-gray-700">
                {activeTab === 'analyze' ? <AlertTriangle size={20} className="text-amber-500" /> : <Calendar size={20} className="text-green-500" />}
                <h3>{activeTab === 'analyze' ? 'Conflict Report' : activeTab === 'import' ? 'Extracted Data' : 'Draft Schedule'}</h3>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-64 mb-4 shadow-inner custom-scrollbar">
                 {(activeTab === 'generate' || activeTab === 'import') && generatedShifts.length > 0 ? (
                    <div className="space-y-2">
                       <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                             <CheckCircle size={16} /> {generatedShifts.length} shifts created
                          </p>
                       </div>
                       {generatedShifts.map((s, i) => (
                         <div key={i} className="text-xs bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 flex justify-between items-center">
                            <div>
                              <div className="font-bold dark:text-white">{s.date}</div>
                              <div className="text-gray-500 dark:text-gray-400">{s.startTime} - {s.endTime} ({s.centerName})</div>
                            </div>
                            <span className={`px-2 py-1 rounded font-medium ${s.status === 'Open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'}`}>
                              {s.assignedDoctorId ? 'Matched' : s.status}
                            </span>
                         </div>
                       ))}
                    </div>
                 ) : (
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{result}</pre>
                 )}
              </div>

              {(activeTab === 'generate' || activeTab === 'import') && generatedShifts.length > 0 && (
                <button 
                  onClick={applyScheduleToCalendar}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 dark:shadow-none transition flex justify-center items-center gap-2 transform active:scale-95"
                >
                  <CheckCircle size={18} />
                  Approve & Import to Calendar
                </button>
              )}

              <button 
                onClick={() => setResult(null)}
                className="mt-3 w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModal;
