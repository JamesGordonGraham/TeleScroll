import { SpeechClient } from '@google-cloud/speech';

// Initialize Google Cloud Speech client
let speechClient: SpeechClient | null = null;

function initializeSpeechClient() {
  if (speechClient) return speechClient;

  try {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (credentialsJson) {
      // Use service account credentials from environment
      const credentials = JSON.parse(credentialsJson);
      speechClient = new SpeechClient({
        credentials,
        projectId: credentials.project_id,
      });
    } else if (process.env.GOOGLE_SPEECH_API_KEY) {
      // Use API key
      speechClient = new SpeechClient({
        apiKey: process.env.GOOGLE_SPEECH_API_KEY,
      });
    } else {
      throw new Error('No Google Speech credentials found');
    }
    
    console.log('Google Speech client initialized successfully');
    return speechClient;
  } catch (error) {
    console.error('Failed to initialize Google Speech client:', error);
    throw error;
  }
}

export async function transcribeAudio(audioBuffer: Buffer, languageCode = 'en-US') {
  try {
    // Handle empty buffer test case
    if (audioBuffer.length === 0) {
      return {
        success: true,
        transcript: '',
        confidence: 0,
      };
    }

    const client = initializeSpeechClient();
    
    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode,
        enableAutomaticPunctuation: true,
        model: 'latest_long',
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ') || '';

    return {
      success: true,
      transcript: transcription,
      confidence: response.results?.[0]?.alternatives?.[0]?.confidence || 0,
    };
  } catch (error) {
    console.error('Speech transcription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transcript: '',
    };
  }
}

export function createStreamingRecognition(languageCode = 'en-US') {
  try {
    const client = initializeSpeechClient();
    
    const recognizeStream = client.streamingRecognize({
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode,
        enableAutomaticPunctuation: true,
        model: 'latest_short',
      },
      interimResults: true,
    });

    return recognizeStream;
  } catch (error) {
    console.error('Failed to create streaming recognition:', error);
    throw error;
  }
}