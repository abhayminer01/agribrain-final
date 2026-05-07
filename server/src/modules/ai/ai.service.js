const { default: ollama } = require('ollama');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const MODEL = 'aleSuglia/qwen2-vl-2b-instruct-q4_k_m:latest';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to extract text from PDF or get base64 for images
const processFile = async (filePath) => {
    const ext = filePath.split('.').pop().toLowerCase();
    
    if (ext === 'pdf') {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return { type: 'text', content: data.text };
        } catch (err) {
            console.error("PDF Parsing Error:", err);
            throw new Error("Failed to parse PDF file. Ensure it contains extractable text.");
        }
    } else {
        // Image handling for Ollama (requires raw base64 without data URI scheme)
        const base64Image = fs.readFileSync(filePath).toString("base64");
        return { type: 'image', content: base64Image };
    }
};

const generateWithRetry = async (prompt, filePath = null, maxRetries = 2) => {
    let finalPrompt = prompt;
    let images = [];

    if (filePath) {
        const fileData = await processFile(filePath);
        if (fileData.type === 'text') {
            finalPrompt += `\n\n--- DOCUMENT TEXT ---\n${fileData.content}`;
        } else if (fileData.type === 'image') {
            images.push(fileData.content);
        }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`🤖 AI Request → model: ${MODEL}, attempt: ${attempt + 1}`);
            
            const response = await ollama.chat({
                model: MODEL,
                messages: [{
                    role: 'user',
                    content: finalPrompt + '\n\nIMPORTANT: Return ONLY the raw, valid JSON object. No markdown tags, no conversational text, no explanations.',
                    images: images.length > 0 ? images : undefined
                }],
                format: 'json',
                options: {
                    temperature: 0.0,
                    num_predict: 1024
                }
            });

            console.log(`✅ AI Response received from [${MODEL}]`);
            let content = response.message.content.trim();
            
            // Clean up markdown code blocks if the model still outputs them
            if (content.startsWith('```')) {
                content = content.replace(/^```(json)?\n/, '');
                content = content.replace(/\n```$/, '');
            }
            
            return JSON.parse(content);
        } catch (err) {
            console.error(`❌ AI ERROR [${MODEL}] attempt ${attempt + 1}:`, err?.message || err);
            
            if (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')) {
                throw new Error('Could not connect to Ollama. Please ensure Ollama is running locally.');
            }

            if (attempt < maxRetries - 1) {
                console.warn(`⏳ Waiting 5s before retry...`);
                await sleep(5000);
            } else {
                throw new Error('AI generation failed after multiple attempts.');
            }
        }
    }
};

const detectDisease = async (filePath) => {
    const prompt = `Analyze this crop image to detect diseases. Identify the disease and its severity.
    Then create a multi-step TREATMENT COURSE with timeline. You MUST generate AT LEAST 5 distinct chronological steps (e.g., immediate action, day 3, day 7, day 14, day 21). Each step should have a dayOffset (days from diagnosis), a stageName, and BOTH organic and chemical treatment options.
    IMPORTANT: Provide EXACT, specific names and precise dosages for all organic and chemical treatments (e.g., 'Apply 2ml of Hexaconazole per liter of water', 'Spray 5% Neem oil extract'). Do NOT use generic placeholders like 'fungicide X' or 'treatment Y'.
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
            "chemical": ["Apply 2g of Mancozeb per liter of water"],
            "organic": ["Spray 5% Neem seed kernel extract"]
          }
        },
        {
          "dayOffset": 7,
          "stageName": "Follow-up Assessment",
          "options": {
            "chemical": ["Apply 1ml of Propiconazole per liter"],
            "organic": ["Apply Trichoderma harzianum at 5g per liter"]
          }
        }
      ]
    }`;

    try {
        return await generateWithRetry(prompt, filePath);
    } catch (err) {
        console.error("AI Disease Detection Error:", err.message);
        throw err;
    }
};

const detectPest = async (filePath) => {
    const prompt = `Analyze this crop image to detect pests. Identify the pest and its severity.
    Then create a multi-step TREATMENT COURSE with timeline. You MUST generate AT LEAST 5 distinct chronological steps (e.g., immediate action, day 3, day 7, day 14, day 21). Each step should have a dayOffset (days from diagnosis), a stageName, and BOTH organic and chemical treatment options.
    IMPORTANT: Provide EXACT, specific names and precise dosages for all organic and chemical treatments (e.g., 'Apply 1.5ml of Imidacloprid per liter of water', 'Release 50 Ladybird beetles per acre'). Do NOT use generic placeholders like 'pesticide X' or 'treatment Y'.
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
            "chemical": ["Apply 2ml of Chlorpyrifos per liter of water"],
            "organic": ["Spray 5% Neem oil solution"]
          }
        },
        {
          "dayOffset": 5,
          "stageName": "Monitoring and Second Dose",
          "options": {
            "chemical": ["Apply 1g of Thiamethoxam per liter"],
            "organic": ["Deploy pheromone traps and sticky cards"]
          }
        }
      ]
    }`;

    try {
        return await generateWithRetry(prompt, filePath);
    } catch (err) {
        console.error("AI Pest Detection Error:", err.message);
        throw err;
    }
};

