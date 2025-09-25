const { Sequelize } = require("sequelize");
const { NhaDat, LichHen, HinhAnhNhaDat } = require("../models/quanhe");


exports.getBatDongSanNoiBat = async (req, res) => {
    try {
        const topNhaDat = await NhaDat.findAll({
            where: { TrangThai: 1 }, // chỉ lấy chưa bán
            include: [
                {
                    
                    model: LichHen,
                    attributes: []
                }
            ],
            attributes: [
                "id",
                [Sequelize.fn("COUNT", Sequelize.col("LichHens.id")), "soLanDatLich"]
            ],
            group: ["NhaDat.id"],
            order: [[Sequelize.literal("soLanDatLich"), "DESC"]],
            limit: 8,
            subQuery: false
        });

        const ids = topNhaDat.map(n => n.id);
        const dsNoiBat = await NhaDat.findAll({
            where: { id: ids },
            include: [{ model: HinhAnhNhaDat, as: "hinhAnh", attributes: ["url"] }]
        });

        return res.json(dsNoiBat);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};