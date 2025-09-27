const { Op } = require('sequelize');
const BaiViet = require("../models/BaiViet");
const User = require("../models/User");
const HinhAnhBaiViet = require("../models/HinhAnhBaiViet");

const taoBaiViet = async (req, res) => {
    try {
        const { TieuDe, ThanhPho, Quan, Phuong, DiaChi, MoTa, GiaBan, DienTich, Huong } = req.body;
        const uploadedFiles = req.files;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Người dùng chưa được xác thực hoặc không có." });
        }

        const baiViet = await BaiViet.create({
            TieuDe,
            ThanhPho,
            Quan,
            Phuong,

            DiaChi,
            
            MoTa,
            
            GiaBan,
            
            DienTich,
            
            Huong,
            
            TrangThai: 1,
            
            userId: req.user.id,
        });

        if (uploadedFiles && uploadedFiles.length > 0) {
            const hinhAnhData = uploadedFiles.map((file, index) => ({
                url: file.path || file.secure_url,
                baiVietId: baiViet.id,
                position: index + 1,
            }));
            await HinhAnhBaiViet.bulkCreate(hinhAnhData);
        }

        const baiVietFull = await BaiViet.findByPk(baiViet.id, {
            include: {
                model: HinhAnhBaiViet,
                as: "hinhAnh",
                attributes: ["id", "url", "position"],
            },
        });

        res.status(201).json({
            message: "Bài viết đã được tạo và đang chờ admin duyệt.",
            baiViet: baiVietFull,
        });
    } catch (error) {
        console.error("Lỗi tạo bài viết:", error);
        res.status(500).json({ message: "Lỗi khi tạo bài viết", error: error.message });
    }
};

const layBaiVietDaDuyet = async (req, res) => {
    try {
        const { page = 1, limit = 8 } = req.query;
        const offset = (page - 1) * limit;

        const result = await BaiViet.findAndCountAll({
            where: { TrangThai: 2 },
            include: [
                {
                    model: User,
                    as: "nguoiDang",
                    attributes: ["id", "username", "HoTen", "SoDienThoai"],
                },
                {
                    model: HinhAnhBaiViet,
                    as: "hinhAnh",
                    attributes: ["id", "url", "position"],
                },
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['ngayDang', 'DESC']],
        });

        res.json({
            currentPage: parseInt(page),
            totalPages: Math.ceil(result.count / limit),
            totalItems: result.count,
            data: result.rows,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách bài viết:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết" });
    }
};

const layBaiChoDuyet = async (req, res) => {
    try {
        const baiChoDuyet = await BaiViet.findAll({
            where: { TrangThai: 1 },
            include: [
                {
                    model: User,
                    as: "nguoiDang",
                    attributes: ["id", "username", "HoTen", "SoDienThoai"],
                },
                {
                    model: HinhAnhBaiViet,
                    as: "hinhAnh",
                    attributes: ["id", "url", "position"],
                },
            ],
        });

        res.json(baiChoDuyet);
    } catch (error) {
        console.error("Lỗi lấy bài chờ duyệt:", error);
        res.status(500).json({ message: "Lỗi khi lấy bài chờ duyệt" });
    }
};

const duyetBaiViet = async (req, res) => {
    try {
        const { id } = req.params;

        const baiViet = await BaiViet.findByPk(id);
        if (!baiViet) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        baiViet.TrangThai = 2;
        baiViet.ngayDuyet = new Date();
        await baiViet.save();

        res.json({ message: "Bài viết đã được duyệt thành công", baiViet });
    } catch (error) {
        console.error("Lỗi duyệt bài viết:", error);
        res.status(500).json({ message: "Lỗi khi duyệt bài viết" });
    }
};

const tuChoiBaiViet = async (req, res) => {
    try {
        const { id } = req.params;

        const baiViet = await BaiViet.findByPk(id);
        if (!baiViet) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        baiViet.TrangThai = 3;
        baiViet.ngayDuyet = new Date();
        await baiViet.save();

        res.json({ message: "Bài viết đã bị từ chối", baiViet });
    } catch (error) {
        console.error("Lỗi từ chối bài viết:", error);
        res.status(500).json({ message: "Lỗi khi từ chối bài viết" });
    }
};

const xoaBaiViet = async (req, res) => {
    try {
        const { id } = req.params;

        const baiViet = await BaiViet.findByPk(id, {
            include: { model: HinhAnhBaiViet, as: "hinhAnh" },
        });

        if (!baiViet) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }

        if (baiViet.hinhAnh && baiViet.hinhAnh.length > 0) {
            await HinhAnhBaiViet.destroy({ where: { baiVietId: id } });
        }

        await baiViet.destroy();

        res.json({ message: "Bài viết đã được xóa thành công" });
    } catch (error) {
        console.error("Lỗi xóa bài viết:", error);
        res.status(500).json({ message: "Lỗi khi xóa bài viết", error: error.message });
    }
};

const layTatCaBaiViet = async (req, res) => {
    try {
        const danhSach = await BaiViet.findAll({
            include: [
                {
                    model: User,
                    as: "nguoiDang",
                    attributes: ["id", "username", "HoTen", "SoDienThoai"],
                },
                {
                    model: HinhAnhBaiViet,
                    as: "hinhAnh",
                    attributes: ["id", "url", "position"],
                },
            ],
            order: [['TrangThai', 'ASC']],
        });

        res.json(danhSach);
    } catch (error) {
        console.error("Lỗi lấy danh sách tất cả bài viết:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết" });
    }
};

