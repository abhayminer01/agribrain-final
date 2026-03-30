const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

if(!process.env.GEMINI_API_KEY) {
    console.error("⚠️ WARNING: GEMINI_API_KEY is not defined in your environment variables. The AI will fail to boot!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const prompt = `Analyze this crop image to detect diseases. You MUST output ONLY valid JSON.
    Schema:
    {
      "type": "disease",
      "name": "Name of the disease",
      "severity": "Low | Medium | High",
      "suggestions": {
        "chemical": ["suggested chemicals"],
        "organic": ["suggested organic treatments"]
      }
    }`;
    
    try {
        const imagePart = getFilePart(filePath);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, imagePart],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch(err) {
        console.error("AI Disease Detection Error:", err);
        throw new Error("Failed to process image with AI.");
    }
};

const detectPest = async (filePath) => {
    const prompt = `Analyze this crop image to detect pests. You MUST output ONLY valid JSON.
    Schema:
    {
      "type": "pest",
      "name": "Name of the pest",
      "severity": "Low | Medium | High",
      "suggestions": {
        "chemical": ["suggested chemicals"],
        "organic": ["suggested organic treatments"]
      }
    }`;
    
    try {
        const imagePart = getFilePart(filePath);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, imagePart],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch(err) {
        console.error("AI Pest Detection Error:", err);
        throw new Error("Failed to process image with AI.");
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, filePart],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch(err) {
        console.error("AI Soil Report Error:", err);
        throw new Error("Failed to process document with AI.");
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, filePart],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch(err) {
        throw new Error("Failed to analyze soil for crops.");
    }
}

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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch(err) {
        throw new Error("Failed to calculate nutrients and yield metrics.");
    }
}

module.exports = {
    detectDisease,
    detectPest,
    processSoilReport,
    analyzeSoilForCrops,
    calculateNutrientsAndYield
};
