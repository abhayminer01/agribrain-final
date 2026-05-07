const User = require('../auth/user.model');
const Disease = require('../disease/disease.model');
const Soil = require('../soil/soil.model');
const Field = require('../farmer/field.model');
const Query = require('../expert/query.model');
const Announcement = require('../expert/announcement.model');

// ================= USER MANAGEMENT =================

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role, status } = req.body;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (email) user.email = email;
        if (role) user.role = role;
        if (status) user.status = status;
        
        await user.save();
        res.status(200).json({ success: true, message: "User updated successfully", user: { _id: user._id, email: user.email, role: user.role, status: user.status, description: user.description, createdAt: user.createdAt } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.session.userId.toString()) {
            return res.status(400).json({ success: false, message: "Cannot delete yourself" });
        }
        
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Cascade delete fields owned by user
        await Field.deleteMany({ userId: id });

        res.status(200).json({ success: true, message: "User and associated fields deleted successfully" });
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

// ================= FIELD MANAGEMENT =================

const getFields = async (req, res) => {
    try {
        const fields = await Field.find().populate('userId', 'email role').sort({ createdAt: -1 });
        res.status(200).json({ success: true, fields });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, size, selectedCrop, status } = req.body;
        
        const field = await Field.findById(id);
        if (!field) return res.status(404).json({ success: false, message: "Field not found" });

        if (name) field.name = name;
        if (size) field.size = size;
        if (selectedCrop) field.selectedCrop = selectedCrop;
        if (status) field.status = status;

        await field.save();
        
        const updatedField = await Field.findById(id).populate('userId', 'email role');
        res.status(200).json({ success: true, message: "Field updated successfully", field: updatedField });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const deleteField = async (req, res) => {
    try {
        const { id } = req.params;
        const field = await Field.findByIdAndDelete(id);
        if (!field) return res.status(404).json({ success: false, message: "Field not found" });

        res.status(200).json({ success: true, message: "Field deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ================= QUERY MANAGEMENT =================

const getQueries = async (req, res) => {
    try {
        const queries = await Query.find()
            .populate('farmerId', 'email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, queries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const updateQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const query = await Query.findById(id);
        if (!query) return res.status(404).json({ success: false, message: "Query not found" });

        if (status) query.status = status;
        await query.save();

        const updatedQuery = await Query.findById(id).populate('farmerId', 'email');
        res.status(200).json({ success: true, message: "Query status updated", query: updatedQuery });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const deleteQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const query = await Query.findByIdAndDelete(id);
        if (!query) return res.status(404).json({ success: false, message: "Query not found" });
        res.status(200).json({ success: true, message: "Query deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ================= ANNOUNCEMENT MANAGEMENT =================

const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('authorId', 'email role fullName')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, announcements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message } = req.body;
        const announcement = await Announcement.findById(id);
        if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found" });

        if (title) announcement.title = title;
        if (message) announcement.message = message;
        await announcement.save();

        const updatedAnn = await Announcement.findById(id).populate('authorId', 'email role fullName');
        res.status(200).json({ success: true, message: "Announcement updated", announcement: updatedAnn });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const ann = await Announcement.findByIdAndDelete(id);
        if (!ann) return res.status(404).json({ success: false, message: "Announcement not found" });
        res.status(200).json({ success: true, message: "Announcement deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ================= STATS =================

const getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const diseaseCount = await Disease.countDocuments();
        const soilCount = await Soil.countDocuments();
        const fieldCount = await Field.countDocuments();

        res.status(200).json({ success: true, stats: { users: userCount, diseaseScans: diseaseCount, soilTests: soilCount, fields: fieldCount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { 
    getUsers, updateUser, deleteUser, verifyExpert, 
    getFields, updateField, deleteField,
    getQueries, updateQuery, deleteQuery,
    getAnnouncements, updateAnnouncement, deleteAnnouncement,
    getStats 
};
