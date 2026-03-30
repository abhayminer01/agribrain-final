const User = require('../auth/user.model');
const Disease = require('../disease/disease.model');
const Soil = require('../soil/soil.model');

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const verifyExpert = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.role = 'Expert';
        await user.save();
        res.status(200).json({ success: true, message: "User verified as Expert", user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const diseaseCount = await Disease.countDocuments();
        const soilCount = await Soil.countDocuments();

        res.status(200).json({ success: true, stats: { users: userCount, diseaseScans: diseaseCount, soilTests: soilCount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getUsers, verifyExpert, getStats };
