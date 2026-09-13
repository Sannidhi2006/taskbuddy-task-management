import { User } from '../models/User.js';

/**
 * @route   PATCH /api/users/theme
 * @desc    Update logged-in user's theme preference ('dark' | 'light')
 * @access  Private (authMiddleware)
 */
export const updateThemePreference = async (req, res) => {
  try {
    const { themePreference } = req.body;

    if (!themePreference || !['dark', 'light'].includes(themePreference)) {
      return res.status(400).json({
        success: false,
        message: "Theme preference must be either 'dark' or 'light'",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { themePreference },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      themePreference: user.themePreference,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        dailyGoal: user.dailyGoal ?? 5,
        themePreference: user.themePreference,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('updateThemePreference Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating theme preference',
    });
  }
};
