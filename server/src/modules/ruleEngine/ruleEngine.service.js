const Rule = require('./rule.model');

const validateAIResponse = async (aiResult) => {
    let finalRecommendation = { ...aiResult };
    let warning = null;
    let source = "ai";

    try {
        const activeRules = await Rule.find({ isActive: true });

        // Iterate through rules to assert overrides
        activeRules.forEach(rule => {
            if (rule.conditionType === 'BANNED_CHEMICAL' && finalRecommendation.suggestions?.chemical) {
                const originalLength = finalRecommendation.suggestions.chemical.length;
                
                finalRecommendation.suggestions.chemical = finalRecommendation.suggestions.chemical.filter(
                    chem => !chem.toLowerCase().includes(rule.targetValue.toLowerCase())
                );
                
                if (finalRecommendation.suggestions.chemical.length < originalLength) {
                    warning = `Some AI suggestions were suppressed by the Rule Engine (${rule.targetValue} is flagged).`;
                    source = "rule";
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
