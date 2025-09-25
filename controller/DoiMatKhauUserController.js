const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        const user = await User.findByPk(userId);

        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        
        //Kiểm tra mật khẩu mới không trùng
        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ' });
        }

        //Hash và lưu mới
        user.password = await bcrypt.hash6(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Đổi mật khẩu thành công' });

    } catch (error) {

        console.error(error);

        res.status(500).json({ message: 'Đã xảy ra lỗi' });
    }
    // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

};
