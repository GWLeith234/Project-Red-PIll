import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

export const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || "",
  baseURL: "https://api.x.ai/v1",
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export const gemini = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
});

export { genAI };
