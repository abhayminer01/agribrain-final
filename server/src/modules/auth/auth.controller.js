const User = require("./user.model");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });
        
        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error Occured", err: err.message });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        // Set session
        req.session.userId = user._id;
        req.session.role = user.role || 'Farmer'; // Fallback if no role defined in older records

        res.status(200).json({ success: true, message: "Logged in successfully", user: { id: user._id, email: user.email, role: user.role || 'Farmer' } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error Occured", err: err.message });
    }
}

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Could not log out" });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, message: "Logged out successfully" });
    });
}

const checkSession = async (req, res) => {
    if(!req.session.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const user = await User.findById(req.session.userId).select("-password");
        if(!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", err: err.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    checkSession
}