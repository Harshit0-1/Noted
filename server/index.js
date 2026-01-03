const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { processRecording } = require('./agent');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/enhance-notes', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio file uploaded' });
        }
        
        const audioPath = req.file.path;
        const notes = req.body.notes || '';
        
        console.log(`Received request to enhance notes. Audio: ${audioPath}, Notes length: ${notes.length}`);

        const result = await processRecording(audioPath, notes);
        
        // Cleanup uploaded file
        fs.unlink(audioPath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
        
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
