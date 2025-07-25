
const User = require('../models/User');
const StoreItem = require('../models/StoreItem');
const Cart = require('../models/Cart');
const JobCard = require('../models/JobCard');

// AI-powered recommendation engine for 2025
class RecommendationEngine {
    
    // Get personalized product recommendations
    static async getRecommendations(userId, currentProductId = null, limit = 10) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get user's purchase history and preferences
            const userCarts = await Cart.find({ userId, status: 'checked-out' })
                .populate('items.productId');
            
            const userJobCards = await JobCard.find({ companyId: userId })
                .populate('truckId');

            // Collaborative filtering based on similar users
            const collaborativeRecommendations = await this.getCollaborativeRecommendations(userId, limit);
            
            // Content-based filtering based on user's truck/company type
            const contentBasedRecommendations = await this.getContentBasedRecommendations(user, userJobCards, limit);
            
            // Trending items for the user's category
            const trendingRecommendations = await this.getTrendingRecommendations(user, limit);
            
            // Combine and rank recommendations using hybrid approach
            const hybridRecommendations = this.combineRecommendations([
                { recommendations: collaborativeRecommendations, weight: 0.4 },
                { recommendations: contentBasedRecommendations, weight: 0.4 },
                { recommendations: trendingRecommendations, weight: 0.2 }
            ], limit);

            // Filter out current product if provided
            const filteredRecommendations = currentProductId 
                ? hybridRecommendations.filter(item => item._id.toString() !== currentProductId)
                : hybridRecommendations;

