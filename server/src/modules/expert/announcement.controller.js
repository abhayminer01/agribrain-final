const Announcement = require('./announcement.model');

const createAnnouncement = async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message required" });
        }

        const announcement = await Announcement.create({
            authorId: req.session.userId,
            title,
            message
        });

        res.status(201).json({ success: true, announcement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

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

module.exports = { createAnnouncement, getAnnouncements };
