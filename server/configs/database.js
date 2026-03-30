const mongoose = require('mongoose');

const connectDatabase = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URI).then(() => {
        console.log('MongoDB Connection Established !');
    }).catch((err) => {
        console.log('Error Occured while connecting to database', err);
    })
}

module.exports = connectDatabase;