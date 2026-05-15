exports.getAllRooms = (req, res) => {
    res.json({ message: "List of rooms endpoint" });
};

exports.getAvailableRooms = (req, res) => {
    res.json({ message: "Available rooms endpoint" });
};
