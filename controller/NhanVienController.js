const NhanVien = require("../models/NhanVien");
const User = require("../models/User")
const VaiTro = require("../models/VaiTro");
const UserVaiTro = require("../models/User_VaiTro");
const bcrypt = require("bcrypt");
// exports.getAllNhanVien = async (req, res) => {
//     try {
//         const nhanVien = await NhanVien.findAll({
//             include: [{
//                 model: User
//             }]
//         });
//         res.json(nhanVien);
//     } catch (error) {
//         res.status(500).json({ error: "Lỗi khi lấy nhân viên" });
//     }
// };
exports.getAllNhanVien = async (req, res) => {
    try {
        const nhanVien = await NhanVien.findAll({
            include: [{
                model: User
            }]
        });
        res.json(nhanVien);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy nhân viên" });
    }
};

exports.getNhanVienById = async (req, res) => {
    try {
        const { id } = req.params;
        const nhanVien = await NhanVien.findByPk(id,
            {
                include: [{
                    model: User
                }]
            }
        );
        if (!nhanVien)
            return res.status(404).json({ error: "Không tìm thấy nhân viên" });
        res.json(nhanVien);
    } catch (error) {
        res.status(500).json({ error: "Lỗi láy nhân viên theo id" });
    }
}

exports.addNhanVien = async (req, res) => {
    try {
        const { username, password, HoTen, SoDienThoai, email, DiaChi, TrangThai, MaNV, NgayLamViec } = req.body;
        if (!username || !password || !email || !SoDienThoai) {
            return res.status(400).json({ error: "Các thông username, password, email và SoDienThoai là bắt buộc" });
        }
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
        const vaitroKH = await VaiTro.findOne({ where: { MaVaiTro: "NHANVIEN" } });
        if (!vaitroKH) return res.status(400).json({ error: "Vai trò nhân viên không tồn tại" });
        await UserVaiTro.create({
            User_id: newUser.id,
            VaiTro_id: vaitroKH.id,
        });
        const newNhanVien = await NhanVien.create({
            MaNV,
            User_id: newUser.id,
            NgayLamViec
        });
        res.status(201).json({
            message: "Thêm nhân viên thành công",
            NhanVien: newNhanVien,
        });
    } catch (error) {
        console.error("Lỗi khi thêm nhân viên:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
exports.updateNhanVien = async (req, res) => {
    try {
        const { id } = req.params;
        let { username, password, HoTen,
            SoDienThoai, email, DiaChi, TrangThai, NgayLamViec } = req.body;
        const nhanVien = await NhanVien.findByPk(id);
        if (!nhanVien) return res.status(404).json({ message: "Không tìm thấy nhân viên" });

        // const user = await User.findByPk(nhanVien.User_id);
        // if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng tương ứng" });
        const user = await User.findByPk(nhanVien.User_id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng tương ứng" });

        if (username && username !== user.username) {
            const exist = await User.findOne({ where: { username } });
            if (exist && exist.id !== user.id) {
                return res.status(400).json({ error: "Username đã tồn tại" });
            }
        }
        if (email && email !== user.email) {
            const exist = await User.findOne({ where: { email } });
            if (exist && exist.id !== user.id) {
                return res.status(400).json({ error: "Email đã tồn tại" });
            }
        }
        if (SoDienThoai && SoDienThoai !== user.SoDienThoai) {
            const exist = await User.findOne({ where: { SoDienThoai } });
            if (exist && exist.id !== user.id) {
                return res.status(400).json({ error: "Số điện thoại đã tồn tại" });
            }
        }
        if (password) {
            password = await bcrypt.hash(password, 10);
        }
        await user.update({
            username,
            password: password || user.password,
            HoTen,
            SoDienThoai,
            email,
            DiaChi,
            TrangThai: 1 // Đảm bảo TrangThai luôn là 1 nếu không có giá trị truyền vào
        });
        await nhanVien.update({
            NgayLamViec
        });
        res.status(200).json({
            message: "Cập nhật nhân viên thành công",
            user,
            nhanVien
        })
    } catch (error) {
        console.error("Lỗi khi cập nhật nhân viên:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
// exports.deleteNhanVien = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const nhanVien = await NhanVien.findByPk(id);
//         if (!nhanVien) {
//             return res.status(404).json({ error: "Không tìm thấy nhân viên" });
//         }

//         const userId = nhanVien.User_id;

//         const user = await User.findByPk(userId);

//         if (!user)
//             return res.status(404).json({ error: "Không tìm thấy khách hàng" });
//         if (user.TrangThai === 0) {
//             return res.status(400).json({ error: "Nhân viên đã bị vô hiệu hóa trước đó" });
//         }
//         await user.update({ TrangThai: 0 });
//         res.status(200).json({ message: "Xóa nhân viên (mềm) thành công!" });
//     } catch (error) {
//         console.error("Lỗi khi xóa nhân viên:", error);

//         return res.status(500).json({ error: "Lỗi khi xóa nhân viên" });
//     }
// }


exports.deleteNhanVien = async (req, res) => {
    try {
        const { id } = req.params;
        const nhanVien = await NhanVien.findByPk(id);
        if (!nhanVien) {
            return res.status(404).json({ error: "Không tìm thấy nhân viên" });
        }

        const userId = nhanVien.User_id;

        const user = await User.findByPk(userId);

        if (!user)
            return res.status(404).json({ error: "Không tìm thấy khách hàng" });
        if (user.TrangThai === 0) {
            return res.status(400).json({ error: "Nhân viên đã bị vô hiệu hóa trước đó" });
        }
        await user.update({ TrangThai: 0 });
        res.status(200).json({ message: "Xóa nhân viên (mềm) thành công!" });
    } catch (error) {
        console.error("Lỗi khi xóa nhân viên:", error);

        return res.status(500).json({ error: "Lỗi khi xóa nhân viên" });
    }
}