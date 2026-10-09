import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import FishDescription from '@/lib/models/FishDescription';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'vendor' && payload.role !== 'admin')) {
      return createErrorResponse('Forbidden', 403);
    }

    const { title, category, waterType, mode } = await request.json();

    if (!title) {
      return createErrorResponse('Product title is required', 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return createErrorResponse('GEMINI_API_KEY is not configured', 500);
    }
    const client = new GoogleGenAI({ apiKey });

    const isAccessory = category === 'Accessories' || (category && category.toLowerCase().includes('accessor'));

    // Mode: Generate FAQs
    if (mode === 'faq') {
      const prompt = isAccessory
        ? `Generate 4 frequently asked questions and expert answers for aquarium buyers interested in the accessory / equipment "${title}" (${category || 'Aquarium Accessories'}).
Include practical questions like compatibility, installation/usage, power/capacity, and maintenance.
Return valid JSON only in this exact format:
[
  { "q": "Question 1?", "a": "Answer 1" },
  { "q": "Question 2?", "a": "Answer 2" },
  { "q": "Question 3?", "a": "Answer 3" },
  { "q": "Question 4?", "a": "Answer 4" }
]
Do not include any markdown code blocks (no \`\`\`json), HTML tags, or extra text. Just raw JSON.`
        : `Generate 4 frequently asked questions and expert answers for aquarium buyers interested in "${title}" (${category || 'Aquarium Species'}, ${waterType || 'Freshwater'}).
Return valid JSON only in this exact format:
[
  { "q": "Question 1?", "a": "Answer 1" },
  { "q": "Question 2?", "a": "Answer 2" },
  { "q": "Question 3?", "a": "Answer 3" },
  { "q": "Question 4?", "a": "Answer 4" }
]
Do not include any markdown code blocks (no \`\`\`json), HTML tags, or extra text. Just raw JSON.`;

      const interaction = await client.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });

      const raw = (interaction.output_text || '')
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      let faqs: Array<{ q: string; a: string }> = [];
      try {
        faqs = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse FAQ JSON from Gemini:', raw);
      }

      return createSuccessResponse({ faq: faqs });
    }

    // Mode: Generate Species / Accessory Details
    if (mode === 'species_details') {
      const prompt = isAccessory
        ? `Write detailed product overview information for aquarium equipment "${title}" (${category || 'Aquarium Accessories'}).
Return valid JSON only in this exact format:
{
  "quickOverview": "A 2-sentence summary of the product highlights.",
  "aboutSpecies": "Detailed background about engineering, materials, features, and build quality.",
  "behavioralTraits": "Compatibility details (tank sizes, fresh/saltwater suitability, placement).",
  "genderIdentification": "Specifications summary and key performance indicators.",
  "sustainabilitySourcing": "Durability, safety certifications, and warranty information."
}
Do not include any markdown code blocks, HTML tags, or extra text. Just raw JSON.`
        : `Write detailed species information for "${title}" (${category || 'Fish'}, ${waterType || 'Freshwater'}).
Return valid JSON only in this exact format:
{
  "quickOverview": "A 2-sentence summary of the species highlights.",
  "aboutSpecies": "Detailed background about origin, appearance, and characteristics.",
  "behavioralTraits": "Information about temperament, swimming level, schooling, and compatibility.",
  "genderIdentification": "How to differentiate males and females.",
  "sustainabilitySourcing": "Notes on captive breeding and ethical sourcing."
}
Do not include any markdown code blocks, HTML tags, or extra text. Just raw JSON.`;

      const interaction = await client.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });

      const raw = (interaction.output_text || '')
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      let speciesDetails = {};
      try {
        speciesDetails = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse species details JSON from Gemini:', raw);
      }

      return createSuccessResponse({ speciesDetails });
    }

    // Mode: Generate Care / Operation Guide
    if (mode === 'care_guide') {
      const prompt = isAccessory
        ? `Provide operational specifications and maintenance tips for aquarium product "${title}" (${category || 'Aquarium Accessories'}).
Return valid JSON only in this exact format:
{
  "careTemp": "Operating range: 15°C - 35°C",
  "carePh": "Suitable for all standard aquatic pH levels (5.5 - 8.5)",
  "careWaterHardness": "Corrosion-resistant for fresh and planted setups",
  "careWaterCurrent": "Optimized for continuous silent operation",
  "careTankSetup": "Easy plug-and-play installation with standard suction mounts or hang-on brackets.",
  "careHidingSpots": "Clean and rinse mechanical media with tank water every 2-4 weeks."
}
Do not include any markdown code blocks, HTML tags, or extra text. Just raw JSON.`
        : `Provide ideal care parameters for "${title}" (${category || 'Aquarium Species'}, ${waterType || 'Freshwater'}).
Return valid JSON only in this exact format:
{
  "careTemp": "22°C - 28°C",
  "carePh": "6.5 - 7.5",
  "careWaterHardness": "4 - 12 dGH",
  "careWaterCurrent": "Low to Moderate",
  "careTankSetup": "Well-planted tank with gentle filtration and open swimming area.",
  "careHidingSpots": "Provide live plants, driftwood, or rock caves for security."
}
Do not include any markdown code blocks, HTML tags, or extra text. Just raw JSON.`;

      const interaction = await client.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });

      const raw = (interaction.output_text || '')
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      let careGuide = {};
      try {
        careGuide = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse care guide JSON from Gemini:', raw);
      }

      return createSuccessResponse({ careGuide });
    }

    // Mode: Generate All Content At Once
    if (mode === 'all') {
      const prompt = isAccessory
        ? `Generate comprehensive product content for aquarium equipment / accessory "${title}" (${category || 'Aquarium Accessories'}).
Return valid JSON only in this exact format:
{
  "description": "Engaging 3-paragraph product description highlighting features, build quality, and convenience.",
  "quickOverview": "A 2-sentence summary of the accessory highlights and purpose.",
  "aboutSpecies": "Detailed background about materials, technology, engineering, and reliability.",
  "behavioralTraits": "Compatibility recommendations (tank capacities, setup types, water conditions).",
  "genderIdentification": "Key dimensions and technical specifications.",
  "sustainabilitySourcing": "Energy efficiency, safety standards, and warranty notes.",
  "careTemp": "Operating range: 18°C - 32°C",
  "carePh": "Safe for freshwater and planted aquariums",
  "careWaterHardness": "Durable and non-reactive components",
  "careWaterCurrent": "Smooth, silent and energy-efficient flow",
  "careTankSetup": "Secure suction cup or bracket mounting with straightforward cable routing.",
  "careHidingSpots": "Regular rinse and inspection every 3-4 weeks for optimal longevity.",
  "faq": [
    { "q": "What tank sizes is this suitable for?", "a": "Ideal for nano to medium sized aquariums up to 100 liters." },
    { "q": "How often should it be cleaned?", "a": "We recommend a quick rinse in aquarium water once every 2-3 weeks." },
    { "q": "Is it energy efficient?", "a": "Yes, engineered with low power consumption for 24/7 continuous operation." },
    { "q": "Does it come with mounting accessories?", "a": "Yes, standard suction cups and fittings are included in the package." }
  ]
}
Do not include any markdown code blocks, HTML tags, or extra text. Just raw JSON.`
        : `Generate comprehensive product content for "${title}" (${category || 'Aquarium Species'}, ${waterType || 'Freshwater'}).
Return valid JSON only in this exact format:
{
  "description": "Engaging 3-paragraph product description.",
  "quickOverview": "A 2-sentence summary of the species highlights.",
  "aboutSpecies": "Detailed background about origin, appearance, and characteristics.",
  "behavioralTraits": "Information about temperament, swimming level, schooling, and compatibility.",
  "genderIdentification": "How to differentiate males and females.",
  "sustainabilitySourcing": "Notes on captive breeding and ethical sourcing.",
  "careTemp": "22°C - 28°C",
  "carePh": "6.5 - 7.5",
  "careWaterHardness": "4 - 12 dGH",
  "careWaterCurrent": "Moderate",
  "careTankSetup": "Planted aquarium with gentle flow and hiding spots.",
  "careHidingSpots": "Driftwood, rock caves, and dense plants.",
  "faq": [
    { "q": "What should I feed this species?", "a": "High quality pellets, flakes, and live/frozen foods." },
    { "q": "Is this species community friendly?", "a": "Yes, it thrives in peaceful community tanks." },
    { "q": "What tank size is required?", "a": "Minimum 10-20 gallons recommended." },
    { "q": "How long do they live?", "a": "Typically 2 to 5 years with proper care." }
  ]
}
Do not include any markdown code blocks, HTML tags, or extra text. Just raw JSON.`;

      const interaction = await client.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });

      const raw = (interaction.output_text || '')
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      let allContent = {};
      try {
        allContent = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse all content JSON from Gemini:', raw);
      }

      return createSuccessResponse({ allContent });
    }

    // Default: Main description overview
    await connectDB();
    const preloaded = await FishDescription.findOne({ name: { $regex: new RegExp(`^${title}$`, 'i') } });
    if (preloaded && preloaded.description) {
      return createSuccessResponse({ description: preloaded.description });
    }

    const prompt = isAccessory
      ? `Write a premium, engaging product description for an aquarium accessory / equipment named "${title}".
Focus on functionality, performance, build quality, and ease of use for hobbyists.
Output only plain text. Do NOT use any HTML tags like <p>, <li>, or <strong>. Do NOT use markdown formatting.
Keep it concise but detailed (around 3 short paragraphs).`
      : `Write a premium, engaging product description for a ${category || 'product'} named "${title}". ${waterType ? `It is a ${waterType} species.` : ''}
Output only plain text. Do NOT use any HTML tags like <p>, <li>, or <strong>. Do NOT use markdown formatting.
Make it professional, emphasizing quality and care. Keep it concise but detailed (around 3-4 short paragraphs).`;

    const interaction = await client.interactions.create({
      model: "gemini-3.6-flash",
      input: prompt,
    });

    const generatedText = interaction.output_text || '';
    const cleanText = generatedText
      .replace(/^```html/i, '')
      .replace(/```$/i, '')
      .trim();

    return createSuccessResponse({ description: cleanText });
  } catch (error: any) {
    console.error('AI Generation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
