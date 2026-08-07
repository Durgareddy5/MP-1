import express from 'express';
import { authenticate } from '../Middlewares/authMiddleware.js';
import { User } from '../Models/sql/index.js';
import { ActivityLog } from '../Models/nosql/index.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = express.Router();

router.use(authenticate);

// GET /settings
router.get('/', async (req, res) => {
  return ApiResponse.success(res, { data: req.user.toSafeObject() });
});

// PUT /settings/preferences
router.put('/preferences', async (req, res) => {
  try {
    const { theme_preference, default_exchange,
            notification_preferences, default_product_type } = req.body;

    const patch = {};
    if (theme_preference)            patch.theme_preference         = theme_preference;
    if (default_exchange)            patch.default_exchange         = default_exchange;
    if (notification_preferences)   patch.notification_preferences = notification_preferences;
    if (default_product_type)       patch.default_product_type     = default_product_type;

    await req.user.update(patch);

    await ActivityLog.create({
      user_id:     req.user.id,
      action:      'settings_changed',
      category:    'profile',
      description: `User preferences updated`,
      metadata:    { updated_fields: Object.keys(patch) },
      ip_address:  req.ip,
    });

    return ApiResponse.success(res, {
      message: 'Preferences saved',
      data:    req.user.toSafeObject(),
    });
  } catch (error) {
    return ApiResponse.serverError(res);
  }
});

export default router;