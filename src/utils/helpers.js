const formatRoomLabel = (roomNumber) => `Room-${roomNumber.toUpperCase()}`;

const isIsolationRequired = (priorityScore) => priorityScore >= 40;

module.exports = { formatRoomLabel, isIsolationRequired };
