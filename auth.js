'use strict';

// 認証管理機能

// デモ用ユーザーを初期化
function initializeDemoUser() {
  const users = getUsers();
  
  // 山田太郎のアカウント
  const demoUserName1 = '山田太郎';
  if (!users[demoUserName1]) {
    const demoUser1 = {
      id: 'demo001',
      name: demoUserName1,
      password: '0000'
    };
    users[demoUserName1] = demoUser1;
  }
  
  // 佐藤花子のアカウント
  const demoUserName2 = '佐藤花子';
  if (!users[demoUserName2]) {
    const demoUser2 = {
      id: 'demo002',
      name: demoUserName2,
      password: '0000'
    };
    users[demoUserName2] = demoUser2;
  }
  
  // 変更を保存
  localStorage.setItem('users', JSON.stringify(users));
}

// 初期化を実行
initializeDemoUser();

// ユーザー情報をlocalStorageに保存
function saveUser(user) {
  const users = getUsers();
  users[user.name] = user;
  localStorage.setItem('users', JSON.stringify(users));
}

// 全ユーザー情報を取得
function getUsers() {
  const usersJson = localStorage.getItem('users');
  return usersJson ? JSON.parse(usersJson) : {};
}

// ユーザーを検索
function findUser(name) {
  const users = getUsers();
  return users[name] || null;
}

// ログイン状態を保存
function setLoggedInUser(user) {
  sessionStorage.setItem('loggedInUser', JSON.stringify(user));
}

// ログイン中のユーザーを取得
function getLoggedInUser() {
  const userJson = sessionStorage.getItem('loggedInUser');
  return userJson ? JSON.parse(userJson) : null;
}

// ログアウト
function logout() {
  sessionStorage.removeItem('loggedInUser');
}

// ログイン確認
function isLoggedIn() {
  return getLoggedInUser() !== null;
}

// ログインユーザーのIDを取得
function getCurrentUserId() {
  const user = getLoggedInUser();
  return user ? user.id : null;
}
