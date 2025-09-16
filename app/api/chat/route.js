// app/api/chat/route.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Retry with exponential backoff
async function requestWithRetry(prompt, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} for prompt:`, prompt);

      const chatResponse = await client.chat.completions.create({
        model: "mistralai/devstral-small-2505:free",
        messages: [{ role: "user", content: prompt }],
      });

      const reply = chatResponse.choices?.[0]?.message?.content || "";
      console.log("Received reply:", reply);
      return reply;

    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err);

      const retriable = err?.status === 429 || err?.status >= 500;
      if (!retriable || attempt === maxRetries - 1) throw err;

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.log(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export async function POST(req) {
  try {
    // 🔒 Authentication check
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (token !== process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
      });
    }

    const reply = await requestWithRetry(prompt);
    return new Response(JSON.stringify({ reply }), { status: 200 });

  } catch (err) {
    console.error("Final error:", err);
    const message =
      process.env.NODE_ENV === "development"
        ? err.message || err
        : "Something went wrong, please try again later.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
