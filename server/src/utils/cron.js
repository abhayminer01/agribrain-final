const cron = require('node-cron');
const Field = require('../modules/farmer/field.model');
const Notification = require('../modules/farmer/notification.model');

// Run every day at 1:00 AM server time
cron.schedule('0 1 * * *', async () => {
    console.log("CRON: Scanning fields for upcoming fertilization stages...");
    try {
        const activeFields = await Field.find({ plantingDate: { $exists: true } });
        const now = new Date();
        now.setHours(0,0,0,0);

        for (const field of activeFields) {
            for (let i = 0; i < field.fertilizationSchedule.length; i++) {
                const stage = field.fertilizationSchedule[i];
                if (stage.status !== 'pending') continue;

                const targetDate = new Date(field.plantingDate);
                targetDate.setDate(targetDate.getDate() + stage.dayOffset);
                targetDate.setHours(0,0,0,0);

                const diffTime = targetDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Exact 2 day warning threshold hit
                if (diffDays === 2) {
                    await Notification.create({
                        userId: field.userId,
                        fieldId: field._id,
                        title: `Upcoming Fertilizer Alert: ${field.name}`,
                        message: `The Phase "${stage.stageName}" requires fertilization in exactly 2 days. Open your dashboard to set your Chemical or Organic preference!`,
                        stageIndex: i
                    });

                    stage.status = 'notified';
                    await field.save();
                    console.log(`CRON: Generated Notification for User ${field.userId} -> Field ${field.name}`);
                }
            }
        }
    } catch (err) {
        console.error("CRON Engine Execution Error:", err);
    }
});
