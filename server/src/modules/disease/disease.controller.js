const Disease = require('./disease.model');
const aiService = require('../ai/ai.service');
const ruleEngine = require('../ruleEngine/ruleEngine.service');

const detect = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Image is required" });
        const type = req.body.type === 'pest' ? 'pest' : 'disease';

        // 1. Call AI Service
        let aiResult;
        if (type === 'pest') {
            aiResult = await aiService.detectPest(req.file.path);
        } else {
            aiResult = await aiService.detectDisease(req.file.path);
        }

        // 2. Pass to Rule Engine for Validation
        const validatedResponse = await ruleEngine.validateAIResponse(aiResult);

        // 3. Save to DB
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        const record = await Disease.create({
            userId: req.session.userId,
            type,
            imageUrl,
            result: {
                name: validatedResponse.finalRecommendation.name,
                severity: validatedResponse.finalRecommendation.severity,
                suggestions: validatedResponse.finalRecommendation.suggestions,
                warning: validatedResponse.warning,
                source: validatedResponse.source
            }
        });

        res.status(200).json({ success: true, record });
    } catch (err) {
        console.error("Detect AI Error", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

const getHistory = async (req, res) => {
    try {
        const history = await Disease.find({ userId: req.session.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { detect, getHistory };
