const mongoose = require('mongoose');
const Rule = require('./src/modules/ruleEngine/rule.model');
require('dotenv').config();

const bannedInIndia = ['Phorate', 'Monocrotophos', 'Phosphamidon', 'Endosulfan', 'Diazinon', 'Aldrin', 'DDT'];
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to DB");
    await Rule.deleteMany({});
    const rules = bannedInIndia.map(chem => ({
        ruleName: `Ban ${chem} in India`,
        conditionType: "BANNED_CHEMICAL",
        targetValue: chem,
        overrideAction: "Remove from suggestions"
    }));
    await Rule.insertMany(rules);
    console.log("Seeded Indian Banned Fertilizers Array!");
    process.exit(0);
  }).catch(err => {
      console.log(err);
      process.exit(1);
  });
