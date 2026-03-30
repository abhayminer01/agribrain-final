const Field = require('./field.model');
const aiService = require('../ai/ai.service');
const ruleEngine = require('../ruleEngine/ruleEngine.service');

const analyzeSoilBeforeCreate = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Soil Report required" });
        
        const aiResult = await aiService.analyzeSoilForCrops(req.file.path);
        const reportUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        
        res.status(200).json({ 
            success: true, 
            analysis: aiResult, 
            tempReportUrl: reportUrl 
        });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const createField = async (req, res) => {
    try {
        const { name, size, selectedCrop, soilDataStr, soilTestReportUrl } = req.body;
        
        if (!req.session.userId) return res.status(401).json({ success: false, message: "Unauthorized." });
        if (!req.file) return res.status(400).json({ success: false, message: "Field Image is required" });
        if (!name || !size || !selectedCrop) return res.status(400).json({ success: false, message: "Missing required core details." });

        let soilData = {};
        if (soilDataStr) soilData = JSON.parse(soilDataStr);
        
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

        // RUN AI to calculate Nutrients & Yield limits synchronously
        const rawLifecycleData = await aiService.calculateNutrientsAndYield(selectedCrop, soilData, Number(size));
        
        // Pass to Rule Engine to strip out banned Indian chemicals
        const validationResult = await ruleEngine.validateAIResponse(rawLifecycleData);
        const lifecycleData = validationResult.finalRecommendation;

        const newField = await Field.create({
            userId: req.session.userId,
            name,
            size: Number(size),
            imageUrl,
            soilTestReportUrl,
            soilData,
            selectedCrop,
            fertilizationSchedule: lifecycleData.fertilizationSchedule,
            daysToHarvest: lifecycleData.daysToHarvest,
            estimatedYieldRaw: lifecycleData.estimatedYieldRaw,
            yieldUnit: lifecycleData.yieldUnit
        });

        res.status(201).json({ success: true, field: newField });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", err: err.message });
    }
};

const getFields = async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ success: false, message: "Unauthorized." });
        const fields = await Field.find({ userId: req.session.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, fields });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", err: err.message });
    }
};

const markPlanted = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if(!field) return res.status(404).json({ success:false, message: "Field not found" });
        if(field.userId.toString() !== req.session.userId) return res.status(403).json({ success:false, message: "Forbidden" });
        
        field.plantingDate = new Date(); // Marks planting as TODAY
        
        if (field.daysToHarvest) {
            const harvestDate = new Date();
            harvestDate.setDate(harvestDate.getDate() + field.daysToHarvest);
            field.estimatedHarvestDate = harvestDate;
        }

        await field.save();
        res.status(200).json({ success: true, field });
    } catch(err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
}

const updateSchedulePreference = async (req, res) => {
    try {
        const { id, stageIndex } = req.params;
        const { selectedType } = req.body; // 'organic', 'chemical', or null

        const field = await Field.findById(id);
        if(!field) return res.status(404).json({ success:false, message: "Field not found" });
        if(field.userId.toString() !== req.session.userId) return res.status(403).json({ success:false, message: "Forbidden" });

        if (!field.fertilizationSchedule[stageIndex]) return res.status(400).json({ success:false, message: "Invalid Stage Index" });

        field.fertilizationSchedule[stageIndex].selectedType = selectedType;
        
        // Let's autosave status to 'applied' if not already when a user toggles it if they already planted? Actually they need an 'apply' button.
        await field.save();
        
        res.status(200).json({ success: true, field });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message }); 
    }
}

const applySchedulePhase = async (req, res) => {
    try {
        const { id, stageIndex } = req.params;

        const field = await Field.findById(id);
        if(!field) return res.status(404).json({ success:false, message: "Field not found" });
        if(field.userId.toString() !== req.session.userId) return res.status(403).json({ success:false, message: "Forbidden" });

        if (!field.fertilizationSchedule[stageIndex]) return res.status(400).json({ success:false, message: "Invalid Stage Index" });

        field.fertilizationSchedule[stageIndex].status = 'applied';
        await field.save();
        
        res.status(200).json({ success: true, field });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message }); 
    }
}

module.exports = {
    analyzeSoilBeforeCreate,
    createField,
    getFields,
    markPlanted,
    updateSchedulePreference,
    applySchedulePhase
};
