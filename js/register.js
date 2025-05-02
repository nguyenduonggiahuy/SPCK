// Lấy các phần tử input của form đăng ký từ DOM
const inpUsername = document.querySelector("#inp-username"); // Ô nhập tên người dùng
const inpEmail = document.querySelector("#email"); // Ô nhập email
const inpPwd = document.querySelector("#password"); // Ô nhập mật khẩu
const inpConfirmPwd = document.querySelector("#cfpassword"); // Ô nhập lại mật khẩu để xác nhận
const registerForm = document.querySelector("#register-form"); // Lấy phần tử form đăng ký

// Hàm xử lý khi người dùng nhấn nút đăng ký
function handleRegister(event) {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form (không cho trang web bị tải lại)

    // Lấy giá trị từ các ô input
    let username = inpUsername.value;
    let email = inpEmail.value.toLowerCase();
    let password = inpPwd.value;
    let confirmPassword = inpConfirmPwd.value;
    let role_id = 2; // Mặc định người dùng có role_id = 2 (Guest), Admin sẽ có role_id = 1

    // Kiểm tra xem người dùng có để trống trường nào không
    if (!username || !email || !password || !confirmPassword) {
        alert("Vui lòng điền đủ các trường"); // Thông báo nếu có trường bị bỏ trống
        return; // Dừng hàm ngay lập tức
    }

    // Kiểm tra mật khẩu nhập lại có khớp không
    if (password !== confirmPassword) {
        alert("Mật khẩu không khớp"); // Hiển thị cảnh báo nếu mật khẩu không giống nhau
        return; // Dừng hàm
    }

    // Tạo tài khoản trên Firebase Authentication
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Tạo đối tượng userData chứa thông tin người dùng để lưu vào Firestore
            let userData = {
                username, // Lưu username
                email, // Lưu email
                password, // Lưu mật khẩu (thực tế không nên lưu mật khẩu ở Firestore!)
                role_id: role_id, // Lưu role_id (quyền của user)
                balance: 0 // Đặt số dư ví mặc định là 0
            };

            // Thêm dữ liệu người dùng vào Firestore (bảng "users")
            db.collection("users").add(userData)
                .then((docRef) => {
                    alert("Đăng ký thành công"); // Hiển thị thông báo khi đăng ký thành công
                    window.location.href = "login.html"; // Chuyển hướng sang trang đăng nhập
                    console.log("Document written with ID: ", docRef.id); // Log ID của user vừa tạo
                })
                .catch((error) => {
                    alert("Đăng ký thất bại"); // Hiển thị lỗi nếu không lưu được vào Firestore
                    console.error("Error adding document: ", error);
                });
        })
        .catch((error) => {
            var errorCode = error.code; // Mã lỗi từ Firebase (nếu có)
            var errorMessage = error.message; // Nội dung lỗi chi tiết
            alert(`Lỗi: ${errorMessage}`); // Hiển thị lỗi cho người dùng
            console.log(errorMessage); // Log lỗi ra console để kiểm tra
        });
} 

// Gắn sự kiện "submit" cho form, khi người dùng nhấn đăng ký sẽ gọi `handleRegister`
registerForm.addEventListener("submit", handleRegister);