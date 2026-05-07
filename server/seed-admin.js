require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/modules/auth/user.model');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ email: 'admin@agribrain' });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        
        const adminUser = new User({
            email: 'admin@agribrain',
            password: hashedPassword,
            role: 'Admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully: admin@agribrain / Admin@123');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
}

seedAdmin();
