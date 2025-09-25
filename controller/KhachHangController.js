const KhachHang = require("../models/KhachHang");
const User = require("../models/User");
const VaiTro = require("../models/VaiTro");
const UserVaiTro = require("../models/User_VaiTro");

const bcrypt = require("bcrypt");


exports.getKhachHangById = async (req, res) => {
    try {
        const { id } = req.params;
        const khachHang = await KhachHang.findByPk(id,
            {
                include: [{
                    model: User
                }]
            }
        );
        if (!khachHang)
            return res.status(404).json({ error: "Không tìm thấy khách hàng" });
        res.json(khachHang);
    } catch (error) {
        console.error("Lỗi lấy khách hàng theo id: ", error);
        res.status(500).json({ error: "Lỗi láy khách hàng theo id" });
    }
}

exports.addKhachHang = async (req, res) => {
    try {
        const { username, password, HoTen, SoDienThoai, email, DiaChi, TrangThai, MaKH } = req.body;
        if (!username || !password || !email || !SoDienThoai) {
            return res.status(400).json({ error: "Các thông username, password, email và SoDienThoai là bắt buộc" });
        }
        // Kiểm tra username, email, và số điện thoại đã tồn tại hay chưa
        const existUsername = await User.findOne({ where: { username } });
        if (existUsername) return res.status(400).json({ error: "Username đã tồn tại" });

        if (email) {
            const existEmail = await User.findOne({ where: { email } });
            if (existEmail) return res.status(400).json({ error: "Email đã tồn tại" });
        }

        const existPhone = await User.findOne({ where: { SoDienThoai } });
        if (existPhone) return res.status(400).json({ error: "Số điện thoại đã tồn tại" });

        const hashPass = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            password: hashPass,
            HoTen,
            SoDienThoai,
            email,
            DiaChi,
            TrangThai: TrangThai || 1
        });

        const vaitroKH = await VaiTro.findOne({ where: { MaVaiTro: "KHACHHANG" } });
        if (!vaitroKH) return res.status(400).json({ error: "Vai trò khách hàng không tồn tại" });

        await UserVaiTro.create({
            User_id: newUser.id,
            VaiTro_id: vaitroKH.id,
        });

        const newCustomer = await KhachHang.create({
            MaKH,
            User_id: newUser.id,
        });

        res.status(201).json({
            message: "Thêm khách hàng thành công",
            customer: newCustomer,
        });
    } catch (error) {
        console.error("Lỗi khi thêm khách hàng:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.updateKhachHang = async (req, res) => {
    try {
        const { id } = req.params; // Đây là ID của khách hàng (KhachHang)
        let {
            username, password, HoTen,
            SoDienThoai, email, DiaChi, TrangThai
        } = req.body;

        // Tìm khách hàng qua ID của khách hàng (KhachHang)
        const khachHang = await KhachHang.findByPk(id);
        if (!khachHang) return res.status(404).json({ message: "Không tìm thấy khách hàng" });

        // Lấy thông tin người dùng từ bảng User theo User_id
        const user = await User.findByPk(khachHang.User_id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng tương ứng" });

        // Kiểm tra username trùng
        if (username && username !== user.username) {
            const exist = await User.findOne({ where: { username } });
            if (exist && exist.id !== user.id) {
                return res.status(400).json({ error: "Username đã tồn tại" });
            }
        }

        // Kiểm tra email trùng
        if (email && email !== user.email) {
            const exist = await User.findOne({ where: { email } });
            if (exist && exist.id !== user.id) {
                return res.status(400).json({ error: "Email đã tồn tại" });
            }
        }

        // Kiểm tra số điện thoại trùng
        if (SoDienThoai && SoDienThoai !== user.SoDienThoai) {
            const exist = await User.findOne({ where: { SoDienThoai } });
            if (exist && exist.id !== user.id) {
                return res.status(400).json({ error: "Số điện thoại đã tồn tại" });
            }
        }

        // Hash password nếu có truyền
        if (password) {
            password = await bcrypt.hash(password, 10);
        }

        // Cập nhật thông tin trong bảng User
        await user.update({
            username,
            password: password || user.password,
            HoTen,
            SoDienThoai,
            email,
            DiaChi,
            TrangThai: 1 // Đảm bảo TrangThai luôn là 1 nếu không có giá trị truyền vào
        });


        res.status(200).json({
            message: "Cập nhật khách hàng thành công",
            user,
            khachHang
        });

    } catch (err) {
        console.error("Lỗi khi cập nhật khách hàng:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
};


exports.deleteKhachHang = async (req, res) => {
    try {
        const { id } = req.params;
        const khachHang = await KhachHang.findByPk(id);
        if (!khachHang) {
            return res.status(404).json({ error: "Không tìm thấy khách hàng" });
        }

        const userId = khachHang.User_id;
        const user = await User.findByPk(userId);
        if (!user)
            return res.status(404).json({ error: "Không tìm thấy khách hàng" });
        if (user.TrangThai === 0) {
            return res.status(400).json({ error: "Khách hàng đã bị vô hiệu hóa trước đó" });
        }
        await user.update({ TrangThai: 0 });
        res.status(200).json({ message: "Xóa khách hàng thành công!" });
    } catch (error) {
        console.error("Lỗi khi xóa khách hàng:", error);

        return res.status(500).json({ error: "Lỗi khi xóa khách hàng" });
    }
}