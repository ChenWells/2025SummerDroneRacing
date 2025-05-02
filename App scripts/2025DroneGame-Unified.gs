function doPost(e) {
  try {
    // 解析傳入的表單數據
    const formData = JSON.parse(e.postData.contents);
    const params = formData.params;
    const eventType = formData.eventType;
    
    Logger.log("收到表單提交，活動類型: " + eventType);
    Logger.log("提交的參數: " + JSON.stringify(params));
    
    // 驗證必填欄位
    const requiredFields = ["firstName", "lastName", "email", "phone"];
    for (const field of requiredFields) {
      if (!params[field]) {
        const errorMsg = `缺少必填欄位: ${field}`;
        Logger.log(errorMsg);
        logErrorToSheet({
          errorType: "欄位驗證失敗",
          errorDetails: errorMsg,
          failurePoint: "表單驗證"
        }, params);
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          error: errorMsg 
        }));
      }
    }
    
    // 寫入資料到Google表格
    let sheetWriteSuccess = false;
    try {
      sheetWriteSuccess = writeToSheet(params, eventType);
      Logger.log("資料已成功寫入表格");
    } catch (sheetError) {
      Logger.log("寫入表格失敗: " + sheetError);
      logErrorToSheet({
        errorType: "表格寫入失敗",
        errorDetails: sheetError.toString(),
        stack: sheetError.stack || "無堆疊信息",
        failurePoint: "寫入報名資料"
      }, params);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: "無法保存您的報名資料，請稍後再試或聯繫管理員。" 
      }));
    }
    
    // 發送確認郵件
    let confirmationSent = false;
    let confirmationError = null;
    try {
      confirmationSent = sendConfirmationEmail(params, eventType);
      Logger.log("確認郵件已發送");
    } catch (emailError) {
      confirmationError = emailError;
      Logger.log("發送確認郵件失敗: " + emailError);
      
      // 記錄錯誤到表格
      logErrorToSheet({
        errorType: "郵件發送失敗",
        errorDetails: emailError.toString(),
        stack: emailError.stack || "無堆疊信息",
        failurePoint: "發送確認郵件"
      }, params);
    }
    
    // 無論確認郵件是否成功，都發送一個通知給管理員
    try {
      sendAdminNotification(params, eventType, confirmationSent, confirmationError);
      Logger.log("管理員通知郵件已發送");
    } catch (adminEmailError) {
      Logger.log("發送管理員通知失敗: " + adminEmailError);
      
      // 記錄管理員通知錯誤
      logErrorToSheet({
        errorType: "管理員通知失敗",
        errorDetails: adminEmailError.toString(),
        stack: adminEmailError.stack || "無堆疊信息",
        failurePoint: "發送管理員通知"
      }, params);
    }
    
    // 即使發送郵件失敗，只要資料已成功寫入表格，我們仍然返回成功
    // 但在回應中包含郵件發送狀態的信息
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      dataStored: sheetWriteSuccess,
      confirmationSent: confirmationSent,
      message: confirmationSent 
        ? "您的報名已成功，確認郵件已發送至您的信箱。" 
        : "您的報名已成功，但確認郵件發送失敗。請檢查您提供的電子郵件地址是否正確。"
    }));
    
  } catch (error) {
    // 捕獲任何其他未處理的錯誤
    Logger.log("doPost函數中發生未處理的錯誤: " + error);
    
    // 嘗試記錄錯誤，但這裡可能沒有params資訊
    try {
      logErrorToSheet({
        errorType: "未處理的系統錯誤",
        errorDetails: error.toString(),
        stack: error.stack || "無堆疊信息",
        failurePoint: "doPost主函數"
      }, {});
    } catch (logError) {
      Logger.log("無法記錄錯誤到表格: " + logError);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "處理您的請求時發生系統錯誤，請稍後再試。" 
    }));
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
  const email = params.email;
  let subject, body;
  
  // 所有活動類型都使用標準化的郵件格式
  subject = `${eventType}報名確認：${fullName}`;
  body = `${fullName} 您好，\n\n`;
  body += `感謝您報名參加「${eventType}」！\n\n`;
  body += `報名資訊：\n`;
  body += `姓名：${fullName}\n`;
  
  // 根據不同活動類型添加特定資訊
  if (eventType === '無人機與穿越機研習') {
    body += `身份：${params.identity || '未提供'}\n`;
    if (params.identity === '學生') {
      body += `學校：${params.school || '未提供'}\n`;
      body += `科系與年級：${params.department || '未提供'}\n`;
    } else if (params.identity === '教師') {
      body += `學校：${params.teacherSchool || '未提供'}\n`;
      body += `科系：${params.teacherDepartment || '未提供'}\n`;
      body += `職稱：${params.teacherTitle || '未提供'}\n`;
    } else if (params.identity === '社會人士') {
      body += `職業：${params.profession || '未提供'}\n`;
      body += `公司名稱：${params.company || '未提供'}\n`;
    }
    body += `便當選項：${params.mealOption || '未指定'}\n`;
    
    body += `活動日期：2025年6月27日(六)\n`;
    body += `活動時間：09:00-12:00\n`;
  
  } else if (eventType === '穿越無人機競速闖關賽') {
    body += `飛手外號：${params.callSign || '未提供'}\n`;
    body += `團傳類型：${params.transmission || '未提供'}\n`;
    body += `飛機尺寸：${params.size || '未提供'}\n`;
    body += `單位：${params.school || '未提供'}\n`;
    
    body += `活動日期：2025年6月28日(日)\n`;
    body += `活動時間：09:00-17:00\n`;
  
  } else if (eventType === '入門無人機競速闖關賽') {
    body += `飛手外號：${params.callSign || '未提供'}\n`;
    body += `自備飛機：${params.ownDrone || '未提供'}\n`;
    body += `單位：${params.school || '未提供'}\n`;
    
    body += `活動日期：2025年6月28日(日)\n`;
    body += `活動時間：13:00-17:00\n`;
  
  } else if (eventType === '入門無人機團體解題競速闖關賽') {
    body += `隊長：${fullName}\n`;
    body += `隊員1：${(params.teamMember1LastName || '') + (params.teamMember1FirstName || '')}\n`;
    body += `隊員2：${(params.teamMember2LastName || '') + (params.teamMember2FirstName || '')}\n`;
    body += `團隊名稱：${params.teamName || '未提供'}\n`;
    body += `自備飛機：${params.ownDrone || '未提供'}\n`;
    body += `單位：${params.school || '未提供'}\n`;
    
    body += `活動日期：2025年6月28日(日)\n`;
    body += `活動時間：09:00-17:00\n`;
  }
  
  // 所有郵件的共同部分
  body += `連絡電話：${params.phone || '未提供'}\n\n`;
  body += `活動地點：弘光科技大學\n\n`;
  body += `我們期待您的參與！如有任何問題，請聯繫：fgchen@gmail.com\n\n`;
  body += `此為系統自動發送，請勿回覆。`;
  
  let success = false;
  let errorInfo = null;
  const emailOptions = {
    to: email,
    subject: subject,
    body: body
  };
  
  // 嘗試使用 MailApp 發送
  try {
    Logger.log("嘗試使用 MailApp 發送確認郵件給: " + email);
    MailApp.sendEmail(emailOptions);
    Logger.log("使用 MailApp 成功發送確認郵件");
    success = true;
  } catch (e) {
    errorInfo = {
      method: "MailApp",
      error: e.toString(),
      stack: e.stack || "無堆疊信息",
      time: new Date().toISOString()
    };
    Logger.log("MailApp 發送確認郵件失敗: " + e);
    
    // 嘗試使用 GmailApp 作為備選方案
    try {
      Logger.log("嘗試使用 GmailApp 作為備用方法發送確認郵件");
      GmailApp.sendEmail(email, subject, body);
      Logger.log("使用 GmailApp 成功發送確認郵件");
      success = true;
    } catch (gmailError) {
      errorInfo.fallbackMethod = {
        method: "GmailApp",
        error: gmailError.toString(),
        stack: gmailError.stack || "無堆疊信息",
        time: new Date().toISOString()
      };
      Logger.log("GmailApp 發送確認郵件也失敗: " + gmailError);
    }
  }
  
  if (!success) {
    // 詳細記錄所有嘗試的信息，用於排查
    const detailedError = JSON.stringify(errorInfo, null, 2);
    Logger.log("發送確認郵件所有嘗試都失敗。詳細信息: " + detailedError);
    
    // 將此錯誤重新拋出，以便上層函數可以捕獲並處理
    throw new Error("無法發送確認郵件到 " + email + "。詳細信息: " + detailedError);
  }
  
  return success;
}

