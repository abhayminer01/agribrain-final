const Notification = require('./notification.model');

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.session.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, notifications });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ success: true });
    } catch(err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
module.exports = { getMyNotifications, markAsRead };
