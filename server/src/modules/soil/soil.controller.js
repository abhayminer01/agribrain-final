const Soil = require('./soil.model');
const aiService = require('../ai/ai.service');

const analyze = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Report file is required" });

        const aiResult = await aiService.processSoilReport(req.file.path);
        
        const reportUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        const record = await Soil.create({
            userId: req.session.userId,
            reportUrl,
            result: aiResult
        });

        res.status(200).json({ success: true, record });
    } catch (err) {
        console.error("Soil AI Error", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

const getHistory = async (req, res) => {
    try {
        const history = await Soil.find({ userId: req.session.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { analyze, getHistory };
