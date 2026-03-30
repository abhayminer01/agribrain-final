const mongoose = require('mongoose');
const Rule = require('./src/modules/ruleEngine/rule.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to DB");
    await Rule.deleteMany({});
    await Rule.create({
        ruleName: "Ban Endosulfan",
        conditionType: "BANNED_CHEMICAL",
        targetValue: "Endosulfan",
        overrideAction: "Remove from suggestions"
    });
    console.log("Seeded Rule Engine!");
    process.exit(0);
  }).catch(err => {
      console.log(err);
      process.exit(1);
  });
