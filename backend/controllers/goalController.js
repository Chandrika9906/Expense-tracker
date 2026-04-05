const Goal = require('../models/Goal');

// Get all goals for user
exports.getGoals = async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = { userId: req.user.id };

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        const goals = await Goal.find(query).sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ message: 'Error fetching goals' });
    }
};

// Create new goal
exports.createGoal = async (req, res) => {
    try {
        const goalData = {
            ...req.body,
            userId: req.user.id
        };

        const goal = new Goal(goalData);
        await goal.save();

        res.status(201).json(goal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ message: 'Error creating goal' });
    }
};

// Update goal
exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await Goal.findOne({ _id: id, userId: req.user.id });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'currentAmount' && key !== 'contributions' && key !== 'milestones') {
                goal[key] = req.body[key];
            }
        });

        await goal.save();
        res.json(goal);
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ message: 'Error updating goal' });
    }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ message: 'Error deleting goal' });
    }
};

// Add contribution to goal
exports.addContribution = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const goal = await Goal.findOne({ _id: id, userId: req.user.id });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Add contribution
        goal.contributions.push({
            amount,
            notes: notes || '',
            date: new Date()
        });

        // Update current amount
        goal.currentAmount += amount;

        // Check for new milestones
        const newMilestones = goal.checkMilestones();

        // Auto-complete if target reached
        if (goal.currentAmount >= goal.targetAmount && goal.status === 'Active') {
            goal.status = 'Completed';
        }

        await goal.save();

        res.json({
            goal,
            newMilestones,
            message: newMilestones.length > 0
                ? `Congratulations! You've reached ${newMilestones.join('%, ')}% of your goal!`
                : 'Contribution added successfully'
        });
    } catch (error) {
        console.error('Error adding contribution:', error);
        res.status(500).json({ message: 'Error adding contribution' });
    }
};

// Get goal progress details
exports.getGoalProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await Goal.findOne({ _id: id, userId: req.user.id });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        const progress = {
            goalId: goal._id,
            title: goal.title,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            remainingAmount: goal.remainingAmount,
            progressPercentage: goal.progressPercentage,
            totalContributions: goal.contributions.length,
            averageContribution: goal.contributions.length > 0
                ? goal.contributions.reduce((sum, c) => sum + c.amount, 0) / goal.contributions.length
                : 0,
            lastContribution: goal.contributions.length > 0
                ? goal.contributions[goal.contributions.length - 1]
                : null,
            daysRemaining: goal.daysRemaining,
            isOverdue: goal.isOverdue,
            milestones: goal.milestones,
            status: goal.status
        };

        res.json(progress);
    } catch (error) {
        console.error('Error fetching goal progress:', error);
        res.status(500).json({ message: 'Error fetching goal progress' });
    }
};

// Complete goal
exports.completeGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await Goal.findOne({ _id: id, userId: req.user.id });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        goal.status = 'Completed';

        // Mark all milestones as achieved
        goal.milestones.twentyFive = true;
        goal.milestones.fifty = true;
        goal.milestones.seventyFive = true;
        goal.milestones.hundred = true;

        await goal.save();
        res.json(goal);
    } catch (error) {
        console.error('Error completing goal:', error);
        res.status(500).json({ message: 'Error completing goal' });
    }
};

// Get goal statistics
exports.getGoalStats = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id });

        const stats = {
            totalGoals: goals.length,
            activeGoals: goals.filter(g => g.status === 'Active').length,
            completedGoals: goals.filter(g => g.status === 'Completed').length,
            totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
            totalSavedAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
            overallProgress: 0,
            categoryBreakdown: {}
        };

        // Calculate overall progress
        if (stats.totalTargetAmount > 0) {
            stats.overallProgress = Math.round((stats.totalSavedAmount / stats.totalTargetAmount) * 100);
        }

        // Category breakdown
        goals.forEach(goal => {
            if (!stats.categoryBreakdown[goal.category]) {
                stats.categoryBreakdown[goal.category] = {
                    count: 0,
                    totalTarget: 0,
                    totalSaved: 0,
                    progress: 0
                };
            }
            stats.categoryBreakdown[goal.category].count++;
            stats.categoryBreakdown[goal.category].totalTarget += goal.targetAmount;
            stats.categoryBreakdown[goal.category].totalSaved += goal.currentAmount;
        });

        // Calculate progress for each category
        Object.keys(stats.categoryBreakdown).forEach(category => {
            const cat = stats.categoryBreakdown[category];
            if (cat.totalTarget > 0) {
                cat.progress = Math.round((cat.totalSaved / cat.totalTarget) * 100);
            }
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching goal stats:', error);
        res.status(500).json({ message: 'Error fetching goal stats' });
    }
};
