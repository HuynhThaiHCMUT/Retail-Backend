export const AUTH_ERRORS = Object.freeze({
    MISSING_TOKEN_ERROR: {
        message:
            'Thông tin đăng nhập bị thiếu hoặc không hợp lệ, vui lòng thử lại',
        code: 'MISSING_TOKEN',
    },
    INVALID_TOKEN_ERROR: {
        message:
            'Thông tin đăng nhập bị thiếu hoặc không hợp lệ, vui lòng thử lại',
        code: 'INVALID_TOKEN',
    },
    EXPIRED_TOKEN_ERROR: {
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
        code: 'EXPIRED_TOKEN',
    },
    INVALID_REFRESH_TOKEN_ERROR: {
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
        code: 'INVALID_REFRESH_TOKEN',
    },
    uSER_NOT_FOUND_ERROR: {
        message: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND',
    },
    INVALID_CREDENTIALS_ERROR: {
        message: 'Số điện thoại hoặc mật khẩu không chính xác',
        code: 'INVALID_CREDENTIALS',
    },
    DUPPLICATE_PHONE_ERROR: {
        message: 'Số điện thoại đã được sử dụng',
        code: 'DUPPLICATE_PHONE',
    },
    NOT_STAFF_ERROR: {
        message: 'Bạn không có quyền truy cập tài nguyên này',
        code: 'NOT_STAFF',
    },
    MISSING_USER_ERROR: {
        message: 'Bạn không có quyền truy cập tài nguyên này',
        code: 'MISSING_USER',
    },
    NOT_ADMIN_SELF_ERROR: {
        message: 'Bạn không có quyền truy cập tài nguyên này',
        code: 'NOT_ADMIN_SELF',
    },
    NOT_ADMIN_ERROR: {
        message: 'Bạn không có quyền truy cập tài nguyên này',
        code: 'NOT_ADMIN',
    },
})
