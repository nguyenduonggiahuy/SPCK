// Lấy phần tử input email từ DOM
const inpEmail = document.querySelector("#email");

// Lấy phần tử input password từ DOM
const inpPwd = document.querySelector("#password");

// Lấy phần tử form đăng nhập từ DOM
const loginForm = document.querySelector("#login-form");

// Lấy thời gian hiện tại (tính bằng milliseconds từ 1970 đến nay)
const now = new Date().getTime();

// Kiểm tra xem phiên đăng nhập có còn hiệu lực không
if (now < userSession?.expiry) {
    // Nếu phiên còn hiệu lực, chuyển hướng người dùng đến trang index.html
    window.location.href = "index.html";
}

// Hàm xử lý khi người dùng nhấn nút đăng nhập
function handleLogin(event) {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form (tải lại trang)

    // Lấy giá trị email và password từ ô input
    let email = inpEmail.value;
    let password = inpPwd.value;

    // Kiểm tra xem người dùng đã nhập đủ email và password chưa
    if (!email || !password) {
        alert("Vui lòng điền đủ các trường"); // Hiển thị thông báo nếu thiếu
        return; // Dừng lại không tiếp tục xử lý
    }

    // Gọi Firebase Auth để đăng nhập với email và password
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var user = userCredential.user;
            // Nếu đăng nhập thành công, lấy thông tin người dùng
            alert("Đăng nhập thành công"); // Hiển thị thông báo thành công

            // Tạo đối tượng user session để lưu thông tin đăng nhập
            const userSession = {
                user: user, // Lưu thông tin người dùng
                expiry: new Date().getTime() + 2 * 60 * 60 * 1000 // Phiên đăng nhập có hiệu lực trong 2 tiếng
            };

            // Lưu thông tin user vào localStorage dưới dạng chuỗi JSON
            localStorage.setItem('user_session', JSON.stringify(userSession));
            
            if (userSession) {
                var email = userSession.user.providerData[0].email;
                console.log(userSession.user.providerData[0].email);
            }

            db.collection("users").where("email", "==", email).get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        const user = doc.data();

                        // Nếu quyền khác 1 thì chuyển về trang index.html
                        if (user.role_id != 1) {
                            console.log("Permission denied!");
                            window.location.href = "../index.html";
                        }
                        else{
                            window.location.href = "./admin.html";
                        }
                    });
                })
                .catch((error) => {
                    console.error("Error: ", error);
                });
        })
        .catch((error) => {
            var errorCode = error.code; // Mã lỗi Firebase trả về
            var errorMessage = error.message; // Thông báo lỗi từ Firebase
            alert("Mật khẩu không đúng"); // Hiển thị lỗi (chưa xử lý hết các lỗi có thể xảy ra)
        });
}

// Gán sự kiện "submit" cho form đăng nhập, khi submit thì gọi hàm handleLogin
loginForm.addEventListener("submit", handleLogin);