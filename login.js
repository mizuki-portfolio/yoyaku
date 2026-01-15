'use strict';

// ログインページの機能

// ログイン処理
function handleLogin() {
  const name = document.getElementById('loginName').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  // 入力チェック
  if (!name || !password) {
    showError('loginError', '使用責任者名とパスワードを入力してください。');
    return;
  }

  // ユーザーを検索
  const user = findUser(name);
  
  if (!user) {
    showError('loginError', '使用責任者名またはパスワードが正しくありません。');
    return;
  }

  // パスワードチェック
  if (user.password !== password) {
    showError('loginError', '使用責任者名またはパスワードが正しくありません。');
    return;
  }

  // ログイン成功
  setLoggedInUser(user);
  window.location.href = 'index.html';
}

// 新規登録処理
function handleRegister() {
  const name = document.getElementById('registerName').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const errorDiv = document.getElementById('registerError');

  // 入力チェック
  if (!name || !password || !passwordConfirm) {
    showError('registerError', 'すべての項目を入力してください。');
    return;
  }

  // パスワードの長さチェック
  if (password.length < 4) {
    showError('registerError', 'パスワードは4文字以上で設定してください。');
    return;
  }

  // パスワード確認
  if (password !== passwordConfirm) {
    showError('registerError', 'パスワードが一致しません。');
    return;
  }

  // 既存ユーザーチェック
  if (findUser(name)) {
    showError('registerError', 'この使用責任者名は既に登録されています。');
    return;
  }

  // ユーザー登録
  const userId = Date.now().toString(); // 簡易的なID生成
  const user = {
    id: userId,
    name: name,
    password: password
  };

  saveUser(user);
  
  // 登録成功後、自動ログイン
  setLoggedInUser(user);
  alert('登録が完了しました。');
  window.location.href = 'index.html';
}

// エラーメッセージを表示
function showError(elementId, message) {
  const errorDiv = document.getElementById(elementId);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// エラーメッセージをクリア
function clearError(elementId) {
  const errorDiv = document.getElementById(elementId);
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
  // 既にログインしている場合はリダイレクト
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // ログインボタン
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
  }

  // 登録ボタン
  const registerButton = document.getElementById('registerButton');
  if (registerButton) {
    registerButton.addEventListener('click', handleRegister);
  }

  // 新規登録フォーム表示
  const showRegisterButton = document.getElementById('showRegisterButton');
  if (showRegisterButton) {
    showRegisterButton.addEventListener('click', () => {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('registerForm').style.display = 'block';
      clearError('loginError');
    });
  }

  // 登録キャンセル
  const cancelRegisterButton = document.getElementById('cancelRegisterButton');
  if (cancelRegisterButton) {
    cancelRegisterButton.addEventListener('click', () => {
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
      document.getElementById('registerName').value = '';
      document.getElementById('registerPassword').value = '';
      document.getElementById('registerPasswordConfirm').value = '';
      clearError('registerError');
    });
  }

  // Enterキーでログイン
  document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });

  // Enterキーで登録
  document.getElementById('registerPasswordConfirm')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  });
});
