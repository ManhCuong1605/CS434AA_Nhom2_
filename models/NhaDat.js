const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NhaDat = sequelize.define("NhaDat", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,

    },
    MaNhaDat: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    TenNhaDat: {
        type: DataTypes.STRING(255),
        allowNull: false,
        
    },
    // Gộp địa chỉ vào chung model
    ThanhPho: DataTypes.STRING(30),
    Quan: DataTypes.STRING(30),
    Phuong: DataTypes.STRING(30),
    Duong: DataTypes.STRING(30),
    SoNha: DataTypes.STRING(6),

    MoTa: {
        type: DataTypes.TEXT,
    },
    GiaBan: {
        type: DataTypes.DECIMAL(15, 2),
    },
    DienTich: {
        type: DataTypes.FLOAT,
    },
    Huong: {
        type: DataTypes.STRING(50),
    },
    HinhAnh: {
        type: DataTypes.STRING,
    },
    TrangThai: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: "NhaDat",
    timestamps: true,
    indexes: [
        { unique: true, fields: ["MaNhaDat"] }
    ]
});

module.exports = NhaDat;
