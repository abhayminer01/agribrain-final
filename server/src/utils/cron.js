const cron = require('node-cron');
const Field = require('../modules/farmer/field.model');
const Notification = require('../modules/farmer/notification.model');

// Run every day at 1:00 AM server time
cron.schedule('0 1 * * *', async () => {
    console.log("CRON: Scanning fields for upcoming fertilization & treatment stages...");
    try {
        const allFields = await Field.find();
        const now = new Date();
        now.setHours(0,0,0,0);

        for (const field of allFields) {

            // ─── 1. Fertilization Schedule (relative to plantingDate) ─────
            if (field.plantingDate && field.fertilizationSchedule) {
                for (let i = 0; i < field.fertilizationSchedule.length; i++) {
                    const stage = field.fertilizationSchedule[i];
                    if (stage.status !== 'pending') continue;

                    const targetDate = new Date(field.plantingDate);
                    targetDate.setDate(targetDate.getDate() + stage.dayOffset);
                    targetDate.setHours(0,0,0,0);

                    const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

                    if (diffDays === 2) {
                        await Notification.create({
                            userId:  field.userId,
                            fieldId: field._id,
                            title:   `Fertilizer Alert: ${field.name}`,
                            message: `The phase "${stage.stageName}" requires fertilization in 2 days. Set your Chemical or Organic preference now!`,
                            stageIndex: i
                        });
                        stage.status = 'notified';
                        await field.save();
                        console.log(`CRON: Fertilization notification → ${field.name}, stage ${i}`);
                    }
                }
            }

            // ─── 2. Treatment Courses (relative to diagnosedAt per diagnosis) ────
            if (field.diagnoses) {
                for (let d = 0; d < field.diagnoses.length; d++) {
                    const diag = field.diagnoses[d];
                    if (!diag.diagnosedAt || !diag.treatmentCourse) continue;

                    for (let s = 0; s < diag.treatmentCourse.length; s++) {
                        const step = diag.treatmentCourse[s];
                        if (step.status !== 'pending') continue;

                        const targetDate = new Date(diag.diagnosedAt);
                        targetDate.setDate(targetDate.getDate() + step.dayOffset);
                        targetDate.setHours(0,0,0,0);

                        const diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

                        if (diffDays === 2) {
                            const typeIcon = diag.type === 'pest' ? '🐛' : '🦠';
                            await Notification.create({
                                userId:  field.userId,
                                fieldId: field._id,
                                title:   `${typeIcon} Treatment Alert: ${diag.name} on ${field.name}`,
                                message: `"${step.stageName}" for ${diag.name} (${diag.type}) is due in 2 days. Select Organic or Chemical and prepare!`,
                                stageIndex: s
                            });
                            step.status = 'notified';
                            await field.save();
                            console.log(`CRON: Treatment notification → ${field.name}, diag ${d}, step ${s}`);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("CRON Engine Execution Error:", err);
    }
});
