const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true }, // in Acres
    imageUrl: { type: String, required: true },
    soilTestReportUrl: { type: String },
    
    // AI Lifecycle Properties
    soilData: {
        pH: String,
        NPK: { N: String, P: String, K: String }
    },
    suggestedCrops: [String],
    selectedCrop: { type: String, required: true },
    
    // Growth & Financial
    plantingDate: { type: Date },
    daysToHarvest: { type: Number },
    estimatedHarvestDate: { type: Date },
    estimatedYieldRaw: { type: Number },
    yieldUnit: { type: String },
    
    // Nutrient Action Plan from AI
    requiredNutrients: [String]
    
}, { timestamps: true });

const Field = mongoose.model('Field', fieldSchema);
module.exports = Field;
