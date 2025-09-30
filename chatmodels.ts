import { GoogleGenAI } from "@google/genai";

const model = new GoogleGenAI({
  apiKey: "API KEY HERE", 
});

export async function askModel(details: string, question: string) {
  const response = await model.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Here are details from an Obsidian vault regarding a user's notes:
    ${details}

    Analyze them and, without using any more external information, provide a concise answer to the following question (while also mentioning which files and tagging them that you got the primary information from): 
    ${question}
    `,
  });
  return response.text;
}

export async function testModel(value: string) {
  const response = await model.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Write a random response to the following value: ${value}`,  
  });
  return response.text;
}