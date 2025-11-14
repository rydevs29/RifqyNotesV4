// File: api/summarize.js

import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi Gemini API dengan API Key dari environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    // Hanya izinkan request POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // API Key disimpan dengan aman di Environment Variables Vercel
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    try {
        // Pilih model Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Jadilah asisten yang merangkum. Buat ringkasan singkat dan jelas dari teks berikut ini dalam bahasa Indonesia. Teks: "${text}"`;

        // Panggil API untuk generate konten
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        res.status(200).json({ summary });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Failed to summarize text using Gemini AI.' });
    }
}
