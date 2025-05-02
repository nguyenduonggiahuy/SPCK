// Lấy phần tử có class "order-list" để hiển thị danh sách đơn hàng
const orderList = document.querySelector('.order-list');

// Gọi hàm kiểm tra phiên đăng nhập của người dùng
checkSession();

function getOrderList() {
    // Lấy email của người dùng từ session (nếu tồn tại)
    let authorEmail = userSession?.user.email;
    let htmls = ""; // Chuỗi HTML để chứa danh sách đơn hàng

    // Truy vấn Firestore để lấy danh sách đơn hàng của user đang đăng nhập
    db.collection("orders").where("author", "==", authorEmail)
        .get() // phương thức của Firestore dùng để truy vấn và lấy dữ liệu từ một collection hoặc document.
        .then((querySnapshot) => {
            // Lặp qua từng đơn hàng lấy được từ Firestore
            querySnapshot.forEach((doc) => {
                const orderItem = doc.data(); // Lấy dữ liệu đơn hàng
                console.log(orderItem); // In ra console để kiểm tra dữ liệu

                // Chuyển đổi timestamp từ Firestore thành đối tượng Date
                const createdAt = orderItem.createdAt.toDate();
                // Cấu hình định dạng thời gian theo múi giờ Việt Nam
                const options = { 
                    timeZone: 'Asia/Ho_Chi_Minh', 
                    hour12: false, 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                };
                // Định dạng ngày tháng theo chuẩn Việt Nam
                const formattedDate = createdAt.toLocaleString('vi-VN', options);

                // Xử lý trạng thái đơn hàng
                let statusString = "";
                let cancelButton = ""; // Khởi tạo biến chứa nút hủy đơn hàng

                if (orderItem.status == 0) {
                    statusString = "Chờ xác nhận";
                    // Nếu đơn hàng chưa xác nhận, hiển thị nút hủy đơn
                    cancelButton = `<button class="btn btn-danger btn-cancel" 
                        data-author="${orderItem.author}" 
                        data-order-id="${doc.id}" 
                        data-order-price="${orderItem.product.price * parseInt(orderItem.quantity)}">Hủy đơn</button>`;
                } else if (orderItem.status == 1) {
                    statusString = "Chờ vận chuyển";
                } else if (orderItem.status == 2) {
                    statusString = "Đã nhận hàng";
                } else {
                    statusString = "Đã hủy";
                }

                // Tạo chuỗi HTML để hiển thị đơn hàng
                htmls += `
                    <div class="order-item shadow-md mt-2">
                        <div class="d-flex align-items-center px-2">
                            <img class="rounded-md" src="${orderItem.product.image}" alt="${orderItem.product.name}">
                            <div class="content p-2" style="flex: 50%">
                                <h6>${orderItem.product.name}</h6>
                                <p>Tổng tiền: ${orderItem.product.price * parseInt(orderItem.quantity)}</p>
                                <p>Ngày đặt: ${formattedDate}</p>
                                <p>Trạng thái: <i>${statusString}</i></p>
                            </div>
                            <div class="actions">
                                ${cancelButton} <!-- Hiển thị nút hủy nếu cần -->
                            </div>
                        </div>
                    </div>
                `;
            });

            // Gán nội dung danh sách đơn hàng vào phần tử HTML
            orderList.innerHTML = htmls;

            // Thêm sự kiện click cho tất cả các nút hủy đơn hàng
            document.querySelectorAll('.btn-cancel').forEach((button) => {
                button.addEventListener('click', function() {
                    // Lấy thông tin đơn hàng từ thuộc tính data của nút hủy
                    const orderId = this.getAttribute('data-order-id');
                    const author = this.getAttribute('data-author');
                    const orderPrice = parseFloat(this.getAttribute('data-order-price'));

                    // Hỏi xác nhận trước khi hủy đơn hàng
                    if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
                        // Cập nhật trạng thái đơn hàng thành 'đã hủy' (status = 3)
                        db.collection("orders").doc(orderId).update({
                            status: 3
                        })
                        .then(() => {
                            // Tìm kiếm user trong Firestore để cập nhật số dư ví
                            return db.collection("users").where("email", "==", author).get();
                        })
                        .then((querySnapshot) => {
                            // Nếu tìm thấy user
                            if (!querySnapshot.empty) {
                                const userDoc = querySnapshot.docs[0]; // Lấy tài liệu user đầu tiên
                                const userData = userDoc.data(); // Lấy dữ liệu user
                                const newBalance = userData.balance + orderPrice; // Cộng lại tiền vào số dư ví

                                // Cập nhật số dư ví của user trong Firestore
                                return db.collection("users").doc(userDoc.id).update({
                                    balance: newBalance
                                });
                            } else {
                                throw new Error("User không tồn tại");
                            }
                        })
                        .then(() => {
                            alert("Hủy đơn hàng thành công và số dư ví đã được cập nhật.");
                            getOrderList(); // Cập nhật lại danh sách đơn hàng
                        })
                        .catch((error) => {
                            alert("Lỗi hủy đơn hàng.");
                            console.error("Error cancelling order: ", error);
                        });
                    }
                });
            });
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
}

// Gọi hàm để lấy danh sách đơn hàng khi trang được tải
getOrderList();