const layChiTietBaiViet = async (req, res) => {
    try {
        const { id } = req.params;

        const baiViet = await BaiViet.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "nguoiDang",
                    attributes: ["id", "username", "HoTen", "SoDienThoai"],
                },
                {
                    model: HinhAnhBaiViet,
                    as: "hinhAnh",
                    attributes: ["id", "url", "position"],
                },
            ],
        });

        if (!baiViet) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }

        if (baiViet.TrangThai !== 2) {
            return res.status(404).json({ message: "Bài viết không tồn tại hoặc chưa được duyệt" });
        }

        res.json(baiViet);
    } catch (error) {
        console.error("Lỗi lấy chi tiết bài viết:", error);
        res.status(500).json({ message: "Lỗi khi lấy chi tiết bài viết" });
    }
};

const layBaiVietLienQuan = async (req, res) => {
    try {
        const { id } = req.params;
        const baiVietLienQuan = await BaiViet.findAll({
            where: {
                TrangThai: 2,
                id: { [Op.ne]: id },
            },
            include: [
                {
                    model: User,
                    as: "nguoiDang",
                    attributes: ["id", "username", "HoTen", "SoDienThoai"],
                },
                {
                    model: HinhAnhBaiViet,
                    as: "hinhAnh",
                    attributes: ["id", "url", "position"],
                },
            ],
            limit: 6,
            order: [['ngayDang', 'DESC']],
        });

        res.json(baiVietLienQuan);
    } catch (error) {
        console.error("Lỗi lấy bài viết liên quan:", error);
        res.status(500).json({ message: "Lỗi khi lấy bài viết liên quan" });
    }
};

const capNhatBaiViet = async (req, res) => {
    try {
        const { id } = req.params;
        const { TieuDe, ThanhPho, Quan, Phuong, DiaChi, MoTa, GiaBan, DienTich, Huong, TrangThai } = req.body;
        const uploadedFiles = req.files;

        const baiViet = await BaiViet.findByPk(id, {
            include: { model: HinhAnhBaiViet, as: "hinhAnh" },
        });
        if (!baiViet) {
            return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }

        if (baiViet.TrangThai !== 1 && baiViet.TrangThai !== 2) {
            return res.status(400).json({ message: "Chỉ có thể sửa bài viết ở trạng thái chờ duyệt hoặc đã duyệt" });
        }

        baiViet.TieuDe = TieuDe;
        baiViet.ThanhPho = ThanhPho;
        baiViet.Quan = Quan;
        baiViet.Phuong = Phuong;
        baiViet.DiaChi = DiaChi;
        baiViet.MoTa = MoTa;
        baiViet.GiaBan = GiaBan;
        baiViet.DienTich = DienTich;
        baiViet.Huong = Huong;
        if (TrangThai !== undefined) {
            baiViet.TrangThai = TrangThai;
        }

        if (uploadedFiles && uploadedFiles.length > 0) {
            await HinhAnhBaiViet.destroy({ where: { baiVietId: baiViet.id } });
            const hinhAnhData = uploadedFiles.map((file, index) => ({
                url: file.path,
                baiVietId: baiViet.id,
                position: index + 1,
            }));
            await HinhAnhBaiViet.bulkCreate(hinhAnhData);
        }

        await baiViet.save();

        const baiVietFull = await BaiViet.findByPk(baiViet.id, {
            include: {
                model: HinhAnhBaiViet,
                as: "hinhAnh",
                attributes: ["id", "url", "position"],
            },
        });

        res.json({
            message: "Cập nhật bài viết thành công",
            baiViet: baiVietFull,
        });
    } catch (error) {
        console.error("Lỗi cập nhật bài viết:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật bài viết", error: error.message });
    }
};

module.exports = {
    taoBaiViet,
    layBaiVietDaDuyet,
    layBaiChoDuyet,
    duyetBaiViet,
    tuChoiBaiViet,
    layTatCaBaiViet,
    capNhatBaiViet,
    layChiTietBaiViet,
    xoaBaiViet,
    layBaiVietLienQuan,
};
// update Sun Sep 28 00:34:04 SEAST 2025