            return filteredRecommendations.slice(0, limit);
            
        } catch (error) {
            console.error('Recommendation engine error:', error);
            // Fallback to popular items
            return await StoreItem.findTrending(limit);
        }
    }

    // Collaborative filtering: Find users with similar purchasing patterns
    static async getCollaborativeRecommendations(userId, limit) {
        const userCartItems = await Cart.aggregate([
            { $match: { userId: userId, status: 'checked-out' } },
            { $unwind: '$items' },
            { $group: { _id: '$items.productId', count: { $sum: 1 } } }
        ]);

        const userProductIds = userCartItems.map(item => item._id);

        if (userProductIds.length === 0) {
            return await StoreItem.findTrending(limit);
        }

        // Find similar users who bought similar products
        const similarUsers = await Cart.aggregate([
            { $match: { status: 'checked-out', userId: { $ne: userId } } },
            { $unwind: '$items' },
            { $match: { 'items.productId': { $in: userProductIds } } },
            { $group: { 
                _id: '$userId', 
                commonProducts: { $sum: 1 },
                products: { $push: '$items.productId' }
            }},
            { $match: { commonProducts: { $gte: 2 } } },
            { $sort: { commonProducts: -1 } },
            { $limit: 50 }
        ]);

        // Get products bought by similar users but not by current user
        const recommendedProductIds = [];
        similarUsers.forEach(user => {
            user.products.forEach(productId => {
                if (!userProductIds.includes(productId) && !recommendedProductIds.includes(productId)) {
                    recommendedProductIds.push(productId);
                }
            });
        });

        return await StoreItem.find({ 
            _id: { $in: recommendedProductIds },
            status: 'active',
            isAvailable: true
        }).limit(limit);
    }

    // Content-based filtering: Recommend based on user's truck types and job patterns
    static async getContentBasedRecommendations(user, userJobCards, limit) {
        const truckTypes = userJobCards.map(job => job.truckId?.model).filter(Boolean);
        const commonRepairTypes = this.extractCommonRepairTypes(userJobCards);

        // Map repair types to product categories
        const categoryMapping = {
            'engine': ['Engine Parts', 'Filters', 'Fluids'],
            'brake': ['Brake System'],
            'transmission': ['Transmission', 'Fluids'],
            'electrical': ['Electrical'],
            'body': ['Body Parts'],
            'maintenance': ['Filters', 'Fluids', 'Tools']
        };

        const recommendedCategories = [];
        commonRepairTypes.forEach(repairType => {
            const categories = categoryMapping[repairType.toLowerCase()] || [];
            recommendedCategories.push(...categories);
        });

        // Get products from recommended categories
        const recommendations = await StoreItem.find({
            category: { $in: recommendedCategories },
            status: 'active',
            isAvailable: true
        })
        .sort({ salesCount: -1, rating: -1 })
        .limit(limit);

        return recommendations;
    }

    // Get trending recommendations based on user's role and industry
    static async getTrendingRecommendations(user, limit) {
        const baseQuery = {
            status: 'active',
            isAvailable: true
        };

        // Customize based on user role
        if (user.role === 'company') {
            // Companies might need more specialized tools and bulk items
            baseQuery.category = { $in: ['Tools', 'Fluids', 'Filters'] };
        }

        return await StoreItem.find(baseQuery)
            .sort({ views: -1, salesCount: -1, 'rating.average': -1 })
            .limit(limit);
    }

    // Extract common repair types from job card descriptions
    static extractCommonRepairTypes(jobCards) {
        const repairKeywords = {
            'engine': ['engine', 'motor', 'piston', 'cylinder', 'crankshaft'],
            'brake': ['brake', 'braking', 'pad', 'rotor', 'caliper'],
            'transmission': ['transmission', 'gearbox', 'clutch', 'gear'],
            'electrical': ['electrical', 'wiring', 'battery', 'alternator', 'starter'],
            'body': ['body', 'panel', 'door', 'window', 'bumper'],
            'maintenance': ['oil', 'filter', 'maintenance', 'service', 'tune']
        };

        const repairCounts = {};
        
        jobCards.forEach(job => {
            if (job.description && Array.isArray(job.description)) {
                job.description.forEach(desc => {
                    const text = (desc.partName || '').toLowerCase();
                    Object.keys(repairKeywords).forEach(type => {
                        if (repairKeywords[type].some(keyword => text.includes(keyword))) {
                            repairCounts[type] = (repairCounts[type] || 0) + 1;
                        }
                    });
                });
            }
        });

        // Return top 3 most common repair types
        return Object.entries(repairCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type]) => type);
    }

    // Combine multiple recommendation sources with weights
    static combineRecommendations(sources, limit) {
        const scoreMap = new Map();

        sources.forEach(({ recommendations, weight }) => {
            recommendations.forEach((item, index) => {
                const itemId = item._id.toString();
                const score = (recommendations.length - index) * weight;
                
                if (scoreMap.has(itemId)) {
                    scoreMap.set(itemId, {
                        item,
                        score: scoreMap.get(itemId).score + score
                    });
                } else {
                    scoreMap.set(itemId, { item, score });
                }
            });
        });

        // Sort by combined score and return items
        return Array.from(scoreMap.values())
            .sort((a, b) => b.score - a.score)
            .map(({ item }) => item)
            .slice(0, limit);
    }

    // Get seasonal recommendations (2025 AI feature)
    static async getSeasonalRecommendations(userId, limit = 5) {
        const currentMonth = new Date().getMonth();
        let seasonalCategories = [];

        // Define seasonal patterns
        if (currentMonth >= 11 || currentMonth <= 2) { // Winter
            seasonalCategories = ['Engine Parts', 'Fluids', 'Electrical'];
        } else if (currentMonth >= 3 && currentMonth <= 5) { // Spring
            seasonalCategories = ['Filters', 'Tools', 'Body Parts'];
        } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
            seasonalCategories = ['Brake System', 'Fluids', 'Accessories'];
        } else { // Fall
            seasonalCategories = ['Filters', 'Engine Parts', 'Tools'];
        }

        return await StoreItem.find({
            category: { $in: seasonalCategories },
            status: 'active',
            isAvailable: true
        })
        .sort({ salesCount: -1 })
        .limit(limit);
    }
}

// Export methods
module.exports = {
    getRecommendations: RecommendationEngine.getRecommendations.bind(RecommendationEngine),
    getSeasonalRecommendations: RecommendationEngine.getSeasonalRecommendations.bind(RecommendationEngine),
    getCollaborativeRecommendations: RecommendationEngine.getCollaborativeRecommendations.bind(RecommendationEngine),
    getContentBasedRecommendations: RecommendationEngine.getContentBasedRecommendations.bind(RecommendationEngine)
};
