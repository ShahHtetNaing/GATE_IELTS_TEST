import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Skill, TestContext, TestResult, UserResponse } from "../types";

const getClient = () => {
  let apiKey = '';
  
  // Strategy 1: Standard process.env (Node.js / Webpack / Parcel / React Scripts)
  // This is the default requirement. Bundlers typically replace 'process.env.API_KEY' with the string value.
  try {
    apiKey = process.env.API_KEY || '';
  } catch (e) {
    // ReferenceError if process is not defined
  }

  // Strategy 2: import.meta.env (Vite / Modern ESM)
  // If the project is built with Vite, variables are often on import.meta.env.
  // Note: Vite usually requires variables to be prefixed with VITE_, but we check both just in case.
  if (!apiKey) {
    try {
      // @ts-ignore
      apiKey = import.meta.env?.VITE_API_KEY || '';
      // @ts-ignore
      if (!apiKey) apiKey = import.meta.env?.API_KEY || '';
    } catch (e) {
      // SyntaxError or ReferenceError in older environments
    }
  }

  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure 'API_KEY' (or 'VITE_API_KEY' if using Vite) is set in your Netlify Site Settings > Environment Variables.");
  }

  return new GoogleGenAI({ apiKey });
};

// Schemas for structured output
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    text: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['multiple-choice', 'text', 'boolean'] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING }
  },
  required: ['id', 'text', 'type']
};

const testContextSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    introText: { type: Type.STRING },
    questions: { type: Type.ARRAY, items: questionSchema },
    tasks: { // Writing
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          prompt: { type: Type.STRING },
          minWords: { type: Type.INTEGER }
        }
      }
    },
    parts: { // Speaking
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  }
};

const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallBand: { type: Type.NUMBER },
    criteria: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          improvement: { type: Type.STRING }
        },
        required: ['name', 'score', 'feedback', 'improvement']
      }
    },
    generalFeedback: { type: Type.STRING },
    improvementPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['overallBand', 'criteria', 'generalFeedback', 'improvementPlan']
};

const wordDefinitionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    definition: { type: Type.STRING },
    usage: { type: Type.STRING },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['definition', 'usage']
};

const essayAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    structureAnalysis: { type: Type.STRING },
    keyVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
    grammarHighlights: { type: Type.STRING },
    coherenceComment: { type: Type.STRING }
  },
  required: ['structureAnalysis', 'keyVocabulary', 'grammarHighlights', 'coherenceComment']
};

const cleanJson = (text: string) => {
  // 1. Remove markdown code blocks
  let cleaned = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  
  // 2. Locate the first '{' and last '}' to handle any preamble text
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  
  return cleaned.trim();
};

export const generateTest = async (skill: Skill, count: number): Promise<TestContext> => {
  // Check client first to throw immediate error if key is missing
  let ai;
  try {
     ai = getClient();
  } catch (e) {
    throw e; 
  }

  // CHANGED: gemini-2.5-flash is significantly faster and excellent for structured generation.
  // gemini-3-pro-preview was causing timeouts on generation.
  const model = "gemini-2.5-flash"; 

  let prompt = "";
  if (skill === 'reading') {
    prompt = `Generate a rigorous Academic IELTS Reading test with exactly ${count} questions based on a new, generated academic passage (approx 600-800 words). The passage should be about a topic in science, history, or sociology. Questions should vary (Multiple Choice, True/False/Not Given, Short Answer).`;
  } else if (skill === 'listening') {
    prompt = `Generate a simulation of an Academic IELTS Listening test with exactly ${count} questions. 
    First, generate a transcript of a conversation or lecture (approx 5 minutes reading time).
    Then, provide questions based on this transcript. 
    Crucial: The 'introText' field MUST contain the full transcript so the user can read it (simulating listening) or I can use TTS.`;
  } else if (skill === 'writing') {
    prompt = `Generate an Academic IELTS Writing test. 
    Since the user selected ${count} questions, interpret this as complexity/options.
    Provide 2 distinct tasks: Task 1 (Data interpretation - describe a hypothetical chart/graph provided in text description) and Task 2 (Essay prompt). 
    Ignore the exact 'question count' for writing, just give standard 2 tasks.`;
  } else if (skill === 'speaking') {
    prompt = `Generate an Academic IELTS Speaking test structure.
    Include 3 Parts: Part 1 (Introduction/Interview), Part 2 (Long Turn - Cue Card), Part 3 (Discussion).
    Provide the specific questions/prompts for the examiner to ask.`;
  }

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: testContextSchema,
        systemInstruction: "You are an expert IELTS test creator. Create high-quality, challenging academic content suitable for university-bound students."
      }
    });

    const text = res.text;
    if (!text) throw new Error("No content generated");
    
    const jsonStr = cleanJson(text);
    const data = JSON.parse(jsonStr) as TestContext;
    return { ...data, skill, id: Date.now().toString() };
  } catch (error) {
    console.error("Gen Test Error", error);
    throw error;
  }
};

