const { LichHen, KhachHang, NhanVien, User, NhaDat, HinhAnhNhaDat } = require("../models/quanhe");
const { sendEmail, getEmailHtmlDuyet, getEmailHtmlHuy } = require("../config/mail");
const { formatDateTime } = require('../utils/formatDateTime');

// Đặt lịch hẹn
exports.datLichHen = async (req, res) => {
    try {
        const { nhaDatId, NgayHen } = req.body;
        const khachHang = await KhachHang.findOne({ where: { User_id: req.user.id } });

        if (!khachHang) {
            return res.status(400).json({ message: "Khách hàng không tồn tại" });
        }

        if (!nhaDatId || !NgayHen) {
            return res.status(400).json({ message: "Thiếu thông tin cần thiết để đặt lịch" });
        }

        const lichHen = await LichHen.create({
            NhaDat_id: nhaDatId,
            KhachHang_id: khachHang.id,
            NhanVien_id: null,
            NgayHen,
            TrangThai: 0
        });

        return res.status(201).json({ message: "Đặt lịch hẹn thành công, vui lòng chờ duyệt", lichHen });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Duyệt lịch hẹn

// Hủy lịch hẹn
exports.huyLichHen = async (req, res) => {
    try {
        const { id } = req.params;
        // Lấy lịch hẹn kèm Khách hàng và User
        const lichHen = await LichHen.findByPk(id, {
            include: [
                {
                    model: KhachHang,
                    include: [
                        {
                            model: User,
                            attributes: ["HoTen", "email"]
                        }
                    ]
                }
            ]
        });

        if (!lichHen) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        if (lichHen.TrangThai === 2) return res.status(400).json({ message: "Lịch hẹn này đã bị hủy trước đó" });

        lichHen.TrangThai = 2;
        await lichHen.save();

        // Gửi email nếu có
        if (lichHen.KhachHang?.User?.email) {
            try {
                await sendEmail(
                    lichHen.KhachHang.User.email,
                    "❌ Lịch hẹn của bạn đã bị hủy - BlackS City",
                    getEmailHtmlHuy(lichHen.KhachHang.User.HoTen, formatDateTime(lichHen.NgayHen))
                );
            } catch (err) {
                console.error("Gửi email thất bại:", err.message);
            }
        }

        return res.json({ message: "Hủy lịch hẹn thành công", lichHen });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.duyetLichHen = async (req, res) => {
    try {
        const { id } = req.params;
        const { nhanVienId } = req.body;

        const lichHen = await LichHen.findByPk(id, {
            include: [
                {
                    model: KhachHang,
                    include: [
                        {
                            model: User,
                            attributes: ["HoTen", "email"]
                        }
                    ]
                }
            ]
        }); if (!lichHen) return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });

        const trungLich = await LichHen.findOne({
            where: {
                NhanVien_id: nhanVienId,
                NgayHen: lichHen.NgayHen,
                TrangThai: 1
            }
        });

        if (trungLich) {
            return res.status(400).json({ message: "Nhân viên này đã có lịch vào thời gian đó" });
        }

        lichHen.NhanVien_id = nhanVienId;
        lichHen.TrangThai = 1;
        await lichHen.save();

        if (lichHen.KhachHang?.User?.email) {
            await sendEmail(
                lichHen.KhachHang.User.email,
                "🎉 Lịch hẹn của bạn đã được duyệt - BlackS City",
                getEmailHtmlDuyet(
                    lichHen.KhachHang.User.HoTen,
                    formatDateTime(lichHen.NgayHen),

                )
            );
        }

        return res.json({ message: "Duyệt lịch thành công", lichHen });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Lấy tất cả lịch hẹn kèm Khách hàng + Nhân viên + User (tách User riêng)
exports.getAllLichHen = async (req, res) => {
    try {
        const lichHens = await LichHen.findAll({
            include: [
                {
                    model: NhanVien,
                    include: [
                        {
                            model: User,
                            attributes: ["HoTen"],
                        }
                    ]
                },
                {
                    model: KhachHang,
                    include: [
                        {
                            model: User,
                            attributes: ["HoTen", "SoDienThoai"],
                        }
                    ]
                }
            ]
        });
        return res.json(lichHens);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Lấy lịch hẹn của 1 nhân viên
exports.getLichHenNhanVien = async (req, res) => {
    try {
        const { id } = req.params;
        const lichHens = await LichHen.findAll({
            where: { NhanVien_id: id, TrangThai: 1 },
            include: [
                {
                    model: KhachHang,
                    include: [{ model: User, attributes: ["HoTen", "SoDienThoai"] }]
                },
                {
                    model: NhaDat,
                    attributes: ["TenNhaDat", "ThanhPho", "Quan", "Phuong", "Duong", "SoNha", "GiaBan", "DienTich", "Huong"],
                    include: [
                        {
                            model: HinhAnhNhaDat,
                            as: "hinhAnh",
                            attributes: ["url"]
                        }
                    ]
                }
            ]
        });
        return res.json(lichHens);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
