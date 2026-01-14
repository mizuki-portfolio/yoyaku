'use strict';

// すべての予約データを取得
function getAllReservations() {
  const allReservations = [];
  
  // localStorageからすべての予約データを取得
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('reservation_')) {
      const date = key.replace('reservation_', '');
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.confirmedReservations) {
          // 確認済みの予約を取得
          for (const reservationKey in data.confirmedReservations) {
            if (data.confirmedReservations[reservationKey]) {
              const [hour, court] = reservationKey.split('-');
              allReservations.push({
                date: date,
                hour: parseInt(hour),
                court: court,
                purpose: data.purpose || '',
                purposeDetail: data.purposeDetail || '',
                responsiblePerson: data.responsiblePerson || '',
                numberOfPeople: data.numberOfPeople || ''
              });
            }
          }
        }
      } catch (e) {
        console.error('予約データの読み込みエラー:', e);
      }
    }
  }
  
  // 日付と時間でソート
  return allReservations.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.hour !== b.hour) {
      return a.hour - b.hour;
    }
    return a.court.localeCompare(b.court);
  });
}

// 日付をフォーマット
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 時間をフォーマット
function formatTime(hour) {
  const nextHour = hour + 1;
  return `${hour.toString().padStart(2, '0')}:00-${nextHour.toString().padStart(2, '0')}:00`;
}

// 予約一覧を表示
function displayReservations() {
  const reservations = getAllReservations();
  const listContainer = document.getElementById('reservationList');
  
  if (reservations.length === 0) {
    listContainer.innerHTML = '<p class="no-reservations">予約がありません。</p>';
    return;
  }
  
  // 日付ごとにグループ化
  const groupedByDate = {};
  reservations.forEach(res => {
    if (!groupedByDate[res.date]) {
      groupedByDate[res.date] = [];
    }
    groupedByDate[res.date].push(res);
  });
  
  let html = '';
  for (const date in groupedByDate) {
    html += `<div class="reservation-date-group">`;
    html += `<h3>${formatDate(date)}</h3>`;
    
    groupedByDate[date].forEach((res, index) => {
      html += `
        <div class="reservation-item">
          <div class="reservation-info">
            <p><strong>時間:</strong> ${formatTime(res.hour)}</p>
            <p><strong>コート:</strong> ${res.court}コート</p>
            <p><strong>利用目的:</strong> ${res.purpose}</p>
            <p><strong>利用目的詳細:</strong> ${res.purposeDetail || '（未入力）'}</p>
            <p><strong>使用責任者:</strong> ${res.responsiblePerson}</p>
            <p><strong>使用人数:</strong> ${res.numberOfPeople}人</p>
          </div>
          <button class="cancel-reservation-btn" data-date="${res.date}" data-hour="${res.hour}" data-court="${res.court}">
            キャンセル
          </button>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  listContainer.innerHTML = html;
  
  // キャンセルボタンのイベントリスナーを設定
  const cancelButtons = document.querySelectorAll('.cancel-reservation-btn');
  cancelButtons.forEach(button => {
    button.addEventListener('click', function() {
      const date = this.getAttribute('data-date');
      const hour = parseInt(this.getAttribute('data-hour'));
      const court = this.getAttribute('data-court');
      
      if (confirm('この予約をキャンセルしますか？')) {
        cancelReservation(date, hour, court);
      }
    });
  });
}

// 予約をキャンセル
function cancelReservation(date, hour, court) {
  const key = `reservation_${date}`;
  const savedData = localStorage.getItem(key);
  
  if (!savedData) {
    return;
  }
  
  try {
    const reservationData = JSON.parse(savedData);
    const reservationKey = `${hour}-${court}`;
    
    // 確認済みの予約から削除
    if (reservationData.confirmedReservations && reservationData.confirmedReservations[reservationKey]) {
      delete reservationData.confirmedReservations[reservationKey];
      
      // 確認済みの予約がすべてなくなった場合は、データを削除
      const hasReservations = Object.keys(reservationData.confirmedReservations).length > 0;
      if (hasReservations) {
        localStorage.setItem(key, JSON.stringify(reservationData));
      } else {
        localStorage.removeItem(key);
      }
      
      alert('予約をキャンセルしました。');
      displayReservations(); // 一覧を再表示
    }
  } catch (e) {
    console.error('予約キャンセルエラー:', e);
    alert('予約のキャンセルに失敗しました。');
  }
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

// ページ読み込み時に予約一覧を表示
document.addEventListener('DOMContentLoaded', () => {
  displayReservations();
  setupHamburgerMenu();
});
