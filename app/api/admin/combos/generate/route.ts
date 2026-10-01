import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/combos/generate
 * Body: { products: Array<{ title: string; category: string; waterType?: string }>, price?: number }
 * Returns: { name: string; description: string }
 * Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Only admins can use this endpoint', 403);
    }

    const { products, price } = await request.json();

    if (!Array.isArray(products) || products.length < 2) {
      return createErrorResponse('At least 2 products are required to generate combo details', 400);
    }

    const productList = products
      .map((p: { title: string; category?: string; waterType?: string }, i: number) =>
        `${i + 1}. ${p.title}${p.category ? ` (${p.category}${p.waterType ? ', ' + p.waterType : ''})` : ''}`
      )
      .join('\n');

    const priceHint = price ? ` The combo is priced at ₹${price}.` : '';

    const prompt = `You are a copywriter for NeoBlue, a premium live aquarium fish & aquatic plant e-commerce store in India.

A store admin has created a product bundle (combo) containing these items:
${productList}
${priceHint}

Generate a compelling combo name and a short marketing description for this bundle.

Rules:
- The name should be 3–7 words, catchy, and reflect the products inside. Examples: "Guppy Starter Colony", "Planted Nano Tank Bundle", "Predator Pack".
- The description should be 1–3 sentences, written for aquarium enthusiasts. Highlight what makes this combo great (value, compatibility, aesthetics, etc.). Do NOT mention prices.
- Respond with raw JSON only — no markdown, no backticks, no extra text:
{"name": "...", "description": "..."}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return createErrorResponse('AI service not configured', 500);

    const client = new GoogleGenAI({ apiKey });

    const interaction = await client.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
    });

    const raw = (interaction.output_text || '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: { name: string; description: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return createErrorResponse('AI returned an unexpected format. Please try again.', 500);
    }

    if (!parsed.name || !parsed.description) {
      return createErrorResponse('AI response was incomplete. Please try again.', 500);
    }

    return createSuccessResponse({ name: parsed.name.trim(), description: parsed.description.trim() });
  } catch (error: any) {
    console.error('Combo generate error:', error);
    return createErrorResponse(error.message || 'AI generation failed', 500);
  }
}
