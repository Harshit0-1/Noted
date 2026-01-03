const { spawn, execSync } = require('child_process');
const path = require('path');

class FFmpegRecorder {
    constructor() {
        this.process = null;
    }

    getAudioSources(micSourceOverride = null) {
        try {

            
            const defaultSource = micSourceOverride || knownWorkingMic || execSync("pactl get-default-source").toString().trim();

            const defaultSink = execSync("pactl get-default-sink").toString().trim();
            const defaultMonitor = `${defaultSink}.monitor`;

            console.log(`Using Mic: ${defaultSource}`);
            console.log(`Using System Monitor: ${defaultMonitor}`);

            return { mic: defaultSource, system: defaultMonitor };
        } catch (e) {
            console.error("Failed to detect audio sources:", e.message);
            return { mic: "default", system: "0" };
        }
    }

    listAudioSources() {
        try {
            const sources = execSync("pactl list sources short").toString();
            console.log("\nAvailable Audio Sources:");
            console.log(sources);
            return sources;
        } catch (e) {
            console.error("Failed to list audio sources:", e.message);
            return "";
        }
    }

    start(outputPath, micSource = null) {
        if (this.process) {
            console.log("Recording already in progress");
            return;
        }

        const file = outputPath || path.join(__dirname, 'output.wav');
        const sources = this.getAudioSources(micSource);

        console.log(`Starting FFmpeg recording (Mixed System + Mic) to ${file}...`);

    

        const args = [
            '-y',
            '-f', 'pulse', '-i', sources.system,
            '-f', 'pulse', '-i', sources.mic,
            '-filter_complex', 'amix=inputs=2:duration=longest',
            '-ac', '1',
            '-ar', '44100',
            file
        ];

        this.process = spawn('ffmpeg', args);


        this.process.on('close', (code) => {
            console.log(`FFmpeg process exited with code ${code}`);
            this.process = null;
        });

        this.process.on('error', (err) => {
            console.error('Failed to start FFmpeg process:', err);
        });
    }

    stop() {
        if (!this.process) {
            console.log("No recording to stop");
            return;
        }
        console.log("Stopping FFmpeg recording...");
        this.process.kill('SIGINT');
    }
}

module.exports = FFmpegRecorder;
