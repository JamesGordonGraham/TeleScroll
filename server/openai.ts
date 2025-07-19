import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI secret: OPENAI_API_KEY');
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ScriptGenerationRequest {
  scriptType: string;
  topic: string;
  duration: number; // in minutes
  tone?: string;
  audience?: string;
  keyPoints?: string[];
  additionalInstructions?: string;
}

export async function generateScript(request: ScriptGenerationRequest): Promise<string> {
  const { scriptType, topic, duration, tone = "professional", audience = "general", keyPoints = [], additionalInstructions = "" } = request;

  let prompt = "";

  // Generate specific prompts based on script type
  switch (scriptType) {
    case "news":
      prompt = `Write a ${duration}-minute news script about "${topic}". Use a ${tone} tone suitable for ${audience}. Structure it with a compelling lead, key facts, quotes if relevant, and a strong conclusion. Make it broadcast-ready with clear, concise sentences.`;
      break;
    case "presentation":
      prompt = `Create a ${duration}-minute presentation script on "${topic}" for ${audience}. Use a ${tone} tone. Structure it with an engaging opening, main points with supporting details, and a memorable conclusion. Include natural transition phrases and speaker cues.`;
      break;
    case "keynote":
      prompt = `Write an inspiring ${duration}-minute keynote speech about "${topic}" for ${audience}. Use a ${tone} yet motivational tone. Include personal anecdotes, compelling statistics, actionable insights, and a powerful call-to-action.`;
      break;
    case "wedding":
      prompt = `Create a heartfelt ${duration}-minute wedding speech about "${topic}". Use a ${tone} and warm tone. Include personal stories, meaningful advice, and well-wishes. Make it emotional yet appropriate for all guests.`;
      break;
    case "comedy":
      prompt = `Write a funny ${duration}-minute comedy script about "${topic}". Use a ${tone} comedic style suitable for ${audience}. Include setup-punchline structures, callbacks, and observational humor. Ensure it's clean and engaging.`;
      break;
    case "business":
      prompt = `Create a professional ${duration}-minute business address about "${topic}" for ${audience}. Use a ${tone} tone. Focus on clear objectives, data-driven points, strategic insights, and actionable next steps.`;
      break;
    case "awards":
      prompt = `Write a gracious ${duration}-minute awards ceremony speech about "${topic}". Use a ${tone} and appreciative tone. Include acknowledgments, personal reflections, and inspiring messages for ${audience}.`;
      break;
    default:
      prompt = `Create a ${duration}-minute speech script about "${topic}" for ${audience}. Use a ${tone} tone and make it engaging and well-structured.`;
  }

  // Add key points if provided
  if (keyPoints.length > 0) {
    prompt += `\n\nKey points to include: ${keyPoints.join(", ")}.`;
  }

  // Add additional instructions
  if (additionalInstructions) {
    prompt += `\n\nAdditional instructions: ${additionalInstructions}`;
  }

  prompt += `\n\nFormat the script with clear paragraph breaks and natural pacing for teleprompter use. Include timing cues where appropriate. Make it exactly the right length for ${duration} minutes of speaking at a normal pace (approximately ${duration * 150} words).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert speech writer and teleprompter script specialist. Create engaging, well-structured scripts that are easy to read aloud with natural pacing and clear formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: Math.min(4000, duration * 200), // Adjust based on duration
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Failed to generate script content.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate script: " + error.message);
  }
}

export async function improveScript(content: string, instructions: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert script editor. Improve scripts while maintaining their core message and structure. Focus on clarity, flow, and teleprompter readability."
        },
        {
          role: "user",
          content: `Please improve this script based on these instructions: "${instructions}"\n\nOriginal script:\n${content}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return response.choices[0].message.content || "Failed to improve script content.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to improve script: " + error.message);
  }
}