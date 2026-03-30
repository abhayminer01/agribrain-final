const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['disease', 'pest'], required: true },
    imageUrl: { type: String, required: true },
    result: {
        name: String,
        severity: String,
        suggestions: {
            chemical: [String],
            organic: [String]
        },
        warning: String,
        source: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Disease', diseaseSchema);
