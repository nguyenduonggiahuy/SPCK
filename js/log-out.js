// Kiểm tra xem userSession có tồn tại không
if (userSession) {
    // Lấy thời gian hiện tại (tính bằng milliseconds từ 1970 đến nay)
    const now = new Date().getTime();

    // Kiểm tra xem phiên đăng nhập có còn hiệu lực không
    if (now < userSession.expiry) {
        // Gán sự kiện click cho nút đăng xuất
        document.getElementById('log-out').addEventListener('click', function () {
            // Hiển thị hộp thoại xác nhận đăng xuất
            if (confirm("Bạn có chắc chắn muốn đăng xuất")) {
                // Gọi Firebase Auth để đăng xuất
                firebase.auth().signOut().then(() => {
                    // Nếu đăng xuất thành công, xóa thông tin phiên người dùng khỏi localStorage
                    localStorage.removeItem('user_session');
                    // Chuyển hướng người dùng về trang đăng nhập
                    window.location.href = "index.html";
                }).catch((error) => {
                    // Xử lý lỗi nếu có
                    console.log("Lỗi đăng xuất");
                });
            }
        });
    }
}
