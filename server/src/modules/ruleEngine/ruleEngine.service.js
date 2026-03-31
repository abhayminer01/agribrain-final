const Rule = require('./rule.model');

const validateAIResponse = async (aiResult) => {
    let finalRecommendation = JSON.parse(JSON.stringify(aiResult)); // deep clone
    let warning = null;
    let source = "ai";

    try {
        const activeRules = await Rule.find({ isActive: true });

        // Iterate through rules to assert overrides
        activeRules.forEach(rule => {
            if (rule.conditionType === 'BANNED_CHEMICAL') {
                
                // 1. Filter flat Disease results
                if (finalRecommendation.suggestions && finalRecommendation.suggestions.chemical) {
                    const originalLength = finalRecommendation.suggestions.chemical.length;
                    
                    finalRecommendation.suggestions.chemical = finalRecommendation.suggestions.chemical.filter(
                        chem => !chem.toLowerCase().includes(rule.targetValue.toLowerCase())
                    );
                    
                    if (finalRecommendation.suggestions.chemical.length < originalLength) {
                        warning = `Some AI suggestions were suppressed by the Rule Engine (${rule.targetValue} is flagged).`;
                        source = "rule";
                    }
                }

                // 2. Filter nested fertilization schedules
                if (finalRecommendation.fertilizationSchedule) {
                    finalRecommendation.fertilizationSchedule.forEach(stage => {
                        if (stage.options && stage.options.chemical) {
                            const originalLength = stage.options.chemical.length;
                            stage.options.chemical = stage.options.chemical.filter(
                                chem => !chem.toLowerCase().includes(rule.targetValue.toLowerCase())
                            );
                            if (stage.options.chemical.length < originalLength) {
                                warning = `Regulatory compliance applied: Removed ${rule.targetValue} from fertilization schedule.`;
                                source = "rule";
                            }
                        }
                    });
                }

                // 3. Filter nested treatment courses (disease/pest remedies)
                if (finalRecommendation.treatmentCourse) {
                    finalRecommendation.treatmentCourse.forEach(stage => {
                        if (stage.options && stage.options.chemical) {
                            const originalLength = stage.options.chemical.length;
                            stage.options.chemical = stage.options.chemical.filter(
                                chem => !chem.toLowerCase().includes(rule.targetValue.toLowerCase())
                            );
                            if (stage.options.chemical.length < originalLength) {
                                warning = `Regulatory compliance applied: Removed ${rule.targetValue} from treatment course.`;
                                source = "rule";
                            }
                        }
                    });
                }
            }
        });

    } catch (err) {
        console.error("Rule Engine Error:", err);
        // Fallback to pure AI result if rule engine fails to avoid blocking the user
    }

    return {
        finalRecommendation,
        source,
        warning
    };
};

module.exports = {
    validateAIResponse
};
