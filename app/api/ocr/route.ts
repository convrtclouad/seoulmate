import { NextRequest, NextResponse } from "next/server";

interface OcrResult {
  amount?: number;
  date?: string;
  merchant?: string;
  raw_text: string;
}

/**
 * Receipt OCR — placeholder implementation.
 * In production: use AWS Textract, Google Cloud Vision, or OpenAI GPT-4o.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image    = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return placeholder data
      const mock: OcrResult = {
        amount:   42000,
        date:     new Date().toISOString().split("T")[0],
        merchant: "Korean Restaurant (demo)",
        raw_text: "OCR placeholder — add OPENAI_API_KEY to enable",
      };
      return NextResponse.json(mock);
    }

    const bytes  = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mime   = image.type || "image/jpeg";

    const prompt = `
Extract receipt information from this image. Return a JSON object:
{
  "amount": <total amount as number in KRW, or null if not found>,
  "date": "<YYYY-MM-DD format, or null>",
  "merchant": "<store/restaurant name, or null>",
  "raw_text": "<all visible text on the receipt>"
}
Return ONLY valid JSON.
    `.trim();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role:    "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
        max_tokens:      500,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error("OpenAI OCR error");

    const data    = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed  = JSON.parse(content) as OcrResult;

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/ocr]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OCR failed" },
      { status: 500 }
    );
  }
}
