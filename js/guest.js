document.addEventListener('DOMContentLoaded', function() {
    const userSession = JSON.parse(localStorage.getItem('user_session'));
    const profileDropdown = document.querySelector('#author-menu-drd');
    const walletBtn = document.getElementById('wallet-btn');
    
    if (userSession) {
        const now = new Date().getTime();
        
        if (now < userSession.expiry) {
            // User is logged in - show wallet button
            walletBtn.style.display = 'block';
            
            // Update dropdown menu
            profileDropdown.innerHTML = `
                <li><span class="dropdown-item user-email">${userSession.user.providerData[0].email}</span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="order.html"><i class="fas fa-clipboard-list me-2"></i>Đơn hàng</a></li>
                <li><a class="dropdown-item" href="balance.html"><i class="fas fa-wallet me-2"></i>Ví tiền</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><button id="logout-btn" class="dropdown-item text-danger"><i class="fas fa-sign-out-alt me-2"></i>Đăng xuất</button></li>
            `;
            
            // Add logout event
            document.getElementById('logout-btn').addEventListener('click', function() {
                if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                    auth.signOut().then(() => {
                        localStorage.removeItem('user_session');
                        // Hide wallet button when logging out
                        walletBtn.style.display = 'none';
                        window.location.href = "index.html";
                    }).catch((error) => {
                        console.error("Lỗi đăng xuất:", error);
                        alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.");
                    });
                }
            });
        } else {
            // Session expired
            localStorage.removeItem('user_session');
            walletBtn.style.display = 'none';
        }
    } else {
        // No user session
        walletBtn.style.display = 'none';
    }
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (!user && userSession) {
            // User signed out in another tab
            localStorage.removeItem('user_session');
            walletBtn.style.display = 'none';
        } else if (user) {
            // User signed in from another tab
            walletBtn.style.display = 'block';
        }
    });
});