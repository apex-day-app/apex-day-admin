// =======================================================
// === FIREBASE CONFIG (Same as main app) ===
// =======================================================

const firebaseConfig = {
    apiKey: "AIzaSyB2dTlbmwvlGu-DJXsd3sAIHJMQo8cEnXg",
    authDomain: "apex-day-game.firebaseapp.com",
    projectId: "apex-day-game",
    storageBucket: "apex-day-game.firebasestorage.app",
    messagingSenderId: "455504824293",
    appId: "1:455504824293:web:d4fe81e8944f138592910c",
    measurementId: "G-CPNZTBTY48"
};

// Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// =======================================================
// === ADMIN LOGIN ===
// =======================================================

const ADMIN_PASSWORD = "apex2026"; // तुम अपना पासवर्ड सेट कर सकते हो

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        loadAllData();
    } else {
        alert('❌ Wrong password!');
    }
}

// =======================================================
// === LOAD ALL DATA ===
// =======================================================

let allUsers = [];
let allTransactions = [];
let allBets = [];

function loadAllData() {
    loadUsers();
    loadTransactions();
    loadBets();
    updateStats();
}

// Load Users
function loadUsers() {
    db.collection('users').get().then(snapshot => {
        allUsers = [];
        snapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        displayUsers();
        updateStats();
    }).catch(error => {
        console.error('Error loading users:', error);
    });
}

// Load Transactions
function loadTransactions() {
    db.collection('transactions').orderBy('timestamp', 'desc').get().then(snapshot => {
        allTransactions = [];
        snapshot.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data() });
        });
        displayDeposits();
        displayWithdrawals();
        updateStats();
    }).catch(error => {
        console.error('Error loading transactions:', error);
    });
}

// Load Bets
function loadBets() {
    db.collection('user_bets').orderBy('timestamp', 'desc').limit(100).get().then(snapshot => {
        allBets = [];
        snapshot.forEach(doc => {
            allBets.push({ id: doc.id, ...doc.data() });
        });
        displayBets();
    }).catch(error => {
        console.error('Error loading bets:', error);
    });
}

// =======================================================
// === DISPLAY FUNCTIONS ===
// =======================================================

function displayUsers() {
    const tbody = document.getElementById('users-body');
    tbody.innerHTML = '';
    
    allUsers.forEach(user => {
        const date = user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        const bankCount = user.bank_accounts ? user.bank_accounts.length : 0;
        
        tbody.innerHTML += `
            <tr>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.userId || 'N/A'}</td>
                <td>
                    <div class="balance-edit">
                        <span>₹${Math.floor(user.balance || 0)}</span>
                        <button class="action-btn" onclick="editBalance('${user.id}', ${user.balance || 0})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
                <td>${bankCount} account(s)</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn" onclick="viewUserDetails('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function displayDeposits() {
    const tbody = document.getElementById('deposits-body');
    const deposits = allTransactions.filter(t => t.type === 'deposit');
    
    if (deposits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No deposits found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    deposits.forEach(tx => {
        const date = tx.timestamp ? new Date(tx.timestamp.seconds * 1000).toLocaleString() : 'N/A';
        const statusClass = tx.status === 'Pending' ? 'pending' : 'completed';
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${tx.userName || 'N/A'}</td>
                <td>${tx.userGameId || 'N/A'}</td>
                <td>₹${Math.floor(tx.amount || 0)}</td>
                <td>${tx.transactionId || 'N/A'}</td>
                <td><span class="${statusClass}">${tx.status || 'Pending'}</span></td>
                <td>
                    ${tx.status === 'Pending' ? `
                        <button class="action-btn" onclick="approveDeposit('${tx.id}', ${tx.amount}, '${tx.userId}')">
                            ✅ Approve
                        </button>
                        <button class="action-btn reject-btn" onclick="rejectTransaction('${tx.id}')">
                            ❌ Reject
                        </button>
                    ` : '✓ Done'}
                </td>
            </tr>
        `;
    });
}

