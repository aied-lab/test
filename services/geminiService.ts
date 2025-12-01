import { GoogleGenAI, Type } from "@google/genai";

// Helper to get the AI client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("Gemini API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateConversationStarter = async (topic: string = "technology"): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, engaging conversation starter question about ${topic} that I can ask an AI avatar. The question should be under 20 words.`,
      config: {
        temperature: 0.9,
      }
    });
    return response.text || "Tell me about yourself.";
  } catch (error) {
    console.error("Error generating starter:", error);
    return "Hello, how are you today?";
  }
};

export const generateResponseSuggestion = async (history: {role: string, text: string}[]): Promise<string> => {
  try {
    const ai = getAiClient();
    // Convert history to a simple string format
    const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
    
    const prompt = `
      Based on the following conversation history, suggest a short, relevant follow-up response or question for the User to say to the Agent.
      
      Conversation:
      ${historyText}
      
      Suggestion (plain text, under 30 words):
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "That is interesting, tell me more.";
  } catch (error) {
    console.error("Error generating suggestion:", error);
    return "Can you elaborate on that?";
  }
};
