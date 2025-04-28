function doPost(e) {
  try {
    // 使用當前活動的試算表
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 獲取表單參數
    const params = e.parameter;
    Logger.log("接收到的參數: " + JSON.stringify(params)); // 記錄接收到的數據
    
    // 根據事件類型選擇對應的工作表
    const eventType = params.eventType || params.activityType || '';
    Logger.log("事件類型: " + eventType);
    
    let sheetName, headers;
    
    // 根據事件類型設置工作表名稱和標頭
    if (eventType === '穿越無人機競速闖關賽') {
      sheetName = '2025DroneGame-FPV';
      headers = [
        '時間戳記', '姓', '名', '飛手外號', '團傳', '飛機尺寸', 
        '電子信箱', '連絡電話', '學校', '指導老師'
      ];
    } else if (eventType === '入門無人機競速闖關賽') {
      sheetName = '2025DroneGame-Beginner';
      headers = [
        '時間戳記', '姓', '名', '飛手外號', '自備飛機', 
        '電子信箱', '連絡電話', '學校', '指導老師'
      ];
    } else if (eventType === '入門無人機團體解題競速闖關賽') {
      sheetName = '2025DroneGame-Team';
      headers = [
        '時間戳記', '隊長姓', '隊長名', '隊員1姓', '隊員1名', '隊員2姓', '隊員2名', 
        '團隊外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'
      ];
    } else if (eventType === '無人機與穿越機研習') {
      sheetName = '2025DroneGame-Workshop';
      headers = [
        '時間戳記', '姓', '名', '飛手外號', '電子信箱', '連絡電話', '身份', 
        '學校', '科系與年級', '教師學校', '教師科系', '教師職稱', 
        '職業', '公司名稱', '便當選項'
      ];
    } else {
      // 如果沒有匹配的事件類型，拋出錯誤
      throw new Error("未知的報名類型: " + eventType);
    }
    
    // 檢查工作表是否存在，如果不存在則創建
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
    
    // 生成時間戳記
    const timestamp = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei' 
    });
    
    // 準備要寫入的數據行
    let rowData;
    
    if (eventType === '穿越無人機競速闖關賽') {
      rowData = [
        timestamp,              // 時間戳記
        params.lastName || '',  // 姓
        params.firstName || '', // 名
        params.callSign || '',  // 飛手外號
        params.transmission || '', // 團傳
        params.size || '',      // 飛機尺寸
        params.email || '',     // 電子信箱
        params.phone || '',     // 連絡電話
        params.school || '',    // 學校
        params.teacher || ''    // 指導老師
      ];
    } else if (eventType === '入門無人機競速闖關賽') {
      rowData = [
        timestamp,              // 時間戳記
        params.lastName || '',  // 姓
        params.firstName || '', // 名
        params.callSign || '',  // 飛手外號
        params.ownDrone || '',  // 自備飛機
        params.email || '',     // 電子信箱
        params.phone || '',     // 連絡電話
        params.school || '',    // 學校
        params.teacher || ''    // 指導老師
      ];
    } else if (eventType === '入門無人機團體解題競速闖關賽') {
      rowData = [
        timestamp,                        // 時間戳記
        params.lastName || '',            // 隊長姓
        params.firstName || '',           // 隊長名
        params.teamMember1LastName || '', // 隊員1姓
        params.teamMember1FirstName || '',// 隊員1名
        params.teamMember2LastName || '', // 隊員2姓
        params.teamMember2FirstName || '',// 隊員2名
        params.teamName || '',            // 團隊外號
        params.ownDrone || '',            // 自備飛機
        params.email || '',               // 電子信箱
        params.phone || '',               // 連絡電話
        params.school || '',              // 學校
        params.teacher || ''              // 指導老師
      ];
    } else if (eventType === '無人機與穿越機研習') {
      rowData = [
        timestamp,                // 時間戳記
        params.lastName || '',    // 姓
        params.firstName || '',   // 名
        params.nickname || '',    // 飛手外號
        params.email || '',       // 電子信箱
        params.phone || '',       // 連絡電話
        params.identity || '',    // 身份
        params.school || '',      // 學校
        params.department || '',  // 科系與年級
        params.teacherSchool || '', // 教師學校
        params.teacherDepartment || '', // 教師科系
        params.teacherTitle || '', // 教師職稱
        params.profession || '',  // 職業
        params.company || '',     // 公司名稱
        params.mealOption || ''   // 便當選項
      ];
    } else {
      // 這裡不需要了，因為前面已經處理了未知類型的情況
      throw new Error("未知的報名類型，無法準備數據: " + eventType);
    }
    
    // 寫入數據到試算表
    sheet.appendRow(rowData);
    Logger.log("數據已寫入試算表: " + sheetName); // 記錄成功寫入
    
    // 直接發送通知給管理員，不放在 try-catch 中
    const fullName = params.lastName + params.firstName;
    const adminSubject = `新報名通知：${eventType}`;
    let adminBody = `有新的報名資訊：\n\n`;
    adminBody += `活動類型：${eventType}\n`;
    adminBody += `姓名：${fullName}\n`;
    adminBody += `電子信箱：${params.email || ''}\n`;
    adminBody += `連絡電話：${params.phone || ''}\n`;
    adminBody += `學校：${params.school || ''}\n`;
    adminBody += `提交時間：${timestamp}\n`;
    
    MailApp.sendEmail({
      to: "fgchen@gmail.com",
      subject: adminSubject,
      body: adminBody
    });
    
    Logger.log("管理員通知郵件已直接發送至: fgchen@gmail.com");
    
    // 嘗試發送電子郵件通知給報名者
    try {
      // 只有當 sendEmail 參數為 'yes' 且有提供電子郵件時，才發送確認郵件給報名者
      if (params.sendEmail === 'yes' && params.email) {
        sendConfirmationEmail(params, eventType);
      }
    } catch (emailError) {
      Logger.log("發送報名者確認郵件失敗: " + emailError);
    }
    
    // 返回成功頁面
    return HtmlService.createHtmlOutput(
      '<html><body>' +
      '<div style="text-align:center; font-family: Arial, sans-serif; margin-top: 50px;">' +
      '<h2 style="color: #3a0088;">報名資料已成功提交！</h2>' +
      '<p>感謝您的報名，我們已收到您的資料。</p>' +
      '<p>請關閉此視窗返回主頁面。</p>' +
      '</div>' +
      '</body></html>'
    );
    
  } catch(error) {
    // 記錄詳細錯誤信息
    Logger.log("處理表單時出現錯誤: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    
    // 返回錯誤頁面
    return HtmlService.createHtmlOutput(
      '<html><body>' +
      '<div style="text-align:center; font-family: Arial, sans-serif; margin-top: 50px;">' +
      '<h2 style="color: #e61c5d;">提交過程中發生錯誤</h2>' +
      '<p>很抱歉，處理您的報名資料時發生錯誤。</p>' +
      '<p>錯誤訊息: ' + error.toString() + '</p>' +
      '<p>請稍後再試或聯絡管理員。</p>' +
      '</div>' +
      '</body></html>'
    );
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<html><body>' +
    '<div style="text-align:center; font-family: Arial, sans-serif; margin-top: 50px;">' +
    '<h2 style="color: #3a0088;">2025弘光科大穿越機研習競賽表單處理服務</h2>' +
    '<p>此網址用於處理表單提交。</p>' +
    '<p>請通過正常的表單頁面提交您的申請。</p>' +
    '</div>' +
    '</body></html>'
  );
}

