'use strict';

// ログインチェック
if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

// 予約状態を管理するオブジェクト
// キー: "hour-court" (例: "8-A", "9-B")
const reservations = {};

// 現在の日付を取得
function getCurrentDate() {
  const dateInput = document.getElementById('clander');
  return dateInput ? dateInput.value : formatDate(new Date());
}

// 日付ごとの予約データをlocalStorageに保存
function saveReservationData() {
  const date = getCurrentDate();
  const tableBody = document.getElementById('tableBody');
  const rows = tableBody.querySelectorAll('tr');
  const confirmedReservations = {};
  
  // 確認済み（confirmed）のセルを取得
  for (let i = 0; i < rows.length; i++) {
    const hour = 8 + i;
    const courtACell = rows[i].cells[1];
    const courtBCell = rows[i].cells[2];
    
    if (courtACell && courtACell.classList.contains('confirmed')) {
      confirmedReservations[`${hour}-A`] = true;
    }
    if (courtBCell && courtBCell.classList.contains('confirmed')) {
      confirmedReservations[`${hour}-B`] = true;
    }
  }
  
  // 確認済みのセルごとに責任者情報を保存
  const confirmedReservationsWithUser = {};
  for (let i = 0; i < rows.length; i++) {
    const hour = 8 + i;
    const courtACell = rows[i].cells[1];
    const courtBCell = rows[i].cells[2];
    
    if (courtACell && courtACell.classList.contains('confirmed')) {
      const key = `${hour}-A`;
      const storedUserId = courtACell.getAttribute('data-user-id');
      confirmedReservationsWithUser[key] = {
        userId: storedUserId || getCurrentUserId()
      };
    }
    if (courtBCell && courtBCell.classList.contains('confirmed')) {
      const key = `${hour}-B`;
      const storedUserId = courtBCell.getAttribute('data-user-id');
      confirmedReservationsWithUser[key] = {
        userId: storedUserId || getCurrentUserId()
      };
    }
  }
  
  // 入力情報も保存
  const purposeTournament = document.getElementById('purposeTournament').classList.contains('selected');
  const purposeDetail = document.getElementById('purposeDetail').value;
  const currentUser = getLoggedInUser();
  const responsiblePerson = currentUser ? currentUser.name : '';
  const numberOfPeople = document.getElementById('numberOfPeople').value;
  
  const reservationData = {
    confirmedReservations: confirmedReservationsWithUser,
    purpose: purposeTournament ? '大会' : '大会以外',
    purposeDetail: purposeDetail,
    responsiblePerson: responsiblePerson,
    responsibleUserId: getCurrentUserId(),
    numberOfPeople: numberOfPeople
  };
  
  localStorage.setItem(`reservation_${date}`, JSON.stringify(reservationData));
}

// 日付ごとの予約データをlocalStorageから読み込み
function loadReservationData() {
  const date = getCurrentDate();
  const savedData = localStorage.getItem(`reservation_${date}`);
  
  if (!savedData) {
    // データがない場合は初期化
    clearReservations();
    updateFeeDisplay();
    return;
  }
  
  try {
    const reservationData = JSON.parse(savedData);
    
    // 確認済みの予約セルを復元
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    // まずすべてのセルをリセット
    clearReservations();
    
    // 確認済みのセルを復元
    for (const key in reservationData.confirmedReservations) {
      const reservation = reservationData.confirmedReservations[key];
      if (reservation) {
        const [hour, court] = key.split('-');
        const rowIndex = parseInt(hour) - 8;
        const cellIndex = court === 'A' ? 1 : 2;
        
        if (rows[rowIndex]) {
          const cell = rows[rowIndex].cells[cellIndex];
          cell.classList.add('confirmed');
          cell.classList.remove('reserved', 'available');
          // ユーザーIDを保存
          if (reservation.userId) {
            cell.setAttribute('data-user-id', reservation.userId);
          }
        }
      }
    }
    
    // 入力情報を復元（オプション）
    // 必要に応じて入力フィールドにも値を設定できます
    
    // 料金を更新
    updateFeeDisplay();
    
  } catch (e) {
    console.error('予約データの読み込みに失敗しました:', e);
    clearReservations();
    updateFeeDisplay();
  }
}

