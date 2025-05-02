// Hiển thị danh sách sản phẩm
function getProductList(container, limit) {
    let htmls = ``; // Chuỗi HTML để chứa danh sách sản phẩm
    db.collection('products')
        .orderBy('createdAt', 'desc') // Lấy sản phẩm mới nhất trước
        .limit(limit) // Giới hạn số lượng sản phẩm lấy về
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const product = doc.data(); // Lấy dữ liệu sản phẩm từ Firestore
                const productId = doc.id; // Lấy ID của sản phẩm
                // Định dạng giá tiền theo đơn vị VNĐ
                const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
                
                // Tạo HTML hiển thị sản phẩm
                htmls += `
                    <div class="product-item col-md-3 col-6">
                        <div class="content">
                            <img src="${product.image}" alt="${product.name}">
                            <div class="text p-2">
                                <div class="d-flex justify-content-between">
                                    <h6>${product.name}</h6>
                                    <h6>${formattedPrice}</h6>
                                </div>
                                <button class="btn btn-primary btn-order" data-id=${productId}>Đặt hàng</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = htmls; // Gán danh sách sản phẩm vào container

            // Thêm sự kiện click cho các nút "Đặt hàng"
            let btnOrder = document.querySelectorAll('.btn-order');
            btnOrder.forEach(btn => {
                btn.addEventListener('click', function () {
                    const productId = this.getAttribute('data-id'); // Lấy ID sản phẩm từ thuộc tính data-id
                    checkSession(); // Kiểm tra phiên đăng nhập
                    showOrderForm(productId); // Hiển thị form đặt hàng
                });
            });
        })
        .catch((error) => {
            console.error("Error fetching products: ", error); // Xử lý lỗi khi lấy danh sách sản phẩm
        });
}

// Hiển thị form đặt hàng
function showOrderForm(productId) {
    let orderForm = document.querySelector(".order-form");
    orderForm.style.display = 'block'; // Hiển thị form đặt hàng

    // Lấy thông tin sản phẩm từ Firestore theo ID
    db.collection('products').doc(productId).get()
        .then((doc) => {
            if (doc.exists) { // Kiểm tra xem sản phẩm có tồn tại không
                const product = doc.data(); // Lấy dữ liệu sản phẩm
                const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
                
                // Cập nhật nội dung của form đặt hàng
                orderForm.innerHTML = `
                    <div class="content p-2 rounded-md">
                        <button class="btn text-black btn-cancel">Đóng</button>
                        <div class="row">
                            <div class="col-md-4 col-12">
                                <img src="${product.image}" alt="${product.name}">
                            </div>
                            <div class="col-md-8 col-12">
                                <h5>${product.name}</h5>
                                <p>Giá: ${formattedPrice}</p>
                                <form id="order-form">
                                    <div>
                                        <label for="quantity">Số lượng</label>
                                        <input type="number" id="quantity" value="1" min="1">
                                    </div>
                                    <button type="submit" class="btn btn-primary mt-4 btn-confirm-order" data-price=${product.price}>Xác nhận</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `;

                // Xử lý khi nhấn nút đóng form
                const btnCancel = orderForm.querySelector('.btn-cancel');
                btnCancel.addEventListener('click', function () {
                    orderForm.innerHTML = ''; // Xóa nội dung form
                    orderForm.style.display = 'none'; // Ẩn form
                });

                // Xử lý khi xác nhận đặt hàng
                const btnConfirmOrder = document.querySelector(".btn-confirm-order");
                btnConfirmOrder.addEventListener('click', function (e) {
                    e.preventDefault(); // Ngăn chặn hành động mặc định của form
                    const quantity = document.getElementById('quantity').value; // Lấy số lượng đặt hàng
                    const productPrice = this.getAttribute('data-price'); // Lấy giá sản phẩm
                    handleOrder(productId, quantity, productPrice); // Xử lý đặt hàng
                });
            } else {
                console.log("No such document!"); // Nếu không tìm thấy sản phẩm
            }
        })
        .catch((error) => {
            console.error("Error getting document: ", error); // Xử lý lỗi khi lấy dữ liệu sản phẩm
        });
}

// Xử lý đặt hàng
function handleOrder(productId, quantity, productPrice) {
    if (!userSession) {
        return; // Nếu chưa đăng nhập thì không xử lý
    }
    let authorEmail = userSession.user.email; // Lấy email của người đặt hàng
    db.collection("users").where("email", "==", authorEmail)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                // giúp tạo một bản sao mới thay vì tham chiếu trực tiếp đến dữ liệu từ Firestore.
                let author = { ...doc.data() }; // Lấy thông tin người dùng
                const totalCost = productPrice * quantity; // Tính tổng tiền
                
                // Kiểm tra số dư ví
                if (author.balance < totalCost) {
                    alert("Số dư ví không đủ!");
                    return;
                }
                
                // Lấy thông tin sản phẩm từ Firestore
                db.collection("products").doc(productId)
                    .get()
                    .then((doc) => {
                        const orderData = {
                            author: authorEmail, // Người đặt hàng
                            product: doc.data(), // Thông tin sản phẩm
                            quantity: quantity,
                            status: 0, // Trạng thái đơn hàng (0: chờ xử lý)
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        
                        // Lưu đơn hàng vào Firestore
                        db.collection('orders').add(orderData)
                            .then(() => {
                                return db.collection('users').where("email", "==", authorEmail).get();
                            })
                            .then((querySnapshot) => {
                                if (!querySnapshot.empty) {
                                    // Lấy tài liệu đầu tiên (vì email là duy nhất, nên chỉ có một kết quả)
                                    const userDoc = querySnapshot.docs[0];
                                    // userDoc.ref	Lấy tham chiếu đến tài liệu để có thể cập nhật hoặc xóa dữ liệu.
                                    // userDoc.data()	Lấy nội dung dữ liệu của tài liệu (chỉ đọc, không chỉnh sửa trực tiếp được).
                                    return userDoc.ref.update({
                                        balance: userDoc.data().balance - totalCost // Trừ số dư ví
                                    });
                                } else {
                                    throw new Error("Không tìm thấy người dùng.");
                                }
                            })
                            .then(() => {
                                alert("Đặt hàng thành công!");
                                document.querySelector(".order-form").style.display = 'none'; // Ẩn form đặt hàng
                            })
                            .catch((error) => {
                                console.error("Error placing order or updating balance: ", error);
                            });
                    })
                    .catch((error) => {
                        console.log("Error getting documents: ", error);
                    });
            });
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
}
