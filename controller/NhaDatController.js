const LoaiNhaDat = require("../models/LoaiNhaDat");
const NhaDat = require("../models/NhaDat");
const HinhAnhNhaDat = require("../models/HinhAnhNhaDat")
const { Op, fn, col, where } = require("sequelize");
const sequelize = require("../config/database");
const { cloudinary } = require('../config/cloudinary');
const { validateFieldsNoSpecialChars } = require("../utils/validators")
exports.getAllNhaDat = async (req, res) => {
    try {
        const nhaDat = res.paginateResult;
        res.json(nhaDat);
    } catch (error) {
        console.error("Lỗi:", error);

        res.status(500).json({ error: "Lỗi khi lấy danh sách nhà đất" });
    }
};


exports.getNhaDatById = async (req, res) => {
    try {
        const { id } = req.params;
        const nhaDat = await NhaDat.findByPk(id,
            {
                include: [
                    {
                        model: LoaiNhaDat,
                        attributes: ['id', 'TenLoaiDat']
                    },
                    {

                        model: HinhAnhNhaDat,
                        as: 'hinhAnh',
                        attributes: ['url']
                    }
                ]
            }
        );

        if (!nhaDat) return res.status(404).json({ error: "Không tìm thấy nhà đất" });

        res.json(nhaDat);
    } catch (error) {
        console.error("Lỗi khi lấy nhà đất theo ID:", error);
        res.status(500).json({ error: "Lỗi khi lấy nhà đất" });
    }
};




 // Tạo nhà đất mới
        const newNhaDat = await NhaDat.create({
            MaNhaDat,
            TenNhaDat,
            ThanhPho,
            Quan,
            Phuong,
            Duong,
            SoNha,
            MoTa,
            GiaBan,
            DienTich,
            Huong,
            TrangThai: 1,
            LoaiNhaDat_id
        });




exports.addNhaDat = async (req, res) => {
    try {
        const {
            MaNhaDat,
            TenNhaDat,
            ThanhPho,
            Quan,
            Phuong,
            Duong,
            SoNha,
            MoTa,
            GiaBan,
            DienTich,
            Huong,
            LoaiNhaDat_id
        } = req.body;

        if (!MaNhaDat || !TenNhaDat) {
            return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
        }
        const fieldsToCheck = [MaNhaDat, TenNhaDat, ThanhPho, Quan, Phuong, Duong, SoNha, MoTa, Huong, GiaBan, DienTich];
        if (validateFieldsNoSpecialChars(fieldsToCheck)) {
            return res.status(400).json({ error: "Thông tin có chứa ký tự đặc biệt. Vui lòng thử lại!" });
        }
        const existingNhaDat = await NhaDat.findOne({ where: { MaNhaDat } });
        if (existingNhaDat) {
            return res.status(400).json({ message: "Mã nhà đất đã tồn tại" });
        }

       

        // Lưu ảnh vào bảng HinhAnhNhaDat
        if (req.files && req.files.length > 0) {
            const hinhAnhData = req.files.map((file) => ({
                url: file.path,
                idNhaDat: newNhaDat.id,
            }));

            await HinhAnhNhaDat.bulkCreate(hinhAnhData);
        }
        const hinhAnhList = await HinhAnhNhaDat.findAll({
            where: { idNhaDat: newNhaDat.id },
            attributes: ["url"]
        });

        res.status(201).json({
            message: "Thêm nhà đất thành công!",
            data: {
                ...newNhaDat.toJSON(),
                hinhAnh: hinhAnhList
            }
        });
    } catch (error) {
        console.error("Lỗi khi thêm nhà đất:", error);
        return res.status(500).json({ error: "Lỗi máy chủ" });
    }
};


