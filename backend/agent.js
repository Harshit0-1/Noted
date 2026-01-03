const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { StateGraph, START, END } = require('@langchain/langgraph');
const dotenv = require('dotenv');
const z = require('zod');
const fs = require('fs');

dotenv.config();

const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash'
});

// Switching to whisper-large for better multi-language detection
// let deepgramUrl = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true&utterances=true";

// if (language === "auto") {

// deepgramUrl += "&detect_language=true";

// } else if (language) {

// deepgramUrl += `&language=${language}`;

// }
// const url = "https://api.deepgram.com/v1/listen?model=whisper-large&smart_format=true&detect_language=true";
// Switching to whisper-large for better multi-language detection
// Switching back to nova-2 which is faster and reliable for detection (now that headers are fixed)
const url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true";

const AgentState = z.object({
    transcript: z.string(),
    notes: z.string(),
    enhanced_notes: z.string(),
    audioPath: z.string() 
});

async function transcribeFile(state) {
    const { audioPath } = state;
    console.log("Transcribing file:", audioPath);
    const fileData = fs.readFileSync(audioPath);

    // Logic adapted from user's snippet
    let deepgramUrl = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true&utterances=true&detect_language=true";

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            console.log(`Attempting transcription ${attempt}/${MAX_RETRIES}...`);
            const response = await fetch(deepgramUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
                    "Content-Type": "audio/wav"
                },
                body: fileData
            });

            if (!response.ok) {
                throw new Error(`Deepgram error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log("Deepgram Result:", JSON.stringify(result, null, 2));

            if (!result.results || !result.results.channels || !result.results.channels[0] || !result.results.channels[0].alternatives || !result.results.channels[0].alternatives[0]) {
                throw new Error("No transcription results found");
            }

            const transcript = result.results.channels[0].alternatives[0].transcript;
            console.log("Transcript:", transcript);
            return { transcript };

        } catch (error) {
            console.error(`Deepgram attempt ${attempt} failed:`, error.message);
            if (attempt < MAX_RETRIES) {
                console.log("Retrying in 2 seconds...");
                await new Promise(res => setTimeout(res, 2000));
            } else {
                return { transcript: "Error in transcription: " + error.message };
            }
        }
    }
}

const enhanceNotes = async (state) => {
    const { transcript, notes } = state;
    if (!transcript && !notes) {
        return { enhanced_notes: "No input provided" };
    }
    const prompt = `You are an expert note-taker and editor.
    
    I have some raw notes I took during a meeting, and I also have the full transcript of the meeting.
    Please enhance my notes using the transcript. 
    - Clarify any ambiguous points in my notes using the transcript.
    - Add missing important details from the transcript that I missed.
    - Fix any factual errors in my notes based on the transcript.
    - Maintain the style and structure of my original notes where possible, but make them more professional and complete.
    - If the transcript is in a different language, translate the enhanced notes to English unless the notes themselves are in that language.
    
    Raw Notes:
    ${notes}
    
    Transcript:
    ${transcript}
    
    Output ONLY the enhanced notes.
    `;

    const messages = [
        new SystemMessage("You are a helpful assistant that enhances notes using transcripts."),
        new HumanMessage(prompt)
    ];

    const response = await model.invoke(messages);
    console.log("Enhanced Notes:", response.content);
    return { enhanced_notes: response.content };
}

const graph = new StateGraph(AgentState)
    .addNode('transcribeFile', transcribeFile)
    .addNode('enhanceNotes', enhanceNotes)
    .addEdge(START, 'transcribeFile')
    .addEdge('transcribeFile', 'enhanceNotes')
    .addEdge('enhanceNotes', END);

const app = graph.compile();

async function processRecording(audioPath, userNotes) {
    const initialState = {
        transcript: '',
        notes: userNotes || '',
        enhanced_notes: '',
        audioPath: audioPath 
    };

    try {
        const result = await app.invoke(initialState);
        return {
            transcript: result.transcript,
            enhancedNotes: result.enhanced_notes
        };
    } catch (error) {
        console.error("Error in processRecording:", error);
        throw error;
    }
}

module.exports = { processRecording };
