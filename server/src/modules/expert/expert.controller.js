const Query = require('./query.model');

const askQuery = async (req, res) => {
    try {
        const { title, description } = req.body;
        const newQuery = await Query.create({
            farmerId: req.session.userId,
            title, description
        });
        res.status(201).json({ success: true, query: newQuery });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const getAllQueries = async (req, res) => {
    try {
        const queries = await Query.find().populate('farmerId', 'email').sort({ createdAt: -1 });
        res.status(200).json({ success: true, queries });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

const respondToQuery = async (req, res) => {
    try {
        const { answer } = req.body;
        const queryId = req.params.id;
        
        const query = await Query.findById(queryId);
        if (!query) return res.status(404).json({ success: false, message: "Query not found" });

        query.responses.push({
            expertId: req.session.userId,
            answer
        });
        query.status = 'resolved';
        await query.save();

        res.status(200).json({ success: true, query });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { askQuery, getAllQueries, respondToQuery };