function displayWithdrawals() {
    const tbody = document.getElementById('withdrawals-body');
    const withdrawals = allTransactions.filter(t => t.type === 'withdraw');
    
    if (withdrawals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No withdrawals found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    withdrawals.forEach(tx => {
        const date = tx.timestamp ? new Date(tx.timestamp.seconds * 1000).toLocaleString() : 'N/A';
        const statusClass = tx.status === 'Pending' ? 'pending' : 'completed';
        const bank = tx.bankDetails || {};
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${tx.userName || 'N/A'}</td>
                <td>${tx.userGameId || 'N/A'}</td>
                <td>₹${Math.floor(tx.amount || 0)}</td>
                <td>
                    ${bank.bankName || 'N/A'}<br>
                    <small>A/C: ****${bank.accountNumber ? bank.accountNumber.slice(-4) : ''}</small>
                </td>
                <td><span class="${statusClass}">${tx.status || 'Pending'}</span></td>
                <td>
                    ${tx.status === 'Pending' ? `
                        <button class="action-btn" onclick="approveWithdraw('${tx.id}')">
                            ✅ Mark as Paid
                        </button>
                    ` : '✓ Done'}
                </td>
            </tr>
        `;
    });
}

function displayBets() {
    const tbody = document.getElementById('bets-body');
    
    if (allBets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No bets found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    allBets.forEach(bet => {
        const date = bet.timestamp ? new Date(bet.timestamp.seconds * 1000).toLocaleString() : 'N/A';
        const resultColor = bet.result === 'Won' ? '#00C851' : bet.result === 'Lost' ? '#ff4444' : '#D4AF37';
        
        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${bet.userName || 'N/A'}</td>
                <td>${bet.userGameId || 'N/A'}</td>
                <td>${bet.color === 'green' ? '🟢 Green' : '🔵 Blue'}</td>
                <td>₹${Math.floor(bet.amount || 0)}</td>
                <td style="color: ${resultColor}">${bet.result || 'Pending'}</td>
            </tr>
        `;
    });
}

// =======================================================
// === ACTION FUNCTIONS ===
// =======================================================

function approveDeposit(txnId, amount, userId) {
    if (confirm('Approve this deposit? User balance will be updated.')) {
        // Update transaction status
        db.collection('transactions').doc(txnId).update({
            status: 'Completed'
        }).then(() => {
            // Add balance to user
            return db.collection('users').doc(userId).update({
                balance: firebase.firestore.FieldValue.increment(amount)
            });
        }).then(() => {
            alert('✅ Deposit approved!');
            loadAllData();
        }).catch(error => {
            alert('Error: ' + error.message);
        });
    }
}

function approveWithdraw(txnId) {
    if (confirm('Mark this withdrawal as paid? Make sure you have transferred the money.')) {
        db.collection('transactions').doc(txnId).update({
            status: 'Completed'
        }).then(() => {
            alert('✅ Withdrawal marked as paid!');
            loadAllData();
        }).catch(error => {
            alert('Error: ' + error.message);
        });
    }
}

function rejectTransaction(txnId) {
    if (confirm('Reject this transaction?')) {
        db.collection('transactions').doc(txnId).update({
            status: 'Rejected'
        }).then(() => {
            alert('Transaction rejected!');
            loadAllData();
        }).catch(error => {
            alert('Error: ' + error.message);
        });
    }
}

function editBalance(userId, currentBalance) {
    const newBalance = prompt('Enter new balance:', currentBalance);
    if (newBalance !== null) {
        db.collection('users').doc(userId).update({
            balance: parseFloat(newBalance)
        }).then(() => {
            alert('✅ Balance updated!');
            loadAllData();
        }).catch(error => {
            alert('Error: ' + error.message);
        });
    }
}

function updatePromoCode() {
    const newCode = document.getElementById('promo-code-value').value;
    // Save to Firestore settings collection
    alert('Promo code updated to: ' + newCode);
}

function updateBonus() {
    const newBonus = document.getElementById('bonus-amount').value;
    alert('Welcome bonus updated to: ₹' + newBonus);
}

function viewUserDetails(userId) {
    // Can open a modal with user's full details
    alert('View user details - Coming soon!');
}

// =======================================================
// === FILTER FUNCTIONS ===
// =======================================================

function filterDeposits() {
    const search = document.getElementById('deposit-search').value.toLowerCase();
    // Implement search logic
    displayDeposits();
}

function filterWithdrawals() {
    const search = document.getElementById('withdraw-search').value.toLowerCase();
    displayWithdrawals();
}

function filterUsers() {
    const search = document.getElementById('users-search').value.toLowerCase();
    // Implement search
    displayUsers();
}

function filterBets() {
    const search = document.getElementById('bets-search').value.toLowerCase();
    displayBets();
}

// =======================================================
// === TAB SWITCHING ===
// =======================================================

function showTab(tabName) {
    // Hide all tabs
    document.getElementById('deposits-tab').classList.add('hidden');
    document.getElementById('withdrawals-tab').classList.add('hidden');
    document.getElementById('users-tab').classList.add('hidden');
    document.getElementById('bets-tab').classList.add('hidden');
    document.getElementById('settings-tab').classList.add('hidden');
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    event.target.classList.add('active');
}

// =======================================================
// === STATS UPDATE ===
// =======================================================

function updateStats() {
    document.getElementById('total-users').textContent = allUsers.length;
    
    const pendingTxns = allTransactions.filter(t => t.status === 'Pending').length;
    document.getElementById('pending-txns').textContent = pendingTxns;
    
    // Today's bets
    const today = new Date();
    today.setHours(0,0,0,0);
    const todaysBets = allBets.filter(bet => {
        const betDate = bet.timestamp ? new Date(bet.timestamp.seconds * 1000) : null;
        return betDate && betDate >= today;
    }).length;
    document.getElementById('total-bets').textContent = todaysBets;
}

// Auto refresh every 30 seconds
setInterval(loadAllData, 30000);