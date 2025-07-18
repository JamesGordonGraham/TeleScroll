import { SpeechClient } from '@google-cloud/speech';

// Initialize Google Cloud Speech client
let speechClient: SpeechClient | null = null;

function initializeSpeechClient() {
  if (speechClient) return speechClient;

  try {
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    
    if (apiKey) {
      // Use API key (preferred method)
      console.log('Using Google Speech API key');
      speechClient = new SpeechClient({
        apiKey: apiKey,
      });
    } else {
      // Fallback to service account credentials
      const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      
      if (credentialsJson) {
        console.log('Using service account credentials from JSON');
        let credentials;
        try {
          credentials = JSON.parse(credentialsJson.trim());
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON format for service account credentials');
        }

        if (!credentials.project_id) {
          throw new Error('Invalid credentials: missing project_id');
        }

        console.log('Creating SpeechClient with credentials for project:', credentials.project_id);
        speechClient = new SpeechClient({
          credentials,
          projectId: credentials.project_id,
        });
      } else {
        throw new Error('No Google Speech credentials found. Please provide either GOOGLE_SPEECH_API_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON');
      }
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
        enableWordTimeOffsets: false,
        model: 'latest_long', // Use latest_long model for better accuracy
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