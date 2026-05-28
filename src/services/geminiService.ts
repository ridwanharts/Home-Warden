import { GoogleGenAI, Type } from "@google/genai";
import { RepairDiagnosis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function diagnoseRepair(problem: string): Promise<RepairDiagnosis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Anda adalah "Mandor Rumah AI", asisten perbaikan rumah ahli dan praktis untuk bapak-bapak atau pemilik rumah di Indonesia.
Tujuan: Mendiagnosis masalah rumah dan memberikan panduan langkah-demi-langkah. Gunakan istilah yang akrab didengar bapak-bapak (seperti tang, obeng, semen, amplas, seal tape, dll).
Masalah: "${problem}"

Berikan respon dalam format JSON sesuai schema berikut:
{
  "problem": string (masalah yang diinput),
  "diagnosis": string (penjelasan teknis singkat),
  "shoppingList": string[] (daftar bahan yang perlu dibeli),
  "toolsNeeded": string[] (alat yang dibutuhkan),
  "steps": string[] (langkah perbaikan detail),
  "safetyWarning": string (peringatan keamanan jika ada, misal listrik tegangan tinggi)
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            shoppingList: { type: Type.ARRAY, items: { type: Type.STRING } },
            toolsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyWarning: { type: Type.STRING },
          },
          required: ["problem", "diagnosis", "shoppingList", "toolsNeeded", "steps"],
        },
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      id: "diag_" + Math.random().toString(36).substring(2, 11),
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Gemini Diagnosis Error:", error);
    throw new Error("Gagal mendiagnosis masalah. Periksa koneksi internet Anda.");
  }
}
