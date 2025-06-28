const API = window.location.origin; 
const token = () => localStorage.getItem('token');
const auth  = () => ({ 'Authorization': `Bearer ${token()}` });

function showSection(id) {
  // hide all “page” sections, then show #id
  document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function handleError(err) {
  alert(err.message || err);
  console.error(err);
}

// ───────────────────────────────────────────────────────────
//  AUTH: Register & Login
// ───────────────────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const body = {
      username: document.getElementById('regEmail').value,
      email:    document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
      phone:    document.getElementById('regPhone').value,
      role:     document.getElementById('regRole').value
    };
    const res = await fetch(`${API}/users`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);
    alert('Registered! Please log in.');
    showSection('loginSection');
  } catch (err) {
    handleError(err);
  }
});

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        email:    document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);

    // save token & user info
    localStorage.setItem('token',  json.token);
    localStorage.setItem('userId', json.userId);
    localStorage.setItem('role',   json.role);
    localStorage.setItem('username', json.username);

    // go to your dashboard
    initDashboard();
  } catch (err) {
    handleError(err);
  }
});

// ───────────────────────────────────────────────────────────
//  ON LOAD: decide which view to show
// ───────────────────────────────────────────────────────────
function initDashboard() {
  const userRole = localStorage.getItem('role');
  if (!userRole) {
    // not logged in
    showSection('loginSection');
  } else {
    // logged in → show appropriate dashboard
    switch (userRole) {
      case 'user':
        loadPassengerDashboard();
        break;
      case 'driver':
        loadDriverDashboard();
        break;
      case 'admin':
        loadAdminDashboard();
        break;
    }
  }
}

// toggle between login/register
document.getElementById('btnShowLogin').onclick    = () => showSection('loginSection');
document.getElementById('btnShowRegister').onclick = () => showSection('registerSection');

// if you have a “role” selector that reveals a car‑model input:
document.getElementById('regRole').addEventListener('change', e => {
  const showCar = e.target.value === 'driver';
  document.getElementById('carModelGroup').classList.toggle('hidden', !showCar);
});

// ───────────────────────────────────────────────────────────
//  PASSENGER FLOW
// ───────────────────────────────────────────────────────────
async function loadPassengerDashboard() {
  showSection('passengerDashboard');
  document.getElementById('passWelcome').innerText =
    `Welcome, ${localStorage.getItem('username')}!`;

  // load profile
  const uid = localStorage.getItem('userId');
  const profile = await fetch(`${API}/users/${uid}`, { headers: auth() })
    .then(r => r.json());
  document.getElementById('passEmail').innerText = profile.email;
  document.getElementById('passPhone').innerText = profile.phone;
  document.getElementById('passMemberSince').innerText = new Date(profile.createdAt).getFullYear();

  // load available drivers into <select id="passDriverSelect">
  const drivers = await fetch(`${API}/drivers/available`, { headers: auth() })
    .then(r => r.json());
  const sel = document.getElementById('passDriverSelect');
  sel.innerHTML = '<option value="">Choose driver</option>';
  drivers.forEach(d => {
    const o = document.createElement('option');
    o.value = d._id;
    o.text  = `${d.driverName} (${d.carModel})`;
    sel.append(o);
  });
}

// handle “Request Ride” submit
document.getElementById('passRideForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { ...auth(), 'Content-Type':'application/json' },
      body: JSON.stringify({
        driverId:    document.getElementById('passDriverSelect').value,
        pickup:      document.getElementById('passPickup').value,
        destination: document.getElementById('passDestination').value,
        price:       document.getElementById('passPrice').value
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);
    alert('Ride requested!');
  } catch (err) {
    handleError(err);
  }
});

// ───────────────────────────────────────────────────────────
//  DRIVER FLOW
// ───────────────────────────────────────────────────────────
async function loadDriverDashboard() {
  showSection('driverDashboard');
  document.getElementById('drvWelcome').innerText =
    `Hello, ${localStorage.getItem('username')}!`;
  
  // load profile
  const uid = localStorage.getItem('userId');
  const profile = await fetch(`${API}/drivers?userId=${uid}`, { headers: auth() })
    .then(r => r.json());
  if (profile.length) {
    const me = profile[0];
    document.getElementById('drvName').innerText      = me.driverName;
    document.getElementById('drvCarModel').innerText = me.carModel;
    document.getElementById('drvPhone').innerText     = me.phone;
    document.getElementById('drvEarnings').innerText = `RM${me.earnings.toFixed(2)}`;
  }

  // load incoming ride requests
  const orders = await fetch(`${API}/orders`, { headers: auth() })
    .then(r => r.json());
  const tbody  = document.getElementById('drvRequestsTable');
  tbody.innerHTML = '';
  orders.forEach(o => {
    if (o.driverId !== localStorage.getItem('userId')) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.username}</td>
      <td>${o.pickup}</td>
      <td>${o.destination}</td>
      <td>RM${o.price.toFixed(2)}</td>
      <td>
        <button class="btn btn-primary" data-id="${o._id}" data-action="complete">
          Complete
        </button>
      </td>
    `;
    tbody.append(tr);
  });

  // wire up “Complete” buttons
  tbody.querySelectorAll('button').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await fetch(`${API}/orders/${id}`, {
        method: 'PATCH',
        headers: { ...auth(), 'Content-Type':'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      loadDriverDashboard(); // refresh
    };
  });
}

// ───────────────────────────────────────────────────────────
//  ADMIN FLOW
// ───────────────────────────────────────────────────────────
async function loadAdminDashboard() {
  showSection('adminDashboard');
  
  // 1) User management
  const users = await fetch(`${API}/users`, { headers: auth() }).then(r => r.json());
  const tbodyU = document.getElementById('adminUsersTable');
  tbodyU.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u._id}</td>
      <td>${u.email}</td>
      <td>
        <button class="btn btn-outline" data-id="${u._id}" data-action="block">
          Block
        </button>
      </td>
    `;
    tbodyU.append(tr);
  });
  tbodyU.querySelectorAll('button').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await fetch(`${API}/admin/users/${id}`, {
        method: 'DELETE',
        headers: auth()
      });
      loadAdminDashboard();
    };
  });

  // 2) All orders
  const orders = await fetch(`${API}/orders`, { headers: auth() }).then(r => r.json());
  const tbodyO = document.getElementById('adminOrdersTable');
  tbodyO.innerHTML = '';
  orders.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o._id}</td>
      <td>${o.username}</td>
      <td>${o.driverName}</td>
      <td>RM${o.price.toFixed(2)}</td>
    `;
    tbodyO.append(tr);
  });

  // 3) Passenger analytics
  const analytics = await fetch(`${API}/analytics/passengers`, { headers: auth() })
    .then(r => r.json());
  const tbodyA = document.getElementById('adminAnalyticsTable');
  tbodyA.innerHTML = '';
  analytics.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.userId}</td>
      <td>${a.name}</td>
      <td>${a.totalRides}</td>
      <td>RM${a.totalEarnings.toFixed(2)}</td>
    `;
    tbodyA.append(tr);
  });
}

// ───────────────────────────────────────────────────────────
//  LOGOUT (shared by all roles)
// ───────────────────────────────────────────────────────────
document.querySelectorAll('.btnLogout').forEach(btn => {
  btn.onclick = () => {
    localStorage.clear();
    showSection('loginSection');
  };
});

// ───────────────────────────────────────────────────────────
//  Kick things off!
// ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', initDashboard);
