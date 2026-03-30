const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    responses: [{
        expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        answer: { type: String },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Query', querySchema);
