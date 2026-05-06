const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

if (!process.env.GEMINI_API_KEY) {
    console.error("⚠️ WARNING: GEMINI_API_KEY is not defined in your environment variables. The AI will fail to boot!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model cascade: try primary first, fall back on quota errors
const PRIMARY_MODEL   = 'gemini-2.5-flash';      // Current free-tier model
const FALLBACK_MODEL  = 'gemini-2.0-flash-lite';  // Fallback

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wraps any generateContent call with:
 *  1. Try PRIMARY_MODEL first
 *  2. On RESOURCE_EXHAUSTED, wait & retry once, then try FALLBACK_MODEL
 *  3. Log the FULL raw error for debugging
 */
const generateWithRetry = async (buildRequest, maxRetries = 2) => {
    const models = [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const model of models) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const request = buildRequest(model);
                console.log(`🤖 AI Request → model: ${model}, attempt: ${attempt + 1}`);
                const response = await ai.models.generateContent(request);
                console.log(`✅ AI Response received from [${model}]`);
                return response;
            } catch (err) {
                // LOG THE RAW ERROR so we can actually see what's happening
                console.error(`❌ AI ERROR [${model}] attempt ${attempt + 1}:`, err?.message || err);
                
                const msg = (err?.message || '') + (err?.errorDetails ? JSON.stringify(err.errorDetails) : '');
                const isRateLimit = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('Quota exceeded');

                if (!isRateLimit) {
                    // Not a quota issue — throw immediately (bad key, bad model, network, etc.)
                    throw err;
                }

                // Rate/quota limit — try waiting before next attempt
                const retryMatch = msg.match(/retry in ([\d.]+)s/i);
                const delaySecs = retryMatch ? parseFloat(retryMatch[1]) + 1 : (attempt + 1) * 5;

                if (attempt < maxRetries - 1) {
                    console.warn(`⏳ Waiting ${delaySecs.toFixed(0)}s before retry...`);
                    await sleep(delaySecs * 1000);
                } else {
                    console.warn(`⚠️ All retries exhausted for [${model}], trying next model...`);
                }
            }
        }
    }

    // All models and retries exhausted
    const quotaErr = new Error(
        'AI quota exceeded. The Gemini API free tier daily limit has been reached. Please try again tomorrow or upgrade your API plan.'
    );
    quotaErr.code = 'QUOTA_EXCEEDED';
    throw quotaErr;
};

const getFilePart = (filePath) => {
    const ext = filePath.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'pdf') mimeType = 'application/pdf';

    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        }
    };
};

const detectDisease = async (filePath) => {
    const prompt = `Analyze this crop image to detect diseases. Identify the disease and its severity.
    Then create a multi-step TREATMENT COURSE with timeline. Each step should have a dayOffset (days from diagnosis), a stageName, and BOTH organic and chemical treatment options.
    You MUST output ONLY valid JSON.
    Schema:
    {
      "type": "disease",
      "name": "Name of the disease",
      "severity": "Low | Medium | High",
      "treatmentCourse": [
        {
          "dayOffset": 0,
          "stageName": "Immediate Action",
          "options": {
            "chemical": ["Apply fungicide X"],
            "organic": ["Apply neem oil spray"]
          }
        },
        {
          "dayOffset": 7,
          "stageName": "Follow-up Treatment",
          "options": {
            "chemical": ["Re-apply fungicide X at half dose"],
            "organic": ["Apply Trichoderma bio-agent"]
          }
        }
      ]
    }`;

    try {
        const imagePart = getFilePart(filePath);
        const response = await generateWithRetry((model) => ({
            model,
            contents: [prompt, imagePart],
            config: { responseMimeType: "application/json" }
        }));
        return JSON.parse(response.text);
    } catch (err) {
        console.error("AI Disease Detection Error:", err.message);
        throw err;
    }
};

