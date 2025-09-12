
import { GoogleGenAI, Type } from "@google/genai";
import type { MeetingSummary } from '../types';

const getGeminiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

export const getMeetingSummary = async (transcript: string): Promise<MeetingSummary> => {
    try {
        const ai = getGeminiClient();
        const prompt = `Analyze the following meeting transcript. Provide a concise title for the meeting, a brief summary, a few key discussion points, and a list of action items with their assigned owners. Format the output as JSON.

Transcript:
---
${transcript}
---
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A concise title for the meeting." },
                        summary: { type: Type.STRING, description: "A brief summary of the meeting." },
                        keyPoints: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of the main topics or decisions discussed."
                        },
                        actionItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    owner: { type: Type.STRING, description: "The person assigned to the action item." },
                                    task: { type: Type.STRING, description: "The description of the action item." }
                                },
                                required: ["owner", "task"]
                            },
                            description: "A list of tasks to be completed, with owners."
                        }
                    },
                    required: ["title", "summary", "keyPoints", "actionItems"]
                },
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as MeetingSummary;

    } catch (error) {
        console.error("Error generating meeting summary:", error);
        throw new Error("Failed to generate meeting summary. Please check the transcript and try again.");
    }
};
