
const API_KEY = process.env.BHARATCODE_API_KEY;

export async function askBharatCode(prompt: string) {
  if (!API_KEY) {
    throw new Error("BHARATCODE_API_KEY is missing");
  }

  const response = await fetch(
    "https://bharatcode.ai/api/model/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-3.8-27b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`BharatCode API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
