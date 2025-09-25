const express = require("express");
const router = express.Router();
const nhanVienController = require("../controller/NhanVienController");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");
router.get("/", nhanVienController.getAllNhanVien);
router.get("/:id", verifyToken, checkRole(["ADMIN"]), nhanVienController.getNhanVienById);
// router.post("/", verifyToken, checkRole(["ADMIN"]), nhanVienController.addNhanVien);
router.post("/", verifyToken, checkRole(["ADMIN"]), nhanVienController.addNhanVien);

// router.put("/:id", verifyToken, checkRole(["ADMIN"]), nhanVienController.updateNhanVien);
router.put("/:id", verifyToken, checkRole(["ADMIN"]), nhanVienController.updateNhanVien);

// router.delete("/:id", verifyToken, checkRole(["ADMIN"]), nhanVienController.deleteNhanVien);
router.delete("/:id", verifyToken, checkRole(["ADMIN"]), nhanVienController.deleteNhanVien);

module.exports = router;

