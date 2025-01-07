import Cart from '../model/cart.js';
import mongoose from 'mongoose';

// Lấy giỏ hàng
export const getCart = async (req, res) => {
    const { userId } = req.session; // Lấy userId từ session
    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId'); // Populate để lấy thông tin sản phẩm
        res.json(cart || { items: [] });
    } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
        res.status(500).json({ message: "Đã xảy ra lỗi khi lấy giỏ hàng", error });
    }
};




export const updateCart = async (req, res) => {
    const { userId } = req.session; // Lấy userId từ session
    const { items } = req.body; // Lấy danh sách sản phẩm từ body

    if (!userId) {
        return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    try {
        // Kiểm tra dữ liệu
        if (!items || !Array.isArray(items) || items.some(item => !item.productId)) {
            return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ" });
        }

        // Chuyển đổi `productId` thành `ObjectId`
        const normalizedItems = items.map(item => ({
            productId: mongoose.Types.ObjectId(item.productId),
            quantity: item.quantity || 1,
        }));

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: normalizedItems });
        } else {
            cart.items = normalizedItems;
        }

        await cart.save();
        res.json({ message: "Cập nhật giỏ hàng thành công", cart });
    } catch (error) {
        console.error("Lỗi khi cập nhật giỏ hàng:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật giỏ hàng", error });
    }
};


// Xóa giỏ hàng
export const removeFromCart = async (req, res) => {
    const { userId } = req.session; // Lấy userId từ session
    const { productId } = req.body; // Lấy productId từ request body

    try {
        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại.' });
        }

        // Lọc bỏ sản phẩm cần xóa
        const initialItemCount = cart.items.length;
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        // Kiểm tra nếu sản phẩm không tồn tại trong giỏ hàng
        if (cart.items.length === initialItemCount) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng.' });
        }

        // Lưu lại giỏ hàng sau khi xóa
        await cart.save();

        return res.json({ message: 'Sản phẩm đã được xoá khỏi giỏ hàng.' });
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi, vui lòng thử lại sau.' });
    }
};

export const addToCart = async (req, res) => {
    const { userId } = req.session; // Lấy ID người dùng từ session
    const { productId, price } = req.body; // Lấy productId và price từ request body

    try {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Nếu chưa có giỏ hàng, tạo mới
            cart = new Cart({
                userId,
                items: [{ productId, price, quantity: 1 }],
            });
        } else {
            // Nếu đã có giỏ hàng, kiểm tra sản phẩm
            const existingItem = cart.items.find(
                (item) => item.productId.toString() === productId
            );

            if (existingItem) {
                // Tăng số lượng sản phẩm nếu đã tồn tại
                existingItem.quantity += 1;
            } else {
                // Thêm sản phẩm mới
                cart.items.push({ productId, price, quantity: 1 });
            }
        }

        await cart.save();
        res.status(200).json({ message: 'Thêm sản phẩm vào giỏ hàng thành công' });
    } catch (error) {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi, vui lòng thử lại sau.' });
    }
};
