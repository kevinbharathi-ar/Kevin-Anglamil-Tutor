import { GoogleGenAI, Modality, Type } from "@google/genai";
import { DailyWord, TranslationResult, VocabularyItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instructions for the chat model
const CHAT_SYSTEM_INSTRUCTION = `
You are an expert English tutor for Tamil speakers. 
Your goal is to help the user learn English.
1. If the user writes in Tamil, translate it to English and reply in English, but also provide the Tamil meaning of your reply.
2. If the user writes in English, correct any grammar mistakes politely and keep the conversation going.
3. Keep responses concise and helpful. 
4. Always support your English explanations with Tamil context if the concept is difficult.
`;

const TRANSLATE_SYSTEM_INSTRUCTION = `
You are a precise translator between English and Tamil.
Return the result in JSON format with fields: 'translated', 'pronunciation' (how to say the English part in Tamil script), and 'grammarNotes' (if applicable).
`;

/**
 * Sends a message to the Gemini Chat model
 */
export const sendMessageToGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

/**
 * Translates text and returns structured data
 */
export const translateText = async (text: string, fromLang: 'en' | 'ta'): Promise<TranslationResult> => {
  try {
    const prompt = `Translate this ${fromLang === 'en' ? 'English' : 'Tamil'} text to ${fromLang === 'en' ? 'Tamil' : 'English'}: "${text}".`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: TRANSLATE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            grammarNotes: { type: Type.STRING },
          },
          required: ["translated"],
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      original: text,
      translated: json.translated,
      pronunciation: json.pronunciation,
      grammarNotes: json.grammarNotes
    };
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};

/**
 * Translates text found in an image
 */
export const translateImage = async (base64Image: string, fromLang: 'en' | 'ta'): Promise<TranslationResult> => {
  try {
    const targetLang = fromLang === 'en' ? 'Tamil' : 'English';
    const sourceLang = fromLang === 'en' ? 'English' : 'Tamil';
    
    // Create parts for the model
    const parts = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      },
      {
        text: `Identify the text in this image (assuming it is ${sourceLang}). Translate the identified text to ${targetLang}. Return the result in JSON.`
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: TRANSLATE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            grammarNotes: { type: Type.STRING },
          },
          required: ["translated"],
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      original: "Image Text",
      translated: json.translated,
      pronunciation: json.pronunciation,
      grammarNotes: json.grammarNotes
    };
  } catch (error) {
    console.error("Image Translation Error:", error);
    throw error;
  }
};

/**
 * Generates a "Word of the Day"
 */
export const getDailyWord = async (): Promise<DailyWord> => {
  try {
    const prompt = "Generate a random, useful English word for a beginner learner. Provide its Tamil meaning, and a simple example sentence with its Tamil translation.";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            tamilMeaning: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
            exampleTamil: { type: Type.STRING },
          },
          required: ["word", "tamilMeaning", "exampleSentence", "exampleTamil"]
        }
      }
    });
    
    if (!response.text) {
      throw new Error("Received empty response from Gemini API");
    }

    return JSON.parse(response.text) as DailyWord;
  } catch (error) {
    console.warn("Daily Word API Error (Using Fallback):", error);
    // Fallback
    return {
      word: "Welcome",
      tamilMeaning: "நல்வரவு (Nalvaravu)",
      exampleSentence: "Welcome to the English class.",
      exampleTamil: "ஆங்கில வகுப்பிற்கு நல்வரவு."
    };
  }
}

/**
 * Fetches vocabulary based on a category (Oxford Dictionary style)
 */
export const getVocabularyByCategory = async (category: string): Promise<VocabularyItem[]> => {
  try {
    const prompt = `Act as an Oxford Dictionary for learners. Provide 5 essential and useful English vocabulary words or phrases related to the category "${category}". 
    For each item, provide:
    1. The word or phrase.
    2. A simple, clear Oxford-style English definition.
    3. The Tamil meaning.
    4. A practical example sentence in English.
    5. The Tamil translation of the example sentence.
    
    Ensure the examples are relevant to the category.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              definition: { type: Type.STRING },
              tamilMeaning: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              exampleTamil: { type: Type.STRING },
            },
            required: ["word", "definition", "tamilMeaning", "exampleSentence", "exampleTamil"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]") as VocabularyItem[];
  } catch (error) {
    console.error("Vocabulary Fetch Error:", error);
    return [];
  }
};

/**
 * Text-to-Speech using Gemini
 */
export const speakText = async (text: string): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Clean, standard voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    // Decode logic for browser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Helper to decode PCM to AudioBuffer
    const dataInt16 = new Int16Array(bytes.buffer);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
    
    for (let channel = 0; channel < numChannels; channel++) {
       const channelData = buffer.getChannelData(channel);
       for (let i = 0; i < frameCount; i++) {
         channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
       }
    }

    return buffer;

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
};