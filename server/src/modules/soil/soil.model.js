const mongoose = require('mongoose');

const soilSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportUrl: { type: String, required: true },
    result: {
        pH: String,
        NPK: { N: String, P: String, K: String },
        suggestions: [String]
    }
}, { timestamps: true });

module.exports = mongoose.model('Soil', soilSchema);
