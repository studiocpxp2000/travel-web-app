const User = require('../models/User');
const Promoter = require('../models/Promoter');

// Helper to map scanner type to status field
const getStatusField = (scannerType) => {
    switch (scannerType) {
        case 'ARRIVAL_SCANNER': return 'status_flags.on_airport'; // Or hotel_arrival? Based on mockData it was generalized
        // Let's align with mockData keys or User Schema keys
        // User Schema: on_airport, on_bus, at_hotel
        // But mockData used: is_arrived_on_airport, etc.
        // Let's assume standard mapping:
        case 'AIRPORT_ARRIVAL': return 'status_flags.on_airport';
        case 'BUS_ARRIVAL': return 'status_flags.on_bus';
        case 'HOTEL_ARRIVAL': return 'status_flags.at_hotel';
        case 'SESSION_1': return 'status_flags.session_1';
        case 'SESSION_2': return 'status_flags.session_2';
        case 'SESSION_3': return 'status_flags.session_3';
        case 'SESSION_4': return 'status_flags.session_4';
        case 'SESSION_5': return 'status_flags.session_5';
        case 'SESSION_6': return 'status_flags.session_6';
        case 'SESSION_7': return 'status_flags.session_7';
        case 'SESSION_8': return 'status_flags.session_8';
        case 'SESSION_9': return 'status_flags.session_9';
        default: return null;
    }
};

// @desc    Scan User QR Code
// @route   POST /api/promoter/scan
// @access  Promoter
exports.scanUser = async (req, res, next) => {
    try {
        const { qr_data } = req.body;
        const promoterId = req.user.id;
        const orgId = req.user.org_id;

        // 1. Validate Input
        if (!qr_data) {
            return res.status(400).json({ success: false, message: 'QR Data is required' });
        }

        // 2. Find User by QR Data AND Org ID (Security)
        const user = await User.findOne({ qr_data, org_id: orgId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or invalid QR code' });
        }

        // 3. Determine Field to Update
        const promoter = await Promoter.findById(promoterId);
        if (!promoter) {
            return res.status(401).json({ success: false, message: 'Promoter not found' });
        }

        const fieldToUpdate = getStatusField(promoter.scanner_type);

        // Handle "ARRIVAL_SCANNER" generic case from mockData if not specific
        // If scanner_type matches specific fields, great.
        // If undefined mapping:
        if (!fieldToUpdate) {
            // Fallback logic or error?
            // For now let's assume 'ARRIVAL_SCANNER' -> 'status_flags.at_hotel' as main check-in?
            // Or maybe we just return success without update if type is 'VIEW_ONLY'?
            if (promoter.scanner_type === 'ARRIVAL_SCANNER') {
                // Creating a safe default mapped to schema
                // Let's assume generic arrival means hotel arrival for now or create specific types
            } else {
                return res.status(400).json({ success: false, message: 'Invalid Scanner Configuration' });
            }
        }

        // 4. Check if already scanned
        // We need to resolve the nested path 'status_flags.session_1' manually or use Mongoose get()
        // Mongoose handles dot notation in queries/updates but not directly on document property access easily without split
        // Let's use clean logic:
        const fieldPath = fieldToUpdate || 'status_flags.at_hotel'; // Defaulting for safety
        const isAlreadyScanned = user.get(fieldPath);

        if (isAlreadyScanned) {
            return res.status(200).json({
                success: true,
                message: 'User already scanned',
                data: { user, alreadyScanned: true }
            });
        }

        // 5. Update User
        // $set: { [fieldPath]: true }
        await User.findByIdAndUpdate(user._id, {
            $set: { [fieldPath]: true }
        });

        // 6. Update Promoter Activity
        await Promoter.findByIdAndUpdate(promoterId, { last_active: new Date() });

        res.status(200).json({
            success: true,
            message: 'Scan successful',
            data: {
                user: { ...user.toObject(), [fieldPath]: true }, // Return updated state
                alreadyScanned: false
            }
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get Promoter Stats
// @route   GET /api/promoter/stats
// @access  Promoter
exports.getPromoterStats = async (req, res, next) => {
    try {
        const promoter = await Promoter.findById(req.user.id);
        const field = getStatusField(promoter.scanner_type) || 'status_flags.at_hotel';

        const totalScanned = await User.countDocuments({
            org_id: req.user.org_id,
            [field]: true
        });

        const totalUsers = await User.countDocuments({ org_id: req.user.org_id });

        res.status(200).json({
            success: true,
            data: {
                scanned: totalScanned,
                total: totalUsers,
                scanner_type: promoter.scanner_type
            }
        });
    } catch (err) {
        next(err);
    }
};
