import React, { useState, useEffect } from 'react';

function App() {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPath, setAudioPath] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSources() {
      if (window.source && window.source.getSources) {
        try {
          const fetchedSources = await window.source.getSources();
          console.log('Sources:', fetchedSources);
          setSources(fetchedSources || []);
          if (fetchedSources && fetchedSources.length > 0) {
            const mic = fetchedSources.find(s => !s.includes('.monitor')) || fetchedSources[0];
            setSelectedSource(mic);
          }
        } catch (err) {
          console.error('Failed to load sources:', err);
          setError('Failed to load audio sources.');
        }
      } else {
        console.warn('Electron APIs not connected');
        
      }
    }
    loadSources();
  }, []);

  const handleStartRecording = async () => {
    try {
      if (!selectedSource) {
        setError('Please select an audio source.');
        return;
      }
      setIsRecording(true);
      setError('');
      setResult(null);
      
      const path = await window.recorder.start(selectedSource);
      console.log('Recording started, path:', path);
      setAudioPath(path);
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
      console.log('Recording stopped');
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Error stopping recording.');
    }
  };

  const handleEnhance = async () => {
    if (!audioPath) {
      setError('No recording found. Record something first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const resp = await window.recorder.enhanceNotes(audioPath, notes);
      console.log('Enhance result:', resp);
      
      if (resp && resp.success) {
        setResult(resp);
      } else {
        setError(resp.error || 'Failed to enhance notes.');
      }
    } catch (err) {
      console.error('Enhance error:', err);
      setError('An unexpected error occurred during enhancement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Smart Recorder</h1>
        <p className="subtitle">Record code explanations and enhance them with AI</p>
      </header>

      <div className="section">
        <label className="label">Audio Source</label>
        <select 
          className="select-input"
          value={selectedSource} 
          onChange={(e) => setSelectedSource(e.target.value)}
          disabled={isRecording}
        >
          {sources.map((src, idx) => (
            <option key={idx} value={src}>
              {src}
            </option>
          ))}
          {sources.length === 0 && <option>No sources found</option>}
        </select>
      </div>

      <div className="section">
        {!isRecording ? (
          <button className="btn btn-primary" onClick={handleStartRecording}>
            Start Recording
          </button>
        ) : (
          <button className="btn btn-danger" onClick={handleStopRecording}>
            Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="status-bar status-recording">
          <span>● Recording in progress...</span>
        </div>
      )}

      {!isRecording && audioPath && (
        <div className="status-bar">
          <span>✓ Recording saved. Ready to enhance.</span>
        </div>
      )}

      <div className="section" style={{ marginTop: '2rem' }}>
        <label className="label">Notes (Optional)</label>
        <textarea 
          className="text-input" 
          placeholder="Add any context or initial notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="section">
        <button 
          className="btn btn-primary" 
          onClick={handleEnhance}
          disabled={loading || isRecording || !audioPath}
        >
          {loading ? 'Processing...' : 'Enhance Notes'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#EF4444', marginTop: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="result-card">
          <h3 className="result-title">Enhanced Notes</h3>
          <div className="result-content" style={{ marginBottom: '1.5rem' }}>
             {result.enhancedNotes || result.enhanced_notes}
          </div>

          <div className="result-section">
            <h4 style={{ color: '#059669', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem' }}>Transcript</h4>
            <div className="result-content" style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}>
              {result.transcript}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
