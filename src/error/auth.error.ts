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
