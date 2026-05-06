import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image    = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return mock data so the UI is demonstrable without a real key
      return NextResponse.json(getMockMenuResult());
    }

    // Convert file to base64
    const bytes   = await image.arrayBuffer();
    const base64  = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const prompt = `
You are a Korean text translator helping tourists in Korea. Analyze this image and extract ALL visible Korean text — including menus, street signs, shop names, banners, labels, price tags, or any other text.

Return a JSON object with this exact structure:
{
  "restaurant": "restaurant or shop name if visible, otherwise null",
  "items": [
    {
      "korean": "original Korean text as seen in image",
      "english": "English translation",
      "description": "Brief helpful description: what it is, where it leads, what it means, or ingredients/cooking if food",
      "spiciness": 0,
      "allergens": [],
      "price": "price if visible, e.g. ₩15,000, otherwise null"
    }
  ]
}

Rules:
- For FOOD items: include spiciness (0=not spicy,1=mild,2=medium,3=hot), allergens from [gluten,dairy,eggs,soy,nuts,shellfish,fish,peanuts]
- For SIGNS/DIRECTIONS: set spiciness=0, allergens=[], describe what the sign means or where it points
- For SHOP NAMES: describe what kind of shop it is
- For PRICES/LABELS: translate and explain
- Include every piece of Korean text visible, even partial words
- If no Korean text found, return { "restaurant": null, "items": [] }
Return ONLY valid JSON. No markdown, no extra text.
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
              {
                type:      "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
              },
            ],
          },
        ],
        max_tokens:      1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message ?? "OpenAI API error");
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed  = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/translate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 500 }
    );
  }
}

function getMockMenuResult() {
  return {
    restaurant: "맛집 식당 (Demo Restaurant)",
    items: [
      {
        korean:      "삼겹살",
        english:     "Samgyeopsal (Grilled Pork Belly)",
        description: "Thick slices of pork belly grilled at the table. Served with lettuce wraps, garlic, and dipping sauces. A Korean BBQ staple.",
        spiciness:   0,
        allergens:   ["soy"],
        price:       "₩16,000",
      },
      {
        korean:      "김치찌개",
        english:     "Kimchi Jjigae (Kimchi Stew)",
        description: "Hearty stew made with fermented kimchi, pork, tofu, and vegetables. Tangy, savory, and warming.",
        spiciness:   2,
        allergens:   ["soy", "gluten"],
        price:       "₩9,000",
      },
      {
        korean:      "된장찌개",
        english:     "Doenjang Jjigae (Fermented Soybean Paste Stew)",
        description: "Traditional Korean stew with fermented soybean paste, vegetables, tofu, and mushrooms. Earthy and umami-rich.",
        spiciness:   1,
        allergens:   ["soy"],
        price:       "₩9,000",
      },
      {
        korean:      "비빔밥",
        english:     "Bibimbap (Mixed Rice Bowl)",
        description: "Rice topped with assorted sautéed vegetables, a fried egg, and gochujang (red pepper paste). Mix well before eating!",
        spiciness:   1,
        allergens:   ["eggs", "soy", "gluten"],
        price:       "₩11,000",
      },
    ],
  };
}