exports.deleteNhaDat = async (req, res) => {
    try {
        const { id } = req.params;
        const nhaDat = await NhaDat.findByPk(id, {
            include: {
                model: HinhAnhNhaDat,
                as: "hinhAnh"
            }
        });
        if (!nhaDat) return res.status(404).json({ error: "Không tìm thấy nhà đất" });
        const hinhAnhList = nhaDat.hinhAnh;
        for (let hinhAnh of hinhAnhList) {
            const publicId = hinhAnh.url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        await nhaDat.destroy();

        return res.status(200).json({ message: "Xóa nhà đất thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa nhà đất:", error);
        return res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

exports.updateNhaDat = async (req, res) => {
    try {
        const { id } = req.params;
        const { MaNhaDat, TenNhaDat, ThanhPho, Quan, Phuong, Duong, SoNha, MoTa, Huong, GiaBan, DienTich, TrangThai } = req.body;

        const fieldsToCheck = [MaNhaDat, TenNhaDat, ThanhPho, Quan, Phuong, Duong, SoNha, MoTa, Huong, GiaBan, DienTich];
        if (validateFieldsNoSpecialChars(fieldsToCheck)) {
            return res.status(400).json({ error: "Thông tin có chứa ký tự đặc biệt. Vui lòng thử lại!" });
        }

        const nhaDat = await NhaDat.findByPk(id);
        if (!nhaDat) return res.status(404).json({ error: "Không tìm thấy nhà đất" });

        // Kiểm tra nếu MaNhaDat mới bị trùng với một nhà đất khác
        if (MaNhaDat) {
            const existingNhaDat = await NhaDat.findOne({ where: { MaNhaDat } });
            if (existingNhaDat && existingNhaDat.id !== Number(id)) {
                return res.status(400).json({ error: "Mã nhà đất đã tồn tại" });
            }
        }


        

        if (req.files && req.files.length > 0) {
            // Xoá ảnh cũ
            await HinhAnhNhaDat.destroy({ where: { idNhaDat: id } });

            const newHinhAnh = req.files.map(file => ({
                url: file.path, // hoặc file.url tùy config cloudinary
                idNhaDat: id,
            }));

            await HinhAnhNhaDat.bulkCreate(newHinhAnh);
        }

        // Cập nhật tất cả các trường trong req.body (trừ MaNhaDat đã xử lý riêng nếu cần)
        await nhaDat.update(req.body);
        const hinhAnhList = await HinhAnhNhaDat.findAll({
            where: { idNhaDat: id },
            attributes: ["url"]
        });
        res.status(200).json({
            message: "Cập nhật thành công!",
            data: {
                ...nhaDat.toJSON(),
                hinhAnh: hinhAnhList
            }
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật nhà đất:", error);
        return res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

exports.searchNhaDat = async (req, res) => {
    try {
        const {
            searchText,
            TenNhaDat,
            TenLoaiDat,
            ThanhPho,
            Quan,
            Phuong,
            Duong,
            GiaMin,
            GiaMax,
            DienTichMin,
            DienTichMax
        } = req.query;

        let whereClause = {};

        // Tìm kiếm theo searchText (LOWER cho case-insensitive)
        if (searchText) {
            const term = searchText.trim().toLowerCase();
            whereClause[Op.or] = [
                where(fn("LOWER", col("TenNhaDat")), { [Op.like]: `%${term}%` }),
                where(fn("LOWER", col("MoTa")), { [Op.like]: `%${term}%` }),
                where(fn("LOWER", col("ThanhPho")), { [Op.like]: `%${term}%` }),
                where(fn("LOWER", col("Quan")), { [Op.like]: `%${term}%` }),
                where(fn("LOWER", col("Phuong")), { [Op.like]: `%${term}%` }),
                where(fn("LOWER", col("Duong")), { [Op.like]: `%${term}%` })
            ];
        }

        // Các điều kiện lọc khác
        if (TenNhaDat) whereClause.TenNhaDat = { [Op.like]: `%${TenNhaDat}%` };
        if (ThanhPho) whereClause.ThanhPho = ThanhPho;
        if (Quan) whereClause.Quan = Quan;
        if (Phuong) whereClause.Phuong = Phuong;
        if (Duong) whereClause.Duong = Duong;

        // Giá
        const giaMinNum = parseFloat(GiaMin);
        const giaMaxNum = parseFloat(GiaMax);
        if (!isNaN(giaMinNum) || !isNaN(giaMaxNum)) {
            whereClause.GiaBan = {};
            if (!isNaN(giaMinNum)) whereClause.GiaBan[Op.gte] = giaMinNum;
            if (!isNaN(giaMaxNum)) whereClause.GiaBan[Op.lte] = giaMaxNum;
        }

        // Diện tích
        const dienTichMinNum = parseFloat(DienTichMin);
        const dienTichMaxNum = parseFloat(DienTichMax);
        if (!isNaN(dienTichMinNum) || !isNaN(dienTichMaxNum)) {
            whereClause.DienTich = {};
            if (!isNaN(dienTichMinNum)) whereClause.DienTich[Op.gte] = dienTichMinNum;
            if (!isNaN(dienTichMaxNum)) whereClause.DienTich[Op.lte] = dienTichMaxNum;
        }

        // Loại nhà đất
        const loaiNhaDatClause = {};
        if (TenLoaiDat) {
            loaiNhaDatClause.TenLoaiDat = { [Op.like]: `%${TenLoaiDat}%` };
        }

        const nhaDat = await NhaDat.findAll({
            where: whereClause,
            include: [
                {
                    model: LoaiNhaDat,
                    attributes: ["id", "TenLoaiDat"],
                    where: Object.keys(loaiNhaDatClause).length > 0 ? loaiNhaDatClause : undefined
                },
                {
                    model: HinhAnhNhaDat,
                    as: 'hinhAnh',
                    attributes: ['url']
                }
            ]
        });

        if (nhaDat.length === 0) {
            return res.status(200).json({
                message: "Không tìm thấy nhà đất phù hợp.",
                data: []
            });
        }

        return res.status(200).json({
            message: "Tìm kiếm thành công.",
            data: nhaDat
        });

    } catch (error) {
        console.error("Lỗi khi tìm kiếm nhà đất:", error);
        return res.status(500).json({ error: "Lỗi khi tìm kiếm nhà đất" });
    }
};
exports.getRelatedNhaDat = async (req, res) => {
    try {
        const { id } = req.params;
        const propertyId = parseInt(id, 10);

        if (isNaN(propertyId)) {
            return res.status(400).json({ error: "ID không hợp lệ, phải là số nguyên" });
        }

        const currentProperty = await NhaDat.findByPk(propertyId);
        if (!currentProperty) {
            return res.status(404).json({ error: "Không tìm thấy bất động sản" });
        }

        let whereClause = {
            id: { [Op.ne]: propertyId },
            TrangThai: 1,
            LoaiNhaDat_id: currentProperty.LoaiNhaDat_id,
        };

        // Điều kiện 1: đủ loại + giá + khu vực
        if (currentProperty.GiaBan) {
            whereClause.GiaBan = {
                [Op.between]: [
                    currentProperty.GiaBan * 0.8,
                    currentProperty.GiaBan * 1.2,
                ],
            };
        }

        if (currentProperty.ThanhPho || currentProperty.Quan) {
            whereClause[Op.or] = [];
            if (currentProperty.ThanhPho) {
                whereClause[Op.or].push({ ThanhPho: currentProperty.ThanhPho });
            }
            if (currentProperty.Quan) {
                whereClause[Op.or].push({ Quan: currentProperty.Quan });
            }
        }

        let relatedProperties = await NhaDat.findAll({
            where: whereClause,
            limit: 4,
            include: [
                { model: LoaiNhaDat, attributes: ["id", "TenLoaiDat"] },
                { model: HinhAnhNhaDat, as: "hinhAnh", attributes: ["url"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        // Nếu không tìm thấy, fallback tìm theo loại + thành phố
        if (relatedProperties.length === 0) {
            let fallbackWhere = {
                id: { [Op.ne]: propertyId },
                TrangThai: 1,
                LoaiNhaDat_id: currentProperty.LoaiNhaDat_id,
                ThanhPho: currentProperty.ThanhPho,
            };

            relatedProperties = await NhaDat.findAll({
                where: fallbackWhere,
                limit: 4,
                include: [
                    { model: LoaiNhaDat, attributes: ["id", "TenLoaiDat"] },
                    { model: HinhAnhNhaDat, as: "hinhAnh", attributes: ["url"] },
                ],
                order: [["createdAt", "DESC"]],
            });
        }

        // Nếu vẫn không có thì chỉ tìm theo loại
        if (relatedProperties.length === 0) {
            let fallbackWhere = {
                id: { [Op.ne]: propertyId },
                TrangThai: 1,
                LoaiNhaDat_id: currentProperty.LoaiNhaDat_id,
                ThanhPho: currentProperty.ThanhPho,
            };

            relatedProperties = await NhaDat.findAll({
                where: fallbackWhere,
                limit: 4,
                include: [
                    { model: LoaiNhaDat, attributes: ["id", "TenLoaiDat"] },
                    { model: HinhAnhNhaDat, as: "hinhAnh", attributes: ["url"] },
                ],
                order: [["createdAt", "DESC"]],
            });
        }

        return res.status(200).json({
            message:
                relatedProperties.length > 0
                    ? "Lấy bất động sản liên quan thành công"
                    : "Không tìm thấy bất động sản liên quan",
            data: relatedProperties,
        });
    } catch (error) {
        console.error("Chi tiết lỗi:", error);
        res.status(500).json({
            error: "Lỗi khi lấy nhà đất",
            details: error.message,
        });
    }
};