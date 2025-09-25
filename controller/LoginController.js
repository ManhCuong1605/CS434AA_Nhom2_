require("dotenv").config();
const jwt = require("jsonwebtoken");
const { where } = require("sequelize");
const User = require("../models/User");
const VaiTro = require("../models/VaiTro");
const UserVaiTro = require("../models/User_VaiTro");
const NhanVien = require("../models/NhanVien");
const RefreshToken = require("../models/RefreshToken");

const KhachHang = require("../models/KhachHang");
const ms = require("ms");
///jjjk
const bcrypt = require("bcrypt");
const refreshTokenExpiresInMs = ms(process.env.JWT_REFRESH_EXPIRES); // "7d" => 604800000
const MAX_TOKENS = parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER) || 5;

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//hbebkjesb
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Thiếu username hoặc password!" });
        }

        // Kiểm tra user có tồn tại không
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không đúng!" });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không đúng!" });
        }

        // Lấy danh sách vai trò của user
        const userRoles = await UserVaiTro.findAll({
            where: { User_id: user.id },
            include: [{ model: VaiTro, attributes: ["MaVaiTro"] }],
        });

        // Chuyển danh sách vai trò thành mảng
        const roles = userRoles.map(ur => ur.VaiTro.MaVaiTro);

        let nhanVienId = null;
        if (roles.includes("NHANVIEN")) {
            const nhanVien = await NhanVien.findOne({ where: { User_id: user.id } });
            if (nhanVien) nhanVienId = nhanVien.id;
        }

        // Tạo access  token
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES }
        );


        await RefreshToken.create({
            token: refreshToken,
            userId: user.id, // liên kết với user
            expiresAt: new Date(Date.now() + refreshTokenExpiresInMs),
            revoked: false
        });

        const userTokens = await RefreshToken.findAll({
            where: { userId: user.id },
            order: [['createdAt', 'DESC']]
        });
        if (userTokens.length > MAX_TOKENS) {
            const tokensToDelete = userTokens.slice(MAX_TOKENS); // cắt các token cũ nhất
            const idsToDelete = tokensToDelete.map(t => t.id); // lấy id các token cần xóa
            await RefreshToken.destroy({ where: { id: idsToDelete } });
        }
        res.json({
            message: "Đăng nhập thành công!",
            accessToken,
            refreshToken,
            roles,
            userId: user.id,
            nhanVienId // sẽ trả null nếu không phải nhân viên
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ error: "Lỗi đăng nhập" });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Thiếu refresh token!" });

    try {
        const savedToken = await RefreshToken.findOne({ where: { token: refreshToken, revoked: false } });
        if (!savedToken) return res.status(403).json({ error: "Refresh token không hợp lệ!" });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Lấy roles
        const userRoles = await UserVaiTro.findAll({
            where: { User_id: decoded.id },
            include: [{ model: VaiTro, attributes: ["MaVaiTro"] }]
        });
        const roles = userRoles.map(ur => ur.VaiTro.MaVaiTro);
        const newAccessToken = jwt.sign(
            { id: decoded.id, roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );
        res.json({ accessToken: newAccessToken });

    } catch (error) {
        res.status(403).json({ error: "Refresh token không hợp lệ hoặc đã hết hạn!" });
    }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Thiếu refresh token!" });

    try {
        const token = await RefreshToken.findOne({ where: { token: refreshToken } });
        if (token) {
            token.revoked = true;
            await token.save();
        }
        res.json({ message: "Đăng xuất thành công!" });
    } catch (err) {
        res.status(500).json({ error: "Lỗi khi đăng xuất!" });
    }
};

exports.loginGoogle = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "Thiếu Google ID Token!" });

        // Verify token với Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, sub } = payload;

        // Kiểm tra user đã tồn tại chưa
        let user = await User.findOne({ where: { username: email } });
        // hass pass de password ko null
        const hashPass = await bcrypt.hash("google_oauth_user", 10);
        if (!user) {
            // Nếu chưa có → tạo mới (giống addUser nhưng không cần password)
            user = await User.create({
                username: email,
                password: hashPass,
                HoTen: name,
                SoDienThoai: null,
                email,
                DiaChi: null,
                TrangThai: 1
            });

            // Gán role KHACHHANG
            const vaitroKH = await VaiTro.findOne({ where: { MaVaiTro: "KHACHHANG" } });
            await UserVaiTro.create({
                User_id: user.id,
                VaiTro_id: vaitroKH.id
            });

            // Tạo KhachHang
            const existingKH = await KhachHang.findOne({ where: { User_id: user.id } });
            if (!existingKH) {
                await KhachHang.create({
                    User_id: user.id,
                    MaKH: `KH${user.id.toString().padStart(3, '0')}`
                });
            }
        }

        // Lấy roles của user
        const userRoles = await UserVaiTro.findAll({
            where: { User_id: user.id },
            include: [{ model: VaiTro, attributes: ["MaVaiTro"] }]
        });
        const roles = userRoles.map(ur => ur.VaiTro.MaVaiTro);

        // Tạo access token
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        // Tạo refresh token
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES }
        );

        await RefreshToken.create({
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
            revoked: false
        });

        res.json({
            message: "Đăng nhập Google thành công!",
            accessToken,
            refreshToken,
            roles,
            userId: user.id,
            username: user.username
        });

    } catch (err) {
        console.error("loginGoogle error:", err);
        res.status(500).json({ error: "Đăng nhập Google thất bại!" });
    }
};

