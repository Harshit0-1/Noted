import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPath, setAudioPath] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const textareaRef = useRef(null);

  useEffect(() => {
    async function loadSources() {
      if (window.source && window.source.getSources) {
        try {
          const fetchedSources = await window.source.getSources();
          setSources(fetchedSources || []);
          if (fetchedSources && fetchedSources.length > 0) {
            const mic = fetchedSources.find(s => !s.includes('.monitor')) || fetchedSources[0];
            setSelectedSource(mic);
          }
        } catch (err) {
          console.error('Failed to load sources:', err);
        }
      }
    }
    loadSources();
  }, []);

  const handleStartRecording = async () => {
    try {
      if (!selectedSource) return;
      setIsRecording(true);
      setError('');
      setResult(null);
      const path = await window.recorder.start(selectedSource);
      setAudioPath(path);
      // Focus textarea so user can type immediately
      if (textareaRef.current) textareaRef.current.focus();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Error starting recording.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      await window.recorder.stop();
      // Automatically trigger enhance after stop
      handleEnhance();
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Error stopping recording.');
    }
  };

  const handleEnhance = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use the path we just recorded (or existing one)
      // Note: In a real app we might need to wait for the file to be fully written
      // but for now we assume the stop promise resolves when ready.
      const resp = await window.recorder.enhanceNotes(audioPath, notes);
      
      if (resp && resp.success) {
        setResult(resp);
      } else {
        setError(resp.error || 'Failed to enhance notes.');
      }
    } catch (err) {
      console.error('Enhance error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Subtle Source Selector */}
      <select 
        className="source-select"
        value={selectedSource} 
        onChange={(e) => setSelectedSource(e.target.value)}
        disabled={isRecording}
      >
        {sources.map((src, idx) => (
          <option key={idx} value={src}>{src}</option>
        ))}
      </select>

      {/* Main Editor Area */}
      <div className="editor-container">
        {result ? (
          <div className="enhanced-content">
            <div className="status-badge enhancing">
              <span>✨ Enhanced Notes</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {result.enhancedNotes || result.enhanced_notes}
            </div>
            
            {/* Transcript Toggle (Simplified as a section for now) */}
            <div style={{ marginTop: '3rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <h4 style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1rem' }}>TRANSCRIPT</h4>
              <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>{result.transcript}</p>
            </div>
          </div>
        ) : (
          <>
            {loading && (
              <div className="status-badge enhancing">
                <span>✨ Enhancing your notes...</span>
              </div>
            )}
            <textarea 
              ref={textareaRef}
              className="editor-textarea" 
              placeholder="Start typing your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </>
        )}
      </div>

      {/* Floating Control Bar */}
      <div className="control-bar-container">
        {error && <div style={{ color: '#EF4444', fontSize: '0.875rem' }}>{error}</div>}
        
        <div className="control-pill">
          {isRecording ? (
            <>
              <div className="waveform-visualizer">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1F2937' }}>
                Recording...
              </div>
              <button className="record-btn stop" onClick={handleStopRecording} title="Stop Recording">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {result ? (
                <button 
                  className="btn" 
                  style={{ color: '#6B7280', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none' }}
                  onClick={() => { setResult(null); setNotes(''); setAudioPath(''); }}
                >
                  Start New Note
                </button>
              ) : (
                <button className="record-btn start" onClick={handleStartRecording} title="Start Recording">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