// 予約状態をクリア
function clearReservations() {
  const tableBody = document.getElementById('tableBody');
  const rows = tableBody.querySelectorAll('tr');
  
  for (let i = 0; i < rows.length; i++) {
    const hour = 8 + i;
    const courtACell = rows[i].cells[1];
    const courtBCell = rows[i].cells[2];
    
    if (courtACell) {
      courtACell.classList.remove('confirmed', 'reserved', 'available');
      courtACell.classList.add('available');
    }
    if (courtBCell) {
      courtBCell.classList.remove('confirmed', 'reserved', 'available');
      courtBCell.classList.add('available');
    }
  }
  
  // reservationsオブジェクトもクリア
  for (const key in reservations) {
    delete reservations[key];
  }
  
  // 料金を更新
  updateFeeDisplay();
}

// セルの表示を更新する関数
function updateCellDisplay(cell, hour, court) {
  const key = `${hour}-${court}`;
  const isReserved = reservations[key] || false;

  // クラスをリセット
  cell.classList.remove('available', 'reserved');

  // 予約状態に応じてクラスを追加
  if (isReserved) {
    cell.classList.add('reserved');
  } else {
    cell.classList.add('available');
  }
}

// 料金を計算して表示する関数
function updateFeeDisplay() {
  const feeDisplay = document.getElementById('feeDisplay');
  const cardsContainer = feeDisplay ? feeDisplay.querySelector('.fee-cards-container') : null;
  const totalFeeElement = document.getElementById('totalFee');
  const feeHeading = document.getElementById('feeHeading');
  
  if (!feeDisplay || !cardsContainer) return;
  
  // 選択された予約情報を取得（通常の選択）
  const selectedReservations = getSelectedReservations();
  
  // 選択中の予約のみを使用（確認済みの予約は選択対象外のため除外）
  const allReservations = [...selectedReservations];
  
  // ソート
  allReservations.sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.court.localeCompare(b.court);
  });
  
  // カードコンテナをクリア
  cardsContainer.innerHTML = '';
  
  // 予約が選択されていない場合は非表示
  if (allReservations.length === 0) {
    if (feeDisplay) {
      feeDisplay.style.display = 'none';
    }
    if (feeHeading) {
      feeHeading.style.display = 'none';
    }
    return;
  }
  
  // 表示する
  if (feeDisplay) {
    feeDisplay.style.display = 'block';
  }
  if (feeHeading) {
    feeHeading.style.display = 'block';
  }
  
  let totalFee = 0;
  const feePerHour = 500; // 1時間500円
  
  // コートごとに時間を集計
  const courtSummary = {};
  allReservations.forEach(res => {
    if (!courtSummary[res.court]) {
      courtSummary[res.court] = {
        totalHours: 0
      };
    }
    courtSummary[res.court].totalHours++;
  });
  
  // コート名でソート（Aコート、Bコートの順）
  const sortedCourts = Object.keys(courtSummary).sort();
  
  // コートごとの情報をHTMLで作成
  let courtDetailsHTML = '';
  sortedCourts.forEach(court => {
    const summary = courtSummary[court];
    const totalHours = summary.totalHours;
    const fee = totalHours * feePerHour;
    totalFee += fee;
    
    courtDetailsHTML += `
      <div class="fee-court-detail">
        <div class="fee-card-row">
          <span class="fee-label">コート名:</span>
          <span class="fee-value">${court}コート</span>
        </div>
        <div class="fee-card-row">
          <span class="fee-label">時間:</span>
          <span class="fee-value">${totalHours}時間</span>
        </div>
        <div class="fee-card-row">
          <span class="fee-label">料金:</span>
          <span class="fee-value">${fee.toLocaleString()}円</span>
        </div>
      </div>
    `;
  });
  
  // 1枚のカードを作成（中にコートごとの情報を表示）
  const card = document.createElement('div');
  card.className = 'fee-card';
  card.innerHTML = `
    <div class="fee-card-content">
      ${courtDetailsHTML}
    </div>
  `;
  cardsContainer.appendChild(card);
  
  // 合計料金を更新
  if (totalFeeElement) {
    totalFeeElement.textContent = totalFee.toLocaleString();
  }
}

