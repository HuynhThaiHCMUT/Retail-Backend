export const ORDER_ERRORS = Object.freeze({
    PRODUCT_NOT_FOUND_ERROR: (id: string) => ({
        message: `Sản phẩm không tồn tại`,
        code: 'PRODUCT_NOT_FOUND',
        id,
    }),
    ORDER_PRODUCT_NOT_FOUND_ERROR: (id) => ({
        message: 'Sản phẩm trong đơn hàng không tồn tại',
        code: 'ORDER_PRODUCT_NOT_FOUND',
        id,
    }),
    UNIT_NOT_FOUND_ERROR: (name) => ({
        message: 'Đơn vị không tồn tại',
        code: 'UNIT_NOT_FOUND',
        name,
    }),
    PRODUCT_UNIT_NOT_FOUND_ERROR: (productId, unitName) => ({
        message: 'Đơn vị không tồn tại trên sản phẩm',
        code: 'PRODUCT_UNIT_NOT_FOUND',
        productId,
        unitName,
    }),
    ORDER_NOT_FOUND_ERROR: {
        message: `Đơn hàng không tồn tại`,
        code: 'ORDER_NOT_FOUND',
    },
    USER_NOT_FOUND_ERROR: {
        message: `Người dùng không tồn tại`,
        code: 'USER_NOT_FOUND',
    },
    USER_NOT_OWNER_ERROR: {
        message: 'Bạn không có quyền truy cập tài nguyên này',
        code: 'USER_IS_NOT_OWNER',
    },
    MISSING_CUSTOMER_INFO_ERROR: {
        message: 'Thông tin khách hàng bị thiếu hoặc không hợp lệ',
        code: 'MISSING_CUSTOMER_INFO',
    },
    ORDER_NOT_PENDING_ERROR: {
        message: 'Đơn hàng không ở trạng thái chờ xác nhận',
        code: 'ORDER_NOT_PENDING',
    },
    ORDER_ALREADY_DONE_ERROR: {
        message: 'Đơn hàng đã được xử lý',
        code: 'ORDER_ALREADY_DONE',
    },
})
