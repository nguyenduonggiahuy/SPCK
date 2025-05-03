// Lấy phần tử chứa danh sách đơn hàng
const orderList = document.getElementById('orderList');
const orderProductContainer = document.getElementById('orderProduct');

// Gọi hàm kiểm tra phiên đăng nhập
checkSession();

// Hàm lấy tham số từ URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        productId: params.get('productId'),
        name: params.get('name'),
        price: params.get('price'),
        quantity: params.get('quantity') || 1, // Mặc định số lượng là 1
        image: params.get('image')
    };
}

// Hiển thị sản phẩm đang đặt
function displayOrderProduct() {
    if (!orderProductContainer) return;
    
    const params = getUrlParams();
    console.log(params)
    
    if (params.productId) {
        const totalPrice = params.price * params.quantity;
        orderProductContainer.innerHTML = `
            <div class="order-product-card mb-4">
                <h4 class="mb-3">Sản phẩm đang đặt</h4>
                <div class="d-flex align-items-center p-3 bg-white rounded shadow-sm">
                    <img src="../${params.image}" alt="${params.name}" class="me-3" style="width:80px;height:80px;object-fit:cover;border-radius:5px;">
                    <div class="flex-grow-1">
                        <h5 class="mb-1">${params.name}</h5>
                        <p class="mb-1">Giá: ${parseInt(params.price).toLocaleString('vi-VN')}đ</p>
                        <p class="mb-1">Số lượng: ${params.quantity}</p>
                        <p class="mb-0 fw-bold">Thành tiền: ${totalPrice.toLocaleString('vi-VN')}đ</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Hàm tạo đơn hàng mới
async function createOrder(orderData) {
    try {
        // Thêm thông tin người đặt và thời gian
        orderData.author = userSession.user.email;
        orderData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        orderData.status = 0; // Trạng thái mặc định: Chờ xác nhận

        // Thêm đơn hàng vào Firestore
        const docRef = await db.collection("orders").add(orderData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating order: ", error);
        throw error;
    }
}

// Hàm xử lý khi submit form đặt hàng
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    if (!userSession) {
        alert('Vui lòng đăng nhập để đặt hàng');
        window.location.href = './login.html';
        return;
    }

    const params = getUrlParams();
    if (!params.productId) {
        alert('Không có sản phẩm để đặt hàng');
        return;
    }

    const formData = new FormData(e.target);
    const orderData = {
        items: [{
            id: params.productId,
            name: params.name,
            price: parseInt(params.price),
            quantity: parseInt(params.quantity),
            image: params.image
        }],
        total: parseInt(params.price) * parseInt(params.quantity),
        customerInfo: {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            note: formData.get('note')
        }
    };

    try {
        // Hiển thị loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Đang xử lý...';
        submitBtn.disabled = true;

        // Tạo đơn hàng
        const orderId = await createOrder(orderData);
        
        alert(`Đặt hàng thành công! Mã đơn hàng: #${orderId.substring(0, 5).toUpperCase()}`);
        window.location.href = `./orders.html`; // Chuyển đến trang danh sách đơn hàng
        
    } catch (error) {
        alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
        console.error(error);
    }
}