// セルのクリックイベントハンドラ
function handleCellClick(hour, court) {
  const key = `${hour}-${court}`;
  const tableBody = document.getElementById('tableBody');
  const rows = tableBody.querySelectorAll('tr');
  const rowIndex = hour - 8; // 8時が0行目
  const cellIndex = court === 'A' ? 1 : 2; // Aコートは1列目、Bコートは2列目

  if (rows[rowIndex]) {
    const cell = rows[rowIndex].cells[cellIndex];
    
    // 確認済みのセルの場合は何もしない（キャンセル不可）
    if (cell.classList.contains('confirmed')) {
      return;
    }
    
    // 通常の予約状態を切り替え
    reservations[key] = !reservations[key];
    updateCellDisplay(cell, hour, court);
    // 料金を更新
    updateFeeDisplay();
  }
}

// テーブルを動的に生成する関数
function createReservationTable() {
  const tableBody = document.getElementById('tableBody');
  const startHour = 8; // 開始時間（8時）
  const endHour = 21; // 終了時間（21時）

  // テーブルの行を生成
  for (let hour = startHour; hour < endHour; hour++) {
    const row = document.createElement('tr');

    // 時間セル
    const timeCell = document.createElement('td');
    const nextHour = hour + 1;
    timeCell.textContent = `${hour.toString().padStart(2, '0')}:00-${nextHour.toString().padStart(2, '0')}:00`;
    row.appendChild(timeCell);

    // Aコートセル
    const courtACell = document.createElement('td');
    courtACell.classList.add('reservation-cell');
    courtACell.addEventListener('click', () => handleCellClick(hour, 'A'));
    updateCellDisplay(courtACell, hour, 'A');
    row.appendChild(courtACell);

    // Bコートセル
    const courtBCell = document.createElement('td');
    courtBCell.classList.add('reservation-cell');
    courtBCell.addEventListener('click', () => handleCellClick(hour, 'B'));
    updateCellDisplay(courtBCell, hour, 'B');
    row.appendChild(courtBCell);

    tableBody.appendChild(row);
  }
}

// 日付をフォーマットする関数
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 日付入力フィールドに日付を設定する関数
function setDateInput(date) {
  const dateInput = document.getElementById('clander');
  if (dateInput) {
    dateInput.value = formatDate(date);
  }
}

// 今日の日付を取得して日付入力フィールドに設定する関数
function setTodayDate() {
  const today = new Date();
  setDateInput(today);
}

// 日付を一日前に変更する関数
function changeToPrevDay() {
  const dateInput = document.getElementById('clander');
  if (dateInput && dateInput.value) {
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() - 1);
    setDateInput(currentDate);
    // 日付変更時にその日付のデータを読み込み
    loadReservationData();
  }
}

// 日付を一日後に変更する関数
function changeToNextDay() {
  const dateInput = document.getElementById('clander');
  if (dateInput && dateInput.value) {
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + 1);
    setDateInput(currentDate);
    // 日付変更時にその日付のデータを読み込み
    loadReservationData();
  }
}

// 日付入力フィールドをクリックしたらカレンダーを表示する関数
function setupDatePicker() {
  const dateInput = document.getElementById('clander');
  if (dateInput) {
    dateInput.addEventListener('click', () => {
      // showPicker()メソッドが利用可能な場合は使用
      if (dateInput.showPicker) {
        dateInput.showPicker();
      }
      // フォールバック: フィールドにフォーカスを当てる
      dateInput.focus();
    });
    
    // 日付が変更されたときにその日付のデータを読み込み
    dateInput.addEventListener('change', () => {
      loadReservationData();
    });
  }
}

// 利用目的ボタンの選択状態を管理する関数
function setupPurposeButtons() {
  const tournamentButton = document.getElementById('purposeTournament');
  const otherButton = document.getElementById('purposeOther');

  if (tournamentButton && otherButton) {
    tournamentButton.addEventListener('click', () => {
      tournamentButton.classList.add('selected');
      otherButton.classList.remove('selected');
    });

    otherButton.addEventListener('click', () => {
      otherButton.classList.add('selected');
      tournamentButton.classList.remove('selected');
    });
  }
}