// 記錄錯誤到錯誤日誌表
function logErrorToSheet(errorInfo, params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let errorSheet = ss.getSheetByName("錯誤日誌");
    
    // 如果沒有錯誤日誌表，創建一個
    if (!errorSheet) {
      errorSheet = ss.insertSheet("錯誤日誌");
      errorSheet.appendRow([
        "時間戳記", 
        "錯誤類型", 
        "錯誤詳情", 
        "使用者名稱", 
        "電子郵件", 
        "報名活動", 
        "嘗試操作"
      ]);
    }
    
    // 添加錯誤記錄
    errorSheet.appendRow([
      new Date(), 
      errorInfo.errorType, 
      errorInfo.errorDetails, 
      params.lastName + params.firstName, 
      params.email, 
      params.eventType || "未知活動", 
      errorInfo.failurePoint
    ]);
    
    Logger.log("已將錯誤記錄到錯誤日誌表中");
  } catch (e) {
    Logger.log("記錄錯誤到表格時出錯: " + e);
  }
}

// 修改管理員通知函數
function sendAdminNotification(params, eventType, confirmationSent = true, errorMessage = null) {
  try {
    const adminEmail = "fgchen@gmail.com"; // 管理員的電子郵件地址
    const fullName = params.lastName + params.firstName;
    
    let subject = `新報名通知: ${eventType} - ${fullName}`;
    
    let body = `管理員您好，\n\n`;
    body += `有新的報名資料提交：\n\n`;
    body += `活動類型：${eventType}\n`;
    body += `姓名：${fullName}\n`;
    body += `電子郵件：${params.email || '未提供'}\n`;
    body += `連絡電話：${params.phone || '未提供'}\n`;
    body += `學校：${params.school || '未提供'}\n`;
    
    if (eventType === '無人機與穿越機研習') {
      body += `身份：${params.identity || '未指定'}\n`;
      body += `便當選項：${params.mealOption || '未指定'}\n\n`;
    } else if (eventType === '穿越無人機競速闖關賽') {
      body += `飛手外號：${params.callSign || '未提供'}\n`;
      body += `團傳類型：${params.transmission || '未提供'}\n`;
      body += `飛機尺寸：${params.size || '未提供'}\n\n`;
    } else if (eventType === '入門無人機競速闖關賽') {
      body += `飛手外號：${params.callSign || '未提供'}\n`;
      body += `自備飛機：${params.ownDrone || '未提供'}\n\n`;
    } else if (eventType === '入門無人機團體解題競速闖關賽') {
      body += `隊員1：${(params.teamMember1LastName || '') + (params.teamMember1FirstName || '')}\n`;
      body += `隊員2：${(params.teamMember2LastName || '') + (params.teamMember2FirstName || '')}\n`;
      body += `團隊名稱：${params.teamName || '未提供'}\n`;
      body += `自備飛機：${params.ownDrone || '未提供'}\n\n`;
    }
    
    body += `提交時間：${new Date().toLocaleString()}\n\n`;
    
    // 添加確認郵件發送狀態信息
    if (confirmationSent) {
      body += `確認郵件狀態：已成功發送到 ${params.email}\n\n`;
    } else {
      body += `確認郵件狀態：發送失敗\n`;
      body += `錯誤信息：${errorMessage || '未知錯誤'}\n`;
      body += `請手動發送確認郵件或檢查系統設置。\n\n`;
    }
    
    body += `請前往Google表格查看完整報名資料。\n\n`;
    body += `此為系統自動發送，請勿回覆。`;
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: subject,
      body: body
    });
    
    Logger.log("已發送管理員通知郵件至: " + adminEmail);
  } catch (error) {
    Logger.log("發送管理員通知郵件失敗: " + error);
  }
}

/**
 * 將報名資料寫入相應的Google表格
 * @param {Object} params - 報名表單參數
 * @param {string} eventType - 活動類型
 * @return {boolean} - 寫入是否成功
 */
function writeToSheet(params, eventType) {
  try {
    // 使用當前活動的試算表
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 根據事件類型選擇對應的工作表
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
        '時間戳記', '姓', '名', '電子信箱', '連絡電話', '身份', 
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
    
    return true;
  } catch (error) {
    Logger.log("writeToSheet 發生錯誤: " + error);
    throw error; // 向上拋出錯誤，由調用方處理
  }
}