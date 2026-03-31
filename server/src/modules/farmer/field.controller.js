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

const getFieldById = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
        if (field.userId.toString() !== req.session.userId) return res.status(403).json({ success: false, message: 'Forbidden' });
        res.status(200).json({ success: true, field });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateField = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
        if (field.userId.toString() !== req.session.userId) return res.status(403).json({ success: false, message: 'Forbidden' });

        const { name, plantingDate } = req.body;
        if (name) field.name = name.trim();
        if (plantingDate) {
            field.plantingDate = new Date(plantingDate);
            // Recalculate harvest date if daysToHarvest exists
            if (field.daysToHarvest) {
                const harvestDate = new Date(plantingDate);
                harvestDate.setDate(harvestDate.getDate() + field.daysToHarvest);
                field.estimatedHarvestDate = harvestDate;
            }
        }
        await field.save();
        res.status(200).json({ success: true, field });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteField = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
        if (field.userId.toString() !== req.session.userId) return res.status(403).json({ success: false, message: 'Forbidden' });
        await Field.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Field deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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

const markHarvested = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if(!field) return res.status(404).json({ success:false, message: "Field not found" });
        if(field.userId.toString() !== req.session.userId) return res.status(403).json({ success:false, message: "Forbidden" });

        const { actualYield } = req.body;
        field.status = 'harvested';
        if (actualYield !== undefined) field.actualYield = Number(actualYield);

        await field.save();
        res.status(200).json({ success: true, field });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const markFailure = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if(!field) return res.status(404).json({ success:false, message: "Field not found" });
        if(field.userId.toString() !== req.session.userId) return res.status(403).json({ success:false, message: "Forbidden" });

        const { failureReason } = req.body;
        field.status = 'failure';
        if (failureReason) field.failureReason = failureReason.trim();

        await field.save();
        res.status(200).json({ success: true, field });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

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

// POST /api/fields/:id/diagnose — image upload -> AI -> rule engine -> saved to field
const diagnoseField = async (req, res) => {
    try {
        const field = await Field.findById(req.params.id);
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
        if (field.userId.toString() !== req.session.userId) return res.status(403).json({ success: false, message: 'Forbidden' });
        if (!req.file) return res.status(400).json({ success: false, message: 'Image required.' });

        const { scanType } = req.body; // 'disease' | 'pest'
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

        let rawResult;
        if (scanType === 'pest') {
            rawResult = await aiService.detectPest(req.file.path);
        } else {
            rawResult = await aiService.detectDisease(req.file.path);
        }

        // Pass through rule engine to strip banned chemicals
        const { finalRecommendation } = await ruleEngine.validateAIResponse(rawResult);

        const diagEntry = {
            type:            finalRecommendation.type || scanType,
            name:            finalRecommendation.name,
            severity:        finalRecommendation.severity,
            imageUrl,
            treatmentCourse: finalRecommendation.treatmentCourse || []
        };

        field.diagnoses.push(diagEntry);
        await field.save();

        res.status(201).json({ success: true, field });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/fields/:id/diagnose/:diagIndex/step/:stepIndex/select
const updateTreatmentStepPreference = async (req, res) => {
    try {
        const { id, diagIndex, stepIndex } = req.params;
        const { selectedType } = req.body;

        const field = await Field.findById(id);
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
        if (field.userId.toString() !== req.session.userId) return res.status(403).json({ success: false, message: 'Forbidden' });
        if (!field.diagnoses[diagIndex]?.treatmentCourse[stepIndex]) return res.status(400).json({ success: false, message: 'Invalid index' });

        field.diagnoses[diagIndex].treatmentCourse[stepIndex].selectedType = selectedType;
        await field.save();
        res.status(200).json({ success: true, field });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/fields/:id/diagnose/:diagIndex/step/:stepIndex/apply
const applyTreatmentStep = async (req, res) => {
    try {
        const { id, diagIndex, stepIndex } = req.params;

        const field = await Field.findById(id);
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
        if (field.userId.toString() !== req.session.userId) return res.status(403).json({ success: false, message: 'Forbidden' });
        if (!field.diagnoses[diagIndex]?.treatmentCourse[stepIndex]) return res.status(400).json({ success: false, message: 'Invalid index' });

        field.diagnoses[diagIndex].treatmentCourse[stepIndex].status = 'applied';
        await field.save();
        res.status(200).json({ success: true, field });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    analyzeSoilBeforeCreate,
    createField,
    getFields,
    getFieldById,
    updateField,
    deleteField,
    markPlanted,
    updateSchedulePreference,
    applySchedulePhase,
    diagnoseField,
    updateTreatmentStepPreference,
    applyTreatmentStep,
    markHarvested,
    markFailure
};
