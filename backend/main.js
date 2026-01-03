const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');

const FFmpegRecorder = require('./recorder');

const osType = process.platform;
console.log("Platform:", osType);

const recorder = new FFmpegRecorder();

const createWindow = () => {
    const win = new BrowserWindow({
        height: 800,
        width: 1000, 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    });

   
    win.loadURL('http://localhost:5173').catch(() => {
        console.log("Vite server not running, loading index.html");
        win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
    
 
}

app.whenReady().then(() => {
    ipcMain.handle('start-recording', async (event, micSource) => {
        const outputPath = path.join(__dirname, `./recordings/recording_${Date.now()}.wav`);
        recorder.start(outputPath, micSource);
        return outputPath;
    });

    ipcMain.handle('stop-recording', async () => {
        recorder.stop();
        return "Stopped";
    });

    ipcMain.handle('enhance-notes', async (event, { audioPath, notes }) => {
        console.log("Enhancing notes for:", audioPath);
        try {
            const formData = new FormData();
            const audioBuffer = fs.readFileSync(audioPath);
            const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
            formData.append('audio', audioBlob, 'recording.wav');
            formData.append('notes', notes);

            const response = await fetch('http://localhost:3000/enhance-notes', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error enhancing notes:", error);
            return { success: false, error: error.message };
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});