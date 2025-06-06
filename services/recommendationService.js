const User = require('../models/User');

const getRecommendations = async (userId) => {
    // Placeholder for recommendation logic
    const recommendations = await User.find({ _id: { $ne: userId } }).limit(10);
    return recommendations;
};

module.exports = {
    getRecommendations,
};