export const evaluateTest = async (
  skill: Skill, 
  testContext: TestContext, 
  responses: UserResponse[]
): Promise<TestResult> => {
  const ai = getClient();
  // CHANGED: Switch to Flash for faster grading feedback as well.
  const model = "gemini-2.5-flash";

  // Prepare the content for evaluation
  let userContent = "";
  
  if (skill === 'speaking') {
     userContent = JSON.stringify(responses.map(r => ({ part: r.partId, response: r.answer })));
  } else {
    userContent = JSON.stringify(responses);
  }

  // Specific Criteria Lists
  const criteriaMap = {
    listening: ["Main Ideas", "Specific Details", "Inference", "Vocabulary"],
    reading: ["Skimming & Scanning", "Detail Comprehension", "Inference", "Vocabulary Range"],
    writing: ["Task Achievement", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"],
    speaking: ["Fluency & Coherence", "Lexical Resource", "Grammatical Range & Accuracy", "Pronunciation"]
  };

  const currentCriteria = criteriaMap[skill];

  const prompt = `
    You are a strict IELTS Senior Examiner. Evaluate this student's ${skill} test.
    
    Test Context (Questions/Prompts):
    ${JSON.stringify(testContext)}
    
    Student Responses:
    ${userContent}
    
    Task:
    1. Grade the responses against official IELTS Academic standards (Band 0-9).
    2. Provide a breakdown for EXACTLY these 4 criteria: ${currentCriteria.join(', ')}.
    3. For EACH criterion, give a score (0-9), detailed feedback explaining why, and a specific improvement tip.
    4. Provide an overall band score (average, rounded down/up per IELTS rules).
    5. Write a general summary and a step-by-step improvement plan.
  `;

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      }
    });

    const text = res.text;
    if (!text) throw new Error("No evaluation generated");
    
    const jsonStr = cleanJson(text);
    return JSON.parse(jsonStr) as TestResult;
  } catch (error) {
    console.error("Evaluation Error", error);
    throw error;
  }
};

export const getWordDefinition = async (word: string) => {
  const ai = getClient();
  const model = "gemini-2.5-flash";

  const prompt = `Define the academic word "${word}" for an IELTS student. 
  Provide a clear, concise definition and one sophisticated example sentence showing how to use it in an essay.
  Also provide 2-3 synonyms.`;

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: wordDefinitionSchema,
      }
    });

    const text = res.text;
    if (!text) throw new Error("No definition generated");
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Word Definition Error", error);
    throw error;
  }
};

export const analyzeWritingTechnique = async (question: string, essay: string) => {
  const ai = getClient();
  const model = "gemini-2.5-flash";

  const prompt = `
    Analyze the following IELTS Band 9 essay sample.
    Question: ${question}
    Essay: ${essay}

    Provide an in-depth analysis of the writing techniques used:
    1. Structure Analysis: How is the argument built? (Intro, Body Paragraphs, Conclusion)
    2. Key Vocabulary: List 5-7 sophisticated words/phrases used in context.
    3. Grammar Highlights: Point out complex sentence structures.
    4. Coherence: How are ideas linked?
  `;

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: essayAnalysisSchema,
      }
    });

    const text = res.text;
    if (!text) throw new Error("No analysis generated");
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Essay Analysis Error", error);
    throw error;
  }
};