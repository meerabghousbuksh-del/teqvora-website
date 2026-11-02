const Visit = require('../models/Visit');
const { validateVisit } = require('../utils/validation');

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 14;

// Days are UTC calendar days (YYYY-MM-DD).
function toDayKey(date) {
    return date.toISOString().slice(0, 10);
}

// POST /api/analytics/visit
async function recordVisit(req, res) {
    const { isValid, errors, value } = validateVisit(req.body);
    if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid visit data.', errors });
    }

    await Visit.create({ ...value, day: toDayKey(new Date()) });
    return res.status(204).end();
}

// Used by the admin dashboard.
async function getVisitSummary() {
    const now = Date.now();
    const today = toDayKey(new Date(now));
    const sevenDaysAgo = toDayKey(new Date(now - 6 * DAY_MS));
    const chartStart = toDayKey(new Date(now - (CHART_DAYS - 1) * DAY_MS));

    const [total, todayCount, last7Days, topPages, dailyCounts] = await Promise.all([
        Visit.countDocuments(),
        Visit.countDocuments({ day: today }),
        Visit.countDocuments({ day: { $gte: sevenDaysAgo } }),
        Visit.aggregate([
            { $group: { _id: '$path', visits: { $sum: 1 } } },
            { $sort: { visits: -1 } },
            { $limit: 5 }
        ]),
        Visit.aggregate([
            { $match: { day: { $gte: chartStart } } },
            { $group: { _id: '$day', visits: { $sum: 1 } } }
        ])
    ]);

    // Fill days without visits with 0 so the chart always has 14 bars.
    const countsByDay = new Map(dailyCounts.map((entry) => [entry._id, entry.visits]));
    const daily = Array.from({ length: CHART_DAYS }, (unused, index) => {
        const day = toDayKey(new Date(now - (CHART_DAYS - 1 - index) * DAY_MS));
        return { day, visits: countsByDay.get(day) || 0 };
    });

    return {
        total,
        today: todayCount,
        last7Days,
        topPages: topPages.map((page) => ({ path: page._id, visits: page.visits })),
        daily
    };
}

module.exports = { recordVisit, getVisitSummary };
