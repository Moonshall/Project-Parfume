const SESSION_KEY = 'famello_session_v1';

const accounts = {
  cashier: { username: 'kasir', password: '6767' },
  manager: { username: 'manager', password: '676767' }
};

const homeByRole = {
  cashier: '/kasir',
  manager: '/manager'
};

export function signIn(username, password) {
  const role = Object.keys(accounts).find(key => accounts[key].username === username.trim());
  if (!role || accounts[role].password !== password) return null;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role }));
  return role;
}

export function getSession() {
  const value = sessionStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    const session = JSON.parse(value);
    return session && Object.hasOwn(homeByRole, session.role) ? session : null;
  } catch {
    return null;
  }
}

export function getHomeForRole(role) {
  return homeByRole[role] || '/';
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
}
