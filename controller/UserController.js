const User = require("../models/User");
const bcrypt = require("bcrypt");
const VaiTro = require("../models/VaiTro");
const UserVaiTro = require("../models/User_VaiTro");

const KhachHang = require("../models/KhachHang");

exports.getAllUsers = async (req, res) => {
    try {
        const users = res.paginateResult;
        res.json(users);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user)
            return res.status(404).json({ error: "Không tìm thấy user" });
        res.json(user);
    } catch (error) {
        console.error("Lỗi khi lấy người dùng:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.addUser = async (req, res) => {
    try {
        const { username, password, HoTen, SoDienThoai, email, DiaChi, TrangThai } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username và Password không được bỏ trống" });
        }
        //ktra useruser
        const existUsername = await User.findOne({
            where: { username }
        });
        if (existUsername) return res.status(400).json({ error: "Username đã tồn tại" });

        //ktra email
        const existEmail = await User.findOne({
            where: { email }
        });
        if (existEmail) return res.status(400).json({ error: "Email đã tồn tại" });

        //ktra sdt
        const existSoDienThoai = await User.findOne({
            where: { SoDienThoai }
        });
        if (existSoDienThoai) return res.status(400).json({ error: "Số điện thoại đã tồn tại" });
        const hashPass = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            password: hashPass,
            HoTen,
            SoDienThoai,
            email,
            DiaChi,
            TrangThai: 1,
        });

        const vaitroKH = await VaiTro.findOne({ where: { MaVaiTro: "KHACHHANG" } });
        await UserVaiTro.create({
            User_id: newUser.id,
            VaiTro_id: vaitroKH.id,
        });
        await KhachHang.create({ User_id: newUser.id, MaKH: `KH${newUser.id.toString().padStart(3, '0')}` });
        
        res.status(201).json({ message: "Thêm tài khoản thành công!" });
    } catch (error) {
        console.error("Lỗi khi thêm tài khoản:", error);
        res.status(500).json({ error: error.message });
    }
};

// exports.updateUser = async (req, res) => {
//     try {
//         const user = await User.findByPk(req.params.id);
//         if (!user) return res.status(404).json({ error: "Không tìm thấy user" });
//         //ktra user
//         if (req.body.username && req.body.username != user.username) {
//             const existUsername = await User.findOne({ where: { username: req.body.username } });
//             if (existUsername) return res.status(400).json({ error: "Username đã tồn tại" });
//         }
//         //ktra email
//         if (req.body.email && req.body.email != user.email) {
//             const existEmail = await User.findOne({ where: { email: req.body.email } });
//             if (existEmail) return res.status(400).json({ error: "Email đã tồn tại" });
//         }

//         //ktra sdt
//         if (req.body.SoDienThoai && req.body.SoDienThoai != user.SoDienThoai) {
//             const existSoDienThoai = await User.findOne({ where: { SoDienThoai: req.body.SoDienThoai } });
//             if (existSoDienThoai) return res.status(400).json({ error: "Số điện thoại đã tồn tại" });
//         }
//         if (req.body.password) {
//             req.body.password = await bcrypt.hash(req.body.password, 10);
//         }
//         await User.update(req.body, { where: { id: req.params.id } });
//         res.status(200).json({ message: "Cập nhật thành công!" });
//     } catch (error) {
//         console.error("Lỗi khi cập nhật tài khoản:", error);

//         res.status(500).json({ error: "Lỗi khi cập nhật user" });
//     }
// };


exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "Không tìm thấy user" });
        //ktra user
        if (req.body.username && req.body.username != user.username) {
            const existUsername = await User.findOne({ where: { username: req.body.username } });
            if (existUsername) return res.status(400).json({ error: "Username đã tồn tại" });
        }
        //ktra email
        if (req.body.email && req.body.email != user.email) {
            const existEmail = await User.findOne({ where: { email: req.body.email } });
            if (existEmail) return res.status(400).json({ error: "Email đã tồn tại" });
        }

        //ktra sdt
        if (req.body.SoDienThoai && req.body.SoDienThoai != user.SoDienThoai) {
            const existSoDienThoai = await User.findOne({ where: { SoDienThoai: req.body.SoDienThoai } });
            if (existSoDienThoai) return res.status(400).json({ error: "Số điện thoại đã tồn tại" });
        }
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        await User.update(req.body, { where: { id: req.params.id } });
        res.status(200).json({ message: "Cập nhật thành công!" });
    } catch (error) {
        console.error("Lỗi khi cập nhật tài khoản:", error);

        res.status(500).json({ error: "Lỗi khi cập nhật user" });
    }
};

