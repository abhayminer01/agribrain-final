require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

console.log('🔑 Using API Key:', process.env.GEMINI_API_KEY?.slice(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
    try {
        console.log('📡 Testing simple text prompt with gemini-2.5-flash...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say hello in one word.'
        });
        console.log('✅ SUCCESS! Response:', response.text);
    } catch (err) {
        console.error('❌ FAILED:', err.message?.slice(0, 300));
        console.log('\n💡 FIX: Go to https://aistudio.google.com/apikey');
        console.log('   Create a NEW key from there (not Google Cloud Console)');
        console.log('   AI Studio keys auto-enable the Generative Language API with proper quotas.');
    }
})();