// 必須項目のバリデーション
function validateRequiredFields() {
  // 利用目的のチェック
  const purposeTournament = document.getElementById('purposeTournament').classList.contains('selected');
  const purposeOther = document.getElementById('purposeOther').classList.contains('selected');
  
  if (!purposeTournament && !purposeOther) {
    alert('利用目的を選択してください。');
    return false;
  }

  // 利用目的詳細のチェック
  const purposeDetail = document.getElementById('purposeDetail').value.trim();
  if (!purposeDetail) {
    alert('利用目的詳細を入力してください。');
    document.getElementById('purposeDetail').focus();
    return false;
  }

  // 予約日のチェック
  const date = document.getElementById('clander').value;
  if (!date) {
    alert('予約日を選択してください。');
    document.getElementById('clander').focus();
    return false;
  }

  // 使用責任者のチェック（ログインユーザーを使用）
  const currentUser = getLoggedInUser();
  if (!currentUser) {
    alert('ログインが必要です。');
    window.location.href = 'login.html';
    return false;
  }

  // 使用人数のチェック
  const numberOfPeople = document.getElementById('numberOfPeople').value.trim();
  if (!numberOfPeople) {
    alert('使用人数を入力してください。');
    document.getElementById('numberOfPeople').focus();
    return false;
  }

  return true;
}

// 選択された予約情報を取得
function getSelectedReservations() {
  const selectedReservations = [];
  for (const key in reservations) {
    if (reservations[key]) {
      const [hour, court] = key.split('-');
      selectedReservations.push({
        hour: parseInt(hour),
        court: court
      });
    }
  }
  return selectedReservations.sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.court.localeCompare(b.court);
  });
}

// 確認済みの予約セルを更新
function updateConfirmedCells() {
  const tableBody = document.getElementById('tableBody');
  const rows = tableBody.querySelectorAll('tr');
  const currentUserId = getCurrentUserId();
  
  for (const key in reservations) {
    if (reservations[key]) {
      const [hour, court] = key.split('-');
      const rowIndex = parseInt(hour) - 8;
      const cellIndex = court === 'A' ? 1 : 2;
      
      if (rows[rowIndex]) {
        const cell = rows[rowIndex].cells[cellIndex];
        cell.classList.add('confirmed');
        cell.classList.remove('reserved', 'available');
        // ユーザーIDを保存
        cell.setAttribute('data-user-id', currentUserId);
      }
    }
  }
  
  // localStorageに保存
  saveReservationData();
}

// 確認画面を表示
function showConfirmation() {
  if (!validateRequiredFields()) {
    return;
  }

  const selectedReservations = getSelectedReservations();
  if (selectedReservations.length === 0) {
    alert('予約時間を選択してください。');
    return;
  }

  // 選択された予約セルを確認済みに更新
  updateConfirmedCells();

  const modal = document.getElementById('confirmationModal');
  const details = document.getElementById('confirmationDetails');

  // 入力情報を取得
  const purposeTournament = document.getElementById('purposeTournament').classList.contains('selected');
  const purpose = purposeTournament ? '大会' : '大会以外';
  const purposeDetail = document.getElementById('purposeDetail').value;
  const date = document.getElementById('clander').value;
  const responsiblePerson = document.getElementById('responsiblePerson').value.trim();
  const numberOfPeople = document.getElementById('numberOfPeople').value;

  // 日付をフォーマット
  const dateObj = new Date(date);
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

  // 予約時間をフォーマット
  let reservationTimes = '';
  selectedReservations.forEach(res => {
    const nextHour = res.hour + 1;
    reservationTimes += `${res.hour.toString().padStart(2, '0')}:00-${nextHour.toString().padStart(2, '0')}:00 ${res.court}コート<br>`;
  });

  // 確認内容を表示
  details.innerHTML = `
    <p><strong>利用目的:</strong> ${purpose}</p>
    <p><strong>利用目的詳細:</strong> ${purposeDetail || '（未入力）'}</p>
    <p><strong>予約日:</strong> ${formattedDate}</p>
    <p><strong>予約時間:</strong></p>
    <div style="margin-left: 20px;">${reservationTimes}</div>
    <p><strong>使用責任者:</strong> ${responsiblePerson}</p>
    <p><strong>使用人数:</strong> ${numberOfPeople}人</p>
  `;

  modal.style.display = 'block';
}

