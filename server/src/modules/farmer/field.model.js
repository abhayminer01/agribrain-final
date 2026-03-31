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
    
    // Outcome tracking
    status: { type: String, enum: ['active', 'harvested', 'failure'], default: 'active' },
    actualYield: { type: Number },
    failureReason: { type: String },
    
    // NEW: Timed Schedule mapped organically and chemically
    fertilizationSchedule: [{
        dayOffset: { type: Number, required: true },
        stageName: { type: String, required: true },
        options: {
            chemical: [String],
            organic: [String]
        },
        selectedType: { type: String, enum: ['chemical', 'organic', null], default: null },
        status: { type: String, enum: ['pending', 'notified', 'applied'], default: 'pending' }
    }],

    // AI Pest & Disease Diagnoses History
    diagnoses: [{
        type:     { type: String, enum: ['disease', 'pest'] },
        name:     { type: String },
        severity: { type: String },
        imageUrl: { type: String },
        diagnosedAt: { type: Date, default: Date.now },
        // Time-based treatment course (mirrors fertilizationSchedule)
        treatmentCourse: [{
            dayOffset:    { type: Number, required: true },
            stageName:    { type: String, required: true },
            options: {
                chemical: [String],
                organic:  [String]
            },
            selectedType: { type: String, enum: ['chemical', 'organic', null], default: null },
            status:       { type: String, enum: ['pending', 'notified', 'applied'], default: 'pending' }
        }]
    }]
    
}, { timestamps: true });

const Field = mongoose.model('Field', fieldSchema);
module.exports = Field;