// 發送確認郵件給報名者
function sendConfirmationEmail(params, eventType) {
  const fullName = params.lastName + params.firstName;
  let subject = `2025弘光科大穿越機研習競賽報名確認 - ${eventType}`;
  let body = `親愛的 ${fullName} 您好，\n\n`;
  body += `感謝您報名參加「2025弘光科大穿越機研習與競賽」的「${eventType}」活動。\n\n`;
  body += `我們已收到您的報名資料，以下是您的報名資訊：\n`;
  body += `姓名：${fullName}\n`;
  body += `電子郵件：${params.email}\n`;
  body += `連絡電話：${params.phone}\n\n`;
  
  if (eventType === '無人機與穿越機研習') {
    body += `便當選項：${params.mealOption || '未指定'}\n\n`;
  }
  
  body += `活動日期：2025年5月24日\n`;
  body += `活動地點：弘光科技大學智慧科技大樓七樓無人機教育中心\n\n`;
  body += `如有任何問題，請聯絡活動負責人：\n`;
  body += `陳富國 老師\n`;
  body += `LINE：fgchen\n\n`;
  body += `期待您的參與！\n\n`;
  body += `敬祝 平安順心\n\n`;
  body += `弘光科技大學智慧科技應用系 敬上`;
  
  // 發送郵件
  MailApp.sendEmail({
    to: params.email,
    subject: subject,
    body: body
  });
  
  Logger.log("報名確認郵件已發送至: " + params.email);
}