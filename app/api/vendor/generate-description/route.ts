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
    if (!payload || (payload.role !== 'vendor' && payload.role !== 'admin')) return createErrorResponse('Forbidden', 403);

    const { title, category, waterType } = await request.json();

    if (!title) {
      return createErrorResponse('Product title is required', 400);
    }
    
    await connectDB();
    const preloaded = await FishDescription.findOne({ name: { $regex: new RegExp(`^${title}$`, 'i') } });
    if (preloaded && preloaded.description) {
      return createSuccessResponse({ description: preloaded.description });
    }

    const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LIYZ9ff4pf1yS5ZVy0rpD2ReikAiX-wtb96iBVyM0CAg';
    if (!apiKey) {
      return createErrorResponse('Gemini API key not configured', 500);
    }

    const prompt = `Write a premium, engaging product description for a ${category || 'product'} named "${title}". ${waterType ? `It is a ${waterType} species.` : ''}
    
Output only plain text. Do NOT use any HTML tags like <p>, <li>, or <strong>. Do NOT use markdown formatting.
Make it professional, emphasizing quality and care. 
Keep it concise but detailed (around 3-4 short paragraphs).`;

    const client = new GoogleGenAI({ apiKey });
    
    let generatedText = '';
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });
      generatedText = interaction.output_text || '';
    } catch (err: any) {
      console.error('Gemini API Error:', err.message || err);
      return createErrorResponse('Failed to generate description from AI', 500);
    }
    
    // Clean up markdown formatting if Gemini included it despite instructions
    const cleanHtml = generatedText.replace(/^```html/i, '').replace(/```$/i, '').trim();

    return createSuccessResponse({ description: cleanHtml });
  } catch (error: any) {
    console.error('AI Generation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
