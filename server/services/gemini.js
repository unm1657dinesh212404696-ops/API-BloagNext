const { GoogleGenerativeAI } = require('@google/generative-ai');
const httpError = require('../utils/httpError');

async function generate(prompt) {
  if (!process.env.GEMINI_API_KEY) throw httpError(500, 'GEMINI_API_KEY is not configured');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    throw httpError(502, `AI service error: ${err.message}`);
  }
}

exports.generateBlog = async ({ topic, tone = 'professional', length = 'medium', keywords = [] }) => {
  const words = { short: 400, medium: 800, long: 1400 }[length] || 800;
  const prompt = `Write a well-structured blog post about "${topic}".
Tone: ${tone}. Target length: about ${words} words.
${keywords.length ? `Naturally include these keywords: ${keywords.join(', ')}.` : ''}
Return ONLY valid JSON (no markdown fences) with this shape:
{"title": string, "content": string (markdown body with headings), "tags": string[] (3-6), "category": string}`;
  const raw = await generate(prompt);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch (e) {
    return { title: topic, content: raw, tags: keywords, category: 'general' };
  }
};

exports.summarize = async (text) => {
  const prompt = `Summarize the following article in 2-3 concise sentences, then give 3 short key takeaways as a dash list.\n\n${text}`;
  return generate(prompt);
};
