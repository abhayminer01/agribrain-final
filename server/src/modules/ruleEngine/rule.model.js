const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    ruleName: { type: String, required: true },
    conditionType: { type: String, enum: ['BANNED_CHEMICAL', 'CROP_SPECIFIC', 'SOIL_OVERRIDE'], required: true },
    targetValue: { type: String, required: true },
    overrideAction: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Rule = mongoose.model('Rule', ruleSchema);
module.exports = Rule;
