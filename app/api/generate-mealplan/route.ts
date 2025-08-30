

// app/api/generate-mealplan/route.ts

import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { dietType, calories, allergies, cuisine, snacks } =
      await request.json();

    // Build the prompt with dynamic values
    const prompt = `
      You are a professional nutritionist. Create a 7-day meal plan for an individual following a ${dietType} diet aiming for ${calories} calories per day.

      Allergies or restrictions: ${allergies || "none"}.
      Preferred cuisine: ${cuisine || "no preference"}.
      Snacks included: ${snacks ? "yes" : "no"}.

      For each day, provide:
        - Breakfast
        - Lunch
        - Dinner
        ${snacks ? "- Snacks" : ""}

      Use simple ingredients and provide brief instructions. Include approximate calorie counts for each meal.

      Structure the response strictly as a JSON object where each day is a key, and each meal (breakfast, lunch, dinner, snacks) is a sub-key. 
      Example:

      {
        "Monday": {
          "Breakfast": "Oatmeal with fruits - 350 calories",
          "Lunch": "Grilled chicken salad - 500 calories",
          "Dinner": "Steamed vegetables with quinoa - 600 calories",
          "Snacks": "Greek yogurt - 150 calories"
        },
        "Tuesday": {
          "Breakfast": "Smoothie bowl - 300 calories",
          "Lunch": "Turkey sandwich - 450 calories",
          "Dinner": "Baked salmon with asparagus - 700 calories",
          "Snacks": "Almonds - 200 calories"
        }
      }

      Return ONLY the JSON object. No extra text or formatting.
    `;

    // Send the prompt to the AI model
   

  
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are a meal plan generator..." },
    { role: "user", content: prompt }
  ],
  temperature: 0.7,
  response_format: { type: "json_object" } // ensures valid JSON
});



    const aiContent = response.choices[0].message?.content?.trim();
    if (!aiContent) {
      throw new Error("No content received from AI");
    }

    // Clean any accidental code fences
    const cleanedContent = aiContent.replace(/```json|```/g, "").trim();

    let parsedMealPlan;
    try {
      parsedMealPlan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      return NextResponse.json(
        { error: "Failed to parse meal plan. Please try again." },
        { status: 500 }
      );
    }

    if (typeof parsedMealPlan !== "object" || parsedMealPlan === null) {
      throw new Error("Invalid meal plan format received from AI.");
    }

    return NextResponse.json({ mealPlan: parsedMealPlan });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      { error: "Failed to generate meal plan. Please try again later." },
      { status: 500 }
    );
  }
}

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}
