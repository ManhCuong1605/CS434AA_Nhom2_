const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");
const { verifyToken, checkRole } = require("../middlewares/authMiddleware");
const paginate = require("../utils/PhanTrang");
const User = require("../models/User");

// Chỉ ADMIN mới có quyền truy cập các API này

router.get("/", verifyToken, checkRole(["ADMIN"]), paginate(User), userController.getAllUsers);
router.get("/:id", verifyToken, checkRole(["ADMIN"]), userController.getUserById);
// router.post("/addUser", verifyToken, checkRole(["ADMIN"]), userController.addUser);
// router.put("/:id", verifyToken, checkRole(["ADMIN"]), userController.updateUser);
router.post("/addUser", verifyToken, checkRole(["ADMIN"]), userController.addUser);

router.put("/:id", verifyToken, checkRole(["ADMIN"]), userController.updateUser);

module.exports = router;