// 確認画面を閉じる
function closeConfirmation() {
  const modal = document.getElementById('confirmationModal');
  modal.style.display = 'none';
}

// 送信処理
function submitReservation() {
  // localStorageに保存（確認済みのデータ）
  saveReservationData();
  alert('予約を送信しました。');
  closeConfirmation();
  // ここで実際の送信処理を実装
}

// ハンバーガーメニューの設定
function setupHamburgerMenu() {
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const navMenu = document.getElementById('navMenu');
  
  if (hamburgerMenu && navMenu) {
    hamburgerMenu.addEventListener('click', () => {
      hamburgerMenu.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
    
    // メニューリンクをクリックしたらメニューを閉じる
    const navLinks = navMenu.querySelectorAll('.nav-menu-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
    
    // メニュー外をクリックしたらメニューを閉じる
    document.addEventListener('click', (e) => {
      if (!hamburgerMenu.contains(e.target) && !navMenu.contains(e.target)) {
        hamburgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });
  }
}

// ユーザー情報を表示
function displayUserInfo() {
  const currentUser = getLoggedInUser();
  const userInfoDiv = document.getElementById('userInfo');
  
  if (currentUser && userInfoDiv) {
    userInfoDiv.style.display = 'block';
    document.getElementById('userNameDisplay').textContent = `ログイン中: ${currentUser.name}`;
  }
}

// 使用責任者名を入力欄に反映
function fillResponsiblePerson() {
  const currentUser = getLoggedInUser();
  const responsiblePersonInput = document.getElementById('responsiblePerson');
  
  if (currentUser && responsiblePersonInput) {
    responsiblePersonInput.value = currentUser.name;
  }
}

// ログアウト処理
function handleLogout() {
  if (confirm('ログアウトしますか？')) {
    logout();
    window.location.href = 'login.html';
  }
}

// ページ読み込み時にテーブルを生成し、今日の日付を設定
document.addEventListener('DOMContentLoaded', () => {
  // ログインチェック
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  
  // ユーザー情報を表示
  displayUserInfo();
  
  createReservationTable();
  setTodayDate();
  setupDatePicker();
  setupPurposeButtons();
  setupHamburgerMenu();
  
  // 現在の日付の予約データを読み込み
  loadReservationData();
  
  // 初期状態で料金表示を非表示
  updateFeeDisplay();

  // 前の日ボタンのイベントリスナー
  const prevDayButton = document.getElementById('prevDay');
  if (prevDayButton) {
    prevDayButton.addEventListener('click', changeToPrevDay);
  }

  // 次の日ボタンのイベントリスナー
  const nextDayButton = document.getElementById('nextDay');
  if (nextDayButton) {
    nextDayButton.addEventListener('click', changeToNextDay);
  }

  // 確認ボタンのイベントリスナー
  const confirmButton = document.getElementById('confirmButton');
  if (confirmButton) {
    confirmButton.addEventListener('click', showConfirmation);
  }

  // キャンセルボタンのイベントリスナー
  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.addEventListener('click', closeConfirmation);
  }

  // 送信ボタンのイベントリスナー
  const submitButton = document.getElementById('submitButton');
  if (submitButton) {
    submitButton.addEventListener('click', submitReservation);
  }

  // モーダルの外側をクリックしたら閉じる
  const modal = document.getElementById('confirmationModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeConfirmation();
      }
    });
  }

  // ログアウトリンク
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // 登録者反映ボタン
  const fillButton = document.getElementById('fillResponsiblePerson');
  if (fillButton) {
    fillButton.addEventListener('click', fillResponsiblePerson);
  }
});