const processSoilReport = async (filePath) => {
    const prompt = `CRITICAL OCR TASK: Analyze this soil test report. You MUST extract the EXACT numbers visible on the report for pH and NPK. DO NOT guess, DO NOT calculate averages, and DO NOT make up values. If a value is missing or illegible, return "Unknown". Your extraction must be 100% accurate and deterministic. Suggest treatments based on the extracted values. You MUST output ONLY valid JSON.
    Schema:
    {
      "type": "soil",
      "pH": "numeric value or string",
      "NPK": { "N": "value", "P": "value", "K": "value" },
      "suggestions": ["suggestion 1", "suggestion 2"]
    }`;

    try {
        return await generateWithRetry(prompt, filePath);
    } catch (err) {
        console.error("AI Soil Report Error:", err.message);
        throw err;
    }
};

const analyzeSoilForCrops = async (filePath) => {
    const prompt = `CRITICAL OCR TASK: Analyze this soil test report. You MUST extract the EXACT numbers visible on the report for pH and NPK. DO NOT guess, DO NOT calculate averages, and DO NOT make up values. If a value is missing or illegible, return "Unknown". Your extraction must be 100% accurate and deterministic.
    Based ENTIRELY on these metrics, suggest the top 3 most profitable and mathematically viable crops for this exact soil profile.
    IMPORTANT: Provide EXACT real-world crop names (e.g., "Wheat", "Tomatoes", "Soybeans"). DO NOT use generic placeholders like "Crop A" or "Crop B".
    You MUST output ONLY valid JSON.
    Schema:
    {
      "pH": "numeric value",
      "NPK": { "N": "value", "P": "value", "K": "value" },
      "suggestedCrops": ["Wheat", "Corn", "Tomatoes"]
    }`;

    try {
        return await generateWithRetry(prompt, filePath);
    } catch (err) {
        console.error("AI Soil Analysis Error:", err.message);
        throw err;
    }
};

const calculateNutrientsAndYield = async (crop, soilData, sizeAcres) => {
    const prompt = `Given an agricultural field of ${sizeAcres} acres planting ${crop}, 
    and existing soil conditions of pH ${soilData?.pH || 'Unknown'}, Nitrogen: ${soilData?.NPK?.N || 'Unknown'}, Phosphorus: ${soilData?.NPK?.P || 'Unknown'}, Potassium: ${soilData?.NPK?.K || 'Unknown'}.
    
    Calculate the exact required fertilization schedule. You MUST generate AT LEAST 3 to 5 distinct chronological timeline stages covering the entire crop lifecycle (e.g., Pre-planting, Early Vegetative Growth, Flowering, Fruiting).
    For EACH stage, provide exactly what day it should occur relative to planting (dayOffset), a descriptive stageName, AND outline BOTH organic and chemical alternatives.
    IMPORTANT: Provide EXACT, specific names and precise quantities for organic and chemical fertilizers (e.g., 'Apply 50 kg of Urea per acre', 'Apply 200 kg of Vermicompost'). Do NOT use generic placeholders like 'X amount of' or 'Y lbs'. Provide the total recommended amount calculated for the given acreage of ${sizeAcres} acres.
    Also, calculate the Predicted Harvest Time (daysToHarvest) and Estimated Yield Raw.
    You MUST output ONLY valid JSON.
    Schema:
    {
      "fertilizationSchedule": [
        {
          "dayOffset": 0,
          "stageName": "Pre-Planting Base Dose",
          "options": {
            "chemical": ["Apply 50 kg of DAP", "Apply 25 kg of MOP"],
            "organic": ["Apply 5 tons of Farm Yard Manure"]
          }
        },
        {
          "dayOffset": 30,
          "stageName": "Active Vegetative Growth",
          "options": {
            "chemical": ["Apply 25 kg of Urea as top dressing"],
            "organic": ["Apply 50 liters of Jeevamrutha"]
          }
        }
      ],
      "daysToHarvest": 90,
      "estimatedYieldRaw": 15.5,
      "yieldUnit": "Tons"
    }`;

    try {
        return await generateWithRetry(prompt);
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
