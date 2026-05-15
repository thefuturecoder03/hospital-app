const calculatePriority = (patientData) => {
    let score = 0;
    const conditionScores = {
        'Infectious': 50,
        'Respiratory': 30,
        'Immuno-compromised': 40,
        'Standard': 0
    };
    score += (conditionScores[patientData.condition] || 0);
    if (patientData.age > 70) score += 10;
    if (patientData.isHighRisk) score += 15;
    return score;
};

module.exports = { calculatePriority };
