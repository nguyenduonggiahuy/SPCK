// balance.js

// Hàm định dạng số tiền
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Hàm load số dư từ Firestore
function loadBalance() {
    const user = firebase.auth().currentUser;
    
    if (user) {
        db.collection("users").where("email", "==", user.email).get()
            .then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    querySnapshot.forEach((doc) => {
                        const userData = doc.data();
                        const balance = userData.balance || 0;
                        document.querySelector('.balance-number').textContent = formatCurrency(balance);
                    });
                } else {
                    console.log("Không tìm thấy thông tin người dùng");
                }
            })
            .catch((error) => {
                console.error("Lỗi khi lấy số dư:", error);
            });
    } else {
        alert("Vui lòng đăng nhập để sử dụng tính năng này");
        window.location.href = "login.html";
    }
}

// Hàm nạp tiền vào ví
function depositMoney(event) {
    event.preventDefault();
    
    const user = firebase.auth().currentUser;
    const cardNumber = document.getElementById('card-number').value;
    const bank = document.getElementById('bank-select').value;
    const amount = parseInt(document.getElementById('amount').value);
    
    // Kiểm tra hợp lệ
    if (!cardNumber || !bank || !amount) {
        alert("Vui lòng điền đầy đủ thông tin");
        return;
    }
    
    if (amount < 10000) {
        alert("Số tiền nạp tối thiểu là 10,000 VND");
        return;
    }
    
    if (user) {
        // Tìm user trong Firestore
        db.collection("users").where("email", "==", user.email).get()
            .then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    querySnapshot.forEach((doc) => {
                        const userRef = db.collection("users").doc(doc.id);
                        const currentBalance = doc.data().balance || 0;
                        const newBalance = currentBalance + amount;
                        
                        // Cập nhật số dư
                        userRef.update({
                            balance: newBalance
                        })
                        .then(() => {
                            alert(`Nạp tiền thành công ${formatCurrency(amount)}`);
                            loadBalance(); // Cập nhật lại số dư hiển thị
                            document.getElementById('balance-form').reset(); // Reset form
                        })
                        .catch((error) => {
                            console.error("Lỗi khi cập nhật số dư:", error);
                            alert("Có lỗi xảy ra khi nạp tiền");
                        });
                    });
                } else {
                    alert("Không tìm thấy thông tin người dùng");
                }
            })
            .catch((error) => {
                console.error("Lỗi khi tìm người dùng:", error);
                alert("Có lỗi xảy ra khi xử lý");
            });
    } else {
        alert("Vui lòng đăng nhập để sử dụng tính năng này");
        window.location.href = "login.html";
    }
}

// Khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Load số dư
            loadBalance();
            
            // Thêm sự kiện submit form
            document.getElementById('balance-form').addEventListener('submit', depositMoney);
        } else {
            alert("Vui lòng đăng nhập để sử dụng tính năng này");
            window.location.href = "login.html";
        }
    });
});