import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runGenerator({ brief, task }) {
  console.log("🧠 Generating app via LLM...");

  const prompt = `
You are an app generator. Build a minimal static web app based on this brief:

"${brief}"

Output JSON with filenames and file contents.
Files: index.html, script.js
`;

  const res = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  try {
    const text = res.choices[0].message.content.trim();
    return JSON.parse(text);
  } catch {
    // fallback simple app
    return {
      "index.html": `<html><body><h1>${task}</h1><script src="script.js"></script></body></html>`,
      "script.js": `console.log("App loaded");`,
    };
  }
}
