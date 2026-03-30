const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    role: {
        type: String,
        enum: ['Farmer', 'Expert', 'Admin'],
        default: 'Farmer'
    }
}, { timestamps : true });

const User = mongoose.model('User', userSchema);
module.exports = User;