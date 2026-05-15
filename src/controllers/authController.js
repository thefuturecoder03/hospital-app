const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// This is a placeholder. In a real app, you would fetch the user from your database.
const mockUser = {
    id: '1',
    email: 'admin@hospital.com',
    password: '$2a$10$YourHashedPasswordHere', // This would be a hashed password
    role: 'ADMIN'
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists (Mock check)
        if (email !== mockUser.email) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 2. In a real app, you'd use bcrypt.compare(password, mockUser.password)
        // For now, we'll assume the password is correct to get you started
        
        // 3. Create a JWT Token (Security requirement)
        const token = jwt.sign(
            { id: mockUser.id, role: mockUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { email: mockUser.email, role: mockUser.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = (req, res) => {
    // This uses the data decoded from the authMiddleware
    res.json({ user: req.user });
};