// Hàm hiển thị danh sách đơn hàng
function getOrderList() {
    if (!orderList) return;

    const authorEmail = userSession?.user.email;
    
    if (!authorEmail) {
        orderList.innerHTML = `
            <div class="no-orders">
                <div class="no-orders-icon">
                    <i class="fas fa-coffee"></i>
                </div>
                <h4>Vui lòng đăng nhập để xem đơn hàng</h4>
                <a href="./login.html" class="btn btn-primary mt-3">Đăng nhập</a>
            </div>
        `;
        return;
    }

    // Hiển thị loading
    orderList.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Đang tải đơn hàng...</p>
        </div>
    `;

    db.collection("orders")
        .where("author", "==", authorEmail)
        .orderBy("createdAt", "desc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                orderList.innerHTML = `
                    <div class="no-orders">
                        <div class="no-orders-icon">
                            <i class="fas fa-coffee"></i>
                        </div>
                        <h4>Bạn chưa có đơn hàng nào</h4>
                        <p>Hãy thưởng thức những món ngon của chúng tôi</p>
                        <a href="./index.html" class="btn btn-primary mt-3">Đặt hàng ngay</a>
                    </div>
                `;
                return;
            }

            let htmls = '';
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const createdAt = order.createdAt?.toDate() || new Date();
                
                const formattedDate = createdAt.toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                // Xác định trạng thái đơn hàng
                const statusInfo = getStatusInfo(order.status);
                
                // Tính tổng và tạo danh sách sản phẩm
                let total = 0;
                let itemsHtml = order.items.map(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    return `
                        <div class="order-item d-flex justify-content-between mb-2">
                            <div>
                                <span>${item.name}</span>
                                <small class="text-muted d-block">x${item.quantity}</small>
                            </div>
                            <span>${itemTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                    `;
                }).join('');

                // Nút hủy đơn (nếu có thể)
                const cancelBtn = order.status === 0 ? `
                    <button class="btn btn-sm btn-outline-danger btn-cancel mt-2" 
                        data-order-id="${doc.id}">
                        <i class="fas fa-times me-1"></i> Hủy đơn
                    </button>
                ` : '';

                htmls += `
                    <div class="order-card mb-4">
                        <div class="order-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Đơn hàng #${doc.id.substring(0, 5).toUpperCase()}</h5>
                            <span class="order-status ${statusInfo.class}">${statusInfo.text}</span>
                        </div>
                        <p class="order-date text-muted mb-3"><i class="far fa-calendar-alt me-2"></i>${formattedDate}</p>
                        
                        <div class="order-detail">
                            ${itemsHtml}
                            <div class="order-total d-flex justify-content-between mt-3 pt-2 border-top">
                                <span class="fw-bold">Tổng cộng:</span>
                                <span class="fw-bold text-primary">${total.toLocaleString('vi-VN')}đ</span>
                            </div>
                            
                            <div class="customer-info mt-3 pt-2 border-top">
                                <p class="mb-1"><small class="text-muted">Người nhận:</small> ${order.customerInfo?.name}</p>
                                <p class="mb-1"><small class="text-muted">Điện thoại:</small> ${order.customerInfo?.phone}</p>
                                <p class="mb-0"><small class="text-muted">Địa chỉ:</small> ${order.customerInfo?.address}</p>
                                ${order.customerInfo?.note ? `<p class="mt-2"><small class="text-muted">Ghi chú:</small> ${order.customerInfo.note}</p>` : ''}
                            </div>
                            
                            ${cancelBtn}
                        </div>
                    </div>
                `;
            });

            orderList.innerHTML = htmls;
            setupCancelButtons();
        })
        .catch(error => {
            console.error("Error getting orders: ", error);
            orderList.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Đã xảy ra lỗi khi tải đơn hàng. Vui lòng thử lại sau.
                </div>
            `;
        });
}

// Hàm xử lý trạng thái đơn hàng
function getStatusInfo(status) {
    switch(status) {
        case 0: return { class: 'status-pending', text: 'Chờ xác nhận' };
        case 1: return { class: 'status-delivering', text: 'Đang giao' };
        case 2: return { class: 'status-completed', text: 'Hoàn thành' };
        case 3: return { class: 'status-cancelled', text: 'Đã hủy' };
        default: return { class: 'status-pending', text: 'Chờ xử lý' };
    }
}

// Hàm thiết lập sự kiện cho nút hủy đơn
function setupCancelButtons() {
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Đang xử lý...';
                btn.disabled = true;
                
                db.collection("orders").doc(orderId).update({
                    status: 3,
                    cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    alert('Đã hủy đơn hàng thành công!');
                    getOrderList();
                })
                .catch(error => {
                    alert('Có lỗi xảy ra khi hủy đơn hàng');
                    console.error(error);
                    btn.innerHTML = '<i class="fas fa-times me-1"></i> Hủy đơn';
                    btn.disabled = false;
                });
            }
        });
    });
}

// Khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    displayOrderProduct();
    getOrderList();
    
    // Gắn sự kiện submit form (nếu có)
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
});