const detectPest = async (filePath) => {
    const prompt = `Analyze this crop image to detect pests. Identify the pest and its severity.
    Then create a multi-step TREATMENT COURSE with timeline. Each step should have a dayOffset (days from diagnosis), a stageName, and BOTH organic and chemical treatment options.
    You MUST output ONLY valid JSON.
    Schema:
    {
      "type": "pest",
      "name": "Name of the pest",
      "severity": "Low | Medium | High",
      "treatmentCourse": [
        {
          "dayOffset": 0,
          "stageName": "Immediate Action",
          "options": {
            "chemical": ["Apply pesticide X"],
            "organic": ["Release predatory insects"]
          }
        },
        {
          "dayOffset": 5,
          "stageName": "Monitoring & Re-application",
          "options": {
            "chemical": ["Spot-spray affected areas"],
            "organic": ["Apply neem oil at dawn"]
          }
        }
      ]
    }`;

    try {
        const imagePart = getFilePart(filePath);
        const response = await generateWithRetry((model) => ({
            model,
            contents: [prompt, imagePart],
            config: { responseMimeType: "application/json" }
        }));
        return JSON.parse(response.text);
    } catch (err) {
        console.error("AI Pest Detection Error:", err.message);
        throw err;
    }
};

const processSoilReport = async (filePath) => {
    const prompt = `Analyze this soil test report (image or PDF). Extract key metrics and suggest treatments. You MUST output ONLY valid JSON.
    Schema:
    {
      "type": "soil",
      "pH": "numeric value or string",
      "NPK": { "N": "value", "P": "value", "K": "value" },
      "suggestions": ["suggestion 1", "suggestion 2"]
    }`;

    try {
        const filePart = getFilePart(filePath);
        const response = await generateWithRetry((model) => ({
            model,
            contents: [prompt, filePart],
            config: { responseMimeType: "application/json" }
        }));
        return JSON.parse(response.text);
    } catch (err) {
        console.error("AI Soil Report Error:", err.message);
        throw err;
    }
};

const analyzeSoilForCrops = async (filePath) => {
    const prompt = `Analyze this soil test report. Extract pH and NPK parameters explicitly. 
    Based ENTIRELY on these metrics, suggest the top 3 most profitable and mathematically viable crops for this exact soil profile.
    You MUST output ONLY valid JSON.
    Schema:
    {
      "pH": "numeric value",
      "NPK": { "N": "value", "P": "value", "K": "value" },
      "suggestedCrops": ["Crop A", "Crop B", "Crop C"]
    }`;

    try {
        const filePart = getFilePart(filePath);
        const response = await generateWithRetry((model) => ({
            model,
            contents: [prompt, filePart],
            config: { responseMimeType: "application/json" }
        }));
        return JSON.parse(response.text);
    } catch (err) {
        console.error("AI Soil Analysis Error:", err.message);
        throw err;
    }
};

const calculateNutrientsAndYield = async (crop, soilData, sizeAcres) => {
    const prompt = `Given an agricultural field of ${sizeAcres} acres planting ${crop}, 
    and existing soil conditions of pH ${soilData?.pH || 'Unknown'}, Nitrogen: ${soilData?.NPK?.N || 'Unknown'}, Phosphorus: ${soilData?.NPK?.P || 'Unknown'}, Potassium: ${soilData?.NPK?.K || 'Unknown'}.
    
    Calculate the exact required fertilization schedule. Break this down into multiple timeline stages.
    For EACH stage, provide exactly what day it should occur relative to planting (dayOffset), a descriptive stageName, AND outline BOTH organic and chemical alternatives.
    Also, calculate the Predicted Harvest Time (daysToHarvest) and Estimated Yield Raw.
    You MUST output ONLY valid JSON.
    Schema:
    {
      "fertilizationSchedule": [
        {
          "dayOffset": 15,
          "stageName": "Early Vegetative Growth",
          "options": {
            "chemical": ["Apply X lbs of Urea", "Apply Y lbs of DAP"],
            "organic": ["Apply Neem Cake", "Apply Cow Dung Manure"]
          }
        }
      ],
      "daysToHarvest": 90,
      "estimatedYieldRaw": 15.5,
      "yieldUnit": "Tons or kg"
    }`;

    try {
        const response = await generateWithRetry((model) => ({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }));
        return JSON.parse(response.text);
    } catch (err) {
        console.error("AI Nutrients/Yield Error:", err.message);
        throw err;
    }
};

module.exports = {
    detectDisease,
    detectPest,
    processSoilReport,
    analyzeSoilForCrops,
    calculateNutrientsAndYield
};
