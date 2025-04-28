// 2025 弘光科大穿越機研習與競賽 - 統一表單處理腳本
// 用於處理四個不同活動的表單提交:
// 1. 無人機與穿越機研習 (Workshop)
// 2. 穿越無人機競速闖關賽 (FPV)
// 3. 入門無人機競速闖關賽 (Beginner)
// 4. 入門無人機團體解題競速闖關賽 (Team)

// 您的試算表ID - 請將此替換為您實際的試算表ID
const SPREADSHEET_ID = "1aY1VLcvn4Q08IsNMLjM8G-Ns_dWYIDGdvowmQWyH3gY";

// 處理 GET 請求
function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<html><body>' +
    '<div style="text-align:center; font-family: Arial, sans-serif; margin-top: 50px;">' +
    '<h2 style="color: #3a0088;">2025弘光科大穿越機研習與競賽表單處理服務</h2>' +
    '<p>此網址用於處理表單提交。</p>' +
    '<p>請通過正常的表單頁面提交您的申請。</p>' +
    '</div>' +
    '</body></html>'
  );
}

// 處理 POST 請求
function doPost(e) {
  try {
    // 記錄完整請求
    Logger.log("接收到 POST 請求，記錄完整請求數據");
    Logger.log("請求方法: POST");
    Logger.log("請求查詢字符串參數: " + JSON.stringify(e.queryString || {}));
    Logger.log("請求參數: " + JSON.stringify(e.parameter || {}));
    Logger.log("請求表單數據: " + JSON.stringify(e.postData ? (e.postData.contents || "無內容") : "無表單數據"));
    
    // 獲取表單參數
    const params = e.parameter;
    Logger.log("接收到的參數: " + JSON.stringify(params)); // 記錄接收到的數據
    
    // 檢查是否有參數
    if (!params || Object.keys(params).length === 0) {
      const errorMsg = "未收到任何表單數據";
      Logger.log("錯誤: " + errorMsg);
      throw new Error(errorMsg);
    }
    
    // 獲取活動類型 (優先檢查eventType，其次檢查activityType)
    let eventType = params.eventType || params.activityType || "";
    Logger.log("活動類型: " + eventType);
    
    // 如果沒有明確的活動類型，嘗試從其他字段推斷
    if (!eventType) {
      if (params.identity) { 
        eventType = "無人機與穿越機研習";
        Logger.log("從identity字段推斷活動類型: " + eventType);
      } else if (params.transmission) {
        eventType = "穿越無人機競速闖關賽";
        Logger.log("從transmission字段推斷活動類型: " + eventType);
      } else if (params.teamMember1FirstName || params.teamMember1LastName) {
        eventType = "入門無人機團體解題競速闖關賽";
        Logger.log("從teamMember字段推斷活動類型: " + eventType);
      } else if (params.ownDrone && !params.teamMember1FirstName) {
        eventType = "入門無人機競速闖關賽";
        Logger.log("從ownDrone字段推斷活動類型: " + eventType);
      }
    }
    
    // 如果仍然無法確定活動類型，拋出錯誤
    if (!eventType) {
      const errorMsg = "無法確定活動類型，請確保表單包含eventType或activityType字段";
      Logger.log("錯誤: " + errorMsg);
      throw new Error(errorMsg);
    }
    
    // 記錄將要調用的處理函數
    Logger.log("將使用以下處理函數處理表單: " + eventType);
    
    // 根據活動類型決定處理方法
    let result;
    switch(eventType) {
      case "無人機與穿越機研習":
        Logger.log("調用 handleWorkshopForm 處理表單");
        result = handleWorkshopForm(params);
        Logger.log("handleWorkshopForm 執行完成");
        return result;
      case "穿越無人機競速闖關賽":
        Logger.log("調用 handleFPVForm 處理表單");
        result = handleFPVForm(params);
        Logger.log("handleFPVForm 執行完成");
        return result;
      case "入門無人機競速闖關賽":
        Logger.log("調用 handleBeginnerForm 處理表單");
        result = handleBeginnerForm(params);
        Logger.log("handleBeginnerForm 執行完成");
        return result;
      case "入門無人機團體解題競速闖關賽":
        Logger.log("調用 handleTeamForm 處理表單");
        result = handleTeamForm(params);
        Logger.log("handleTeamForm 執行完成");
        return result;
      default:
        const errorMsg = "未知的活動類型: " + eventType;
        Logger.log("錯誤: " + errorMsg);
        throw new Error(errorMsg);
    }
    
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

// 獲取試算表
function getSpreadsheet() {
  try {
    Logger.log("嘗試使用 SpreadsheetApp.openById 打開試算表: " + SPREADSHEET_ID);
    
    // 首先嘗試使用 openById
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      Logger.log("成功通過 ID 打開試算表: " + ss.getName());
      return ss;
    } catch (idError) {
      Logger.log("通過 ID 打開試算表失敗: " + idError);
      Logger.log("錯誤堆疊: " + (idError.stack || "無堆疊信息"));
      
      // 嘗試使用 getActiveSpreadsheet() 作為備選
      try {
        Logger.log("嘗試使用 SpreadsheetApp.getActiveSpreadsheet()");
        const activeSS = SpreadsheetApp.getActiveSpreadsheet();
        if (activeSS) {
          Logger.log("成功通過 getActiveSpreadsheet 獲取試算表: " + activeSS.getName());
          return activeSS;
        } else {
          throw new Error("getActiveSpreadsheet() 返回 null 或 undefined");
        }
      } catch (activeError) {
        Logger.log("使用 getActiveSpreadsheet 獲取試算表失敗: " + activeError);
        // 重新拋出原始錯誤
        throw idError;
      }
    }
  } catch (error) {
    Logger.log("獲取試算表過程中發生嚴重錯誤: " + error);
    Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    throw error;
  }
}

// 處理無人機與穿越機研習表單
function handleWorkshopForm(params) {
  // 使用指定的試算表
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('2025DroneGame-Workshop');
  
  // 如果工作表不存在，則創建它
  if (!sheet) {
    sheet = ss.insertSheet('2025DroneGame-Workshop');
    const headers = [
      "報名時間",
      "活動類型",
      "名",
      "姓",
      "電子信箱",
      "連絡電話",
      "身份",
      "學校名稱(學生)",
      "科系與年級(學生)",
      "學校名稱(教師)",
      "科系(教師)",
      "職稱(教師)",
      "職業(社會人士)",
      "公司名稱(社會人士)"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(sheet, headers.length);
  }
  
  // 生成時間戳記
  const timestamp = new Date().toLocaleString('zh-TW', { 
    timeZone: 'Asia/Taipei' 
  });
  
  // 準備要寫入的數據行
  const rowData = [
    timestamp,                    // 報名時間
    "無人機與穿越機研習",         // 活動類型
    params.firstName || "",       // 名
    params.lastName || "",        // 姓
    params.email || "",           // 電子信箱
    params.phone || "",           // 連絡電話
    params.identity || "",        // 身份
    params.school || "",          // 學校名稱(學生)
    params.department || "",      // 科系與年級(學生)
    params.teacherSchool || "",   // 學校名稱(教師)
    params.teacherDepartment || "", // 科系(教師)
    params.teacherTitle || "",    // 職稱(教師)
    params.profession || "",      // 職業(社會人士)
    params.company || ""          // 公司名稱(社會人士)
  ];
  
  // 寫入數據到試算表
  sheet.appendRow(rowData);
  Logger.log("研習活動數據已寫入試算表");
  
  // 發送郵件通知
  sendEmailNotification(params, "無人機與穿越機研習");
  
  // 返回成功頁面
  return createSuccessResponse("研習活動報名資料已成功提交！");
}

// 處理穿越無人機競速闖關賽表單
function handleFPVForm(params) {
  try {
    Logger.log("開始處理FPV表單數據");
    
    // 使用指定的試算表
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('2025DroneGame-FPV');
    
    // 如果工作表不存在，則創建它
    if (!sheet) {
      Logger.log("未找到FPV工作表，創建新工作表");
      sheet = ss.insertSheet('2025DroneGame-FPV');
      const headers = ['時間戳記', '姓', '名', '飛手外號', '團傳', '飛機尺寸', '電子信箱', '連絡電話', '學校', '指導老師'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet, headers.length);
    } else {
      Logger.log("已找到現有FPV工作表");
    }
    
    // 生成時間戳記
    const timestamp = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei' 
    });
    
    // 記錄關鍵字段的值
    Logger.log("姓名: " + (params.lastName || '') + (params.firstName || ''));
    Logger.log("電子信箱: " + (params.email || ''));
    Logger.log("飛手外號: " + (params.callSign || ''));
    Logger.log("團傳: " + (params.transmission || ''));
    Logger.log("飛機尺寸: " + (params.size || ''));
    
    // 準備要寫入的數據行
    const rowData = [
      timestamp,                // 時間戳記
      params.lastName || '',    // 姓
      params.firstName || '',   // 名
      params.callSign || '',    // 飛手外號
      params.transmission || '', // 團傳
      params.size || '',        // 飛機尺寸
      params.email || '',       // 電子信箱
      params.phone || '',       // 連絡電話
      params.school || '',      // 學校
      params.teacher || ''      // 指導老師
    ];
    
    // 寫入數據到試算表
    Logger.log("嘗試寫入數據到FPV工作表");
    sheet.appendRow(rowData);
    Logger.log("FPV競賽數據已寫入試算表");
    
    // 發送郵件通知
    try {
      sendEmailNotification(params, "穿越無人機競速闖關賽");
      Logger.log("郵件通知已發送");
    } catch (emailError) {
      Logger.log("發送郵件通知失敗: " + emailError);
      // 即使郵件發送失敗，我們仍然繼續處理
    }
    
    // 返回成功頁面
    Logger.log("FPV表單處理完成");
    return createSuccessResponse("穿越無人機競速闖關賽報名資料已成功提交！");
  } catch (error) {
    Logger.log("處理FPV表單時出錯: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    throw error; // 重新拋出錯誤，讓主函數處理
  }
}

// 處理入門無人機競速闖關賽表單
function handleBeginnerForm(params) {
  try {
    Logger.log("開始處理入門競賽表單數據");
    
    // 使用指定的試算表
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('2025DroneGame-Beginner');
    
    // 如果工作表不存在，則創建它
    if (!sheet) {
      Logger.log("未找到入門競賽工作表，創建新工作表");
      sheet = ss.insertSheet('2025DroneGame-Beginner');
      const headers = ['時間戳記', '姓', '名', '飛手外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet, headers.length);
    } else {
      Logger.log("已找到現有入門競賽工作表");
    }
    
    // 生成時間戳記
    const timestamp = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei' 
    });
    
    // 記錄關鍵字段的值
    Logger.log("姓名: " + (params.lastName || '') + (params.firstName || ''));
    Logger.log("電子信箱: " + (params.email || ''));
    Logger.log("飛手外號: " + (params.callSign || ''));
    Logger.log("自備飛機: " + (params.ownDrone || ''));
    
    // 準備要寫入的數據行
    const rowData = [
      timestamp,                // 時間戳記
      params.lastName || '',    // 姓
      params.firstName || '',   // 名
      params.callSign || '',    // 飛手外號
      params.ownDrone || '',    // 自備飛機
      params.email || '',       // 電子信箱
      params.phone || '',       // 連絡電話
      params.school || '',      // 學校
      params.teacher || ''      // 指導老師
    ];
    
    // 寫入數據到試算表
    Logger.log("嘗試寫入數據到入門競賽工作表");
    sheet.appendRow(rowData);
    Logger.log("初學者競賽數據已寫入試算表");
    
    // 發送郵件通知
    try {
      sendEmailNotification(params, "入門無人機競速闖關賽");
      Logger.log("郵件通知已發送");
    } catch (emailError) {
      Logger.log("發送郵件通知失敗: " + emailError);
      // 即使郵件發送失敗，我們仍然繼續處理
    }
    
    // 返回成功頁面
    Logger.log("入門競賽表單處理完成");
    return createSuccessResponse("入門無人機競速闖關賽報名資料已成功提交！");
  } catch (error) {
    Logger.log("處理入門競賽表單時出錯: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    throw error; // 重新拋出錯誤，讓主函數處理
  }
}

// 處理入門無人機團體解題競速闖關賽表單
function handleTeamForm(params) {
  try {
    Logger.log("開始處理團隊競賽表單數據");
    
    // 使用指定的試算表
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('2025DroneGame-Team');
    
    // 如果工作表不存在，則創建它
    if (!sheet) {
      Logger.log("未找到團隊競賽工作表，創建新工作表");
      sheet = ss.insertSheet('2025DroneGame-Team');
      const headers = ['時間戳記', '隊長姓', '隊長名', '隊員1姓', '隊員1名', '隊員2姓', '隊員2名', '團隊外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet, headers.length);
    } else {
      Logger.log("已找到現有團隊競賽工作表");
    }
    
    // 生成時間戳記
    const timestamp = new Date().toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei' 
    });
    
    // 記錄關鍵字段的值
    Logger.log("隊長: " + (params.lastName || '') + (params.firstName || ''));
    Logger.log("隊員1: " + (params.teamMember1LastName || '') + (params.teamMember1FirstName || ''));
    Logger.log("隊員2: " + (params.teamMember2LastName || '') + (params.teamMember2FirstName || ''));
    Logger.log("電子信箱: " + (params.email || ''));
    Logger.log("團隊外號: " + (params.teamName || ''));
    Logger.log("自備飛機: " + (params.ownDrone || ''));
    
    // 準備要寫入的數據行
    const rowData = [
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
    
    // 寫入數據到試算表
    Logger.log("嘗試寫入數據到團隊競賽工作表");
    sheet.appendRow(rowData);
    Logger.log("團隊競賽數據已寫入試算表");
    
    // 發送郵件通知
    try {
      sendEmailNotification(params, "入門無人機團體解題競速闖關賽");
      Logger.log("郵件通知已發送");
    } catch (emailError) {
      Logger.log("發送郵件通知失敗: " + emailError);
      // 即使郵件發送失敗，我們仍然繼續處理
    }
    
    // 返回成功頁面
    Logger.log("團隊競賽表單處理完成");
    return createSuccessResponse("入門無人機團體解題競速闖關賽報名資料已成功提交！");
  } catch (error) {
    Logger.log("處理團隊競賽表單時出錯: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    throw error; // 重新拋出錯誤，讓主函數處理
  }
}

// 格式化標題行
function formatHeaderRow(sheet, columnsCount) {
  sheet.getRange(1, 1, 1, columnsCount)
    .setBackground("#3a0088")
    .setFontColor("white")
    .setFontWeight("bold");
  
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, columnsCount);
}

// 創建成功響應頁面
function createSuccessResponse(message) {
  return HtmlService.createHtmlOutput(
    '<html><body>' +
    '<div style="text-align:center; font-family: Arial, sans-serif; margin-top: 50px;">' +
    '<h2 style="color: #3a0088;">' + message + '</h2>' +
    '<p>感謝您的報名，我們已收到您的資料。</p>' +
    '<p>請關閉此視窗返回主頁面。</p>' +
    '</div>' +
    '</body></html>'
  );
}

// 發送郵件通知
function sendEmailNotification(params, eventType) {
  try {
    // 構建郵件正文
    let name = (params.lastName || "") + (params.firstName || "");
    let emailSubject = "新報名通知：" + eventType;
    
    let emailBody = "新報名資訊：\n\n";
    emailBody += "活動類型: " + eventType + "\n";
    emailBody += "姓名: " + name + "\n";
    emailBody += "電子信箱: " + (params.email || "") + "\n";
    emailBody += "連絡電話: " + (params.phone || "") + "\n";
    
    // 根據活動類型添加特定資訊
    if (eventType === "無人機與穿越機研習") {
      emailBody += "身份: " + (params.identity || "") + "\n";
      
      if (params.identity === "學生") {
        emailBody += "學校: " + (params.school || "") + "\n";
        emailBody += "科系與年級: " + (params.department || "") + "\n";
      } 
      else if (params.identity === "教師") {
        emailBody += "學校: " + (params.teacherSchool || "") + "\n";
        emailBody += "科系: " + (params.teacherDepartment || "") + "\n";
        emailBody += "職稱: " + (params.teacherTitle || "") + "\n";
      }
      else if (params.identity === "社會人士") {
        emailBody += "職業: " + (params.profession || "") + "\n";
        emailBody += "公司: " + (params.company || "") + "\n";
      }
    }
    else if (eventType === "穿越無人機競速闖關賽") {
      emailBody += "飛手外號: " + (params.callSign || "") + "\n";
      emailBody += "團傳: " + (params.transmission || "") + "\n";
      emailBody += "飛機尺寸: " + (params.size || "") + "\n";
      emailBody += "學校: " + (params.school || "") + "\n";
      emailBody += "指導老師: " + (params.teacher || "") + "\n";
    }
    else if (eventType === "入門無人機競速闖關賽") {
      emailBody += "飛手外號: " + (params.callSign || "") + "\n";
      emailBody += "自備飛機: " + (params.ownDrone || "") + "\n";
      emailBody += "學校: " + (params.school || "") + "\n";
      emailBody += "指導老師: " + (params.teacher || "") + "\n";
    }
    else if (eventType === "入門無人機團體解題競速闖關賽") {
      emailBody += "隊長: " + name + "\n";
      emailBody += "隊員1: " + (params.teamMember1LastName || "") + (params.teamMember1FirstName || "") + "\n";
      emailBody += "隊員2: " + (params.teamMember2LastName || "") + (params.teamMember2FirstName || "") + "\n";
      emailBody += "團隊外號: " + (params.teamName || "") + "\n";
      emailBody += "自備飛機: " + (params.ownDrone || "") + "\n";
      emailBody += "學校: " + (params.school || "") + "\n";
      emailBody += "指導老師: " + (params.teacher || "") + "\n";
    }
    
    emailBody += "\n提交時間: " + new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
    
    // 發送郵件給管理員
    MailApp.sendEmail({
      to: "fgchen@gmail.com",
      subject: emailSubject,
      body: emailBody
    });
    
    // 發送確認郵件給參與者
    if (params.email) {
      let confirmationBody = "親愛的 " + name + "，\n\n";
      confirmationBody += "感謝您報名參加『2025弘光科大穿越機研習與競賽』的「" + eventType + "」活動。\n\n";
      confirmationBody += "我們已經收到您的報名資料，詳情如下：\n\n";
      
      // 添加報名資料摘要
      confirmationBody += emailBody;
      
      confirmationBody += "\n\n活動相關資訊將透過此電子郵件地址通知您。如有任何問題，請隨時與我們聯繫。\n\n";
      confirmationBody += "祝您有個美好的一天！\n\n";
      confirmationBody += "弘光科技大學 穿越機研習與競賽團隊";
      
      MailApp.sendEmail({
        to: params.email,
        subject: "【報名確認】" + eventType,
        body: confirmationBody
      });
    }
    
    Logger.log("郵件通知發送成功");
  } catch(error) {
    Logger.log("發送郵件通知時出錯: " + error);
  }
}

// 初始化所有試算表
function setupAllSheets() {
  const ss = getSpreadsheet();
  
  // 設置研習活動工作表
  let workshopSheet = ss.getSheetByName('2025DroneGame-Workshop');
  if (!workshopSheet) {
    workshopSheet = ss.insertSheet('2025DroneGame-Workshop');
    const workshopHeaders = [
      "報名時間",
      "活動類型",
      "名",
      "姓",
      "電子信箱",
      "連絡電話",
      "身份",
      "學校名稱(學生)",
      "科系與年級(學生)",
      "學校名稱(教師)",
      "科系(教師)",
      "職稱(教師)",
      "職業(社會人士)",
      "公司名稱(社會人士)"
    ];
    workshopSheet.getRange(1, 1, 1, workshopHeaders.length).setValues([workshopHeaders]);
    formatHeaderRow(workshopSheet, workshopHeaders.length);
  }
  
  // 設置FPV競賽工作表
  let fpvSheet = ss.getSheetByName('2025DroneGame-FPV');
  if (!fpvSheet) {
    fpvSheet = ss.insertSheet('2025DroneGame-FPV');
    const fpvHeaders = ['時間戳記', '姓', '名', '飛手外號', '團傳', '飛機尺寸', '電子信箱', '連絡電話', '學校', '指導老師'];
    fpvSheet.getRange(1, 1, 1, fpvHeaders.length).setValues([fpvHeaders]);
    formatHeaderRow(fpvSheet, fpvHeaders.length);
  }
  
  // 設置初學者競賽工作表
  let beginnerSheet = ss.getSheetByName('2025DroneGame-Beginner');
  if (!beginnerSheet) {
    beginnerSheet = ss.insertSheet('2025DroneGame-Beginner');
    const beginnerHeaders = ['時間戳記', '姓', '名', '飛手外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'];
    beginnerSheet.getRange(1, 1, 1, beginnerHeaders.length).setValues([beginnerHeaders]);
    formatHeaderRow(beginnerSheet, beginnerHeaders.length);
  }
  
  // 設置團隊競賽工作表
  let teamSheet = ss.getSheetByName('2025DroneGame-Team');
  if (!teamSheet) {
    teamSheet = ss.insertSheet('2025DroneGame-Team');
    const teamHeaders = ['時間戳記', '隊長姓', '隊長名', '隊員1姓', '隊員1名', '隊員2姓', '隊員2名', '團隊外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'];
    teamSheet.getRange(1, 1, 1, teamHeaders.length).setValues([teamHeaders]);
    formatHeaderRow(teamSheet, teamHeaders.length);
  }
  
  Logger.log("所有工作表已設置完成");
}

// 測試郵件發送功能
function testEmail() {
  try {
    Logger.log("測試發送郵件到 fgchen@gmail.com");
    MailApp.sendEmail({
      to: "fgchen@gmail.com",
      subject: "測試郵件 - 統一表單處理系統",
      body: "這是一封測試郵件，用於確認郵件發送功能是否正常工作。"
    });
    Logger.log("測試郵件發送成功");
    return "測試郵件已發送";
  } catch(error) {
    Logger.log("測試郵件發送失敗: " + error);
    return "測試郵件發送失敗: " + error.toString();
  }
}

// 測試寫入試算表 (執行此函數來測試權限和試算表ID是否正確)
function testWriteToSheet() {
  try {
    Logger.log("開始測試寫入試算表，使用ID: " + SPREADSHEET_ID);
    
    // 記錄當前用戶和權限信息
    try {
      const email = Session.getActiveUser().getEmail();
      Logger.log("當前用戶: " + email);
    } catch (e) {
      Logger.log("無法獲取當前用戶: " + e);
    }
    
    // 測試1: 嘗試打開試算表 - 使用 getSpreadsheet()
    Logger.log("測試1: 使用 getSpreadsheet() 打開試算表");
    try {
      const ss = getSpreadsheet();
      const name = ss.getName();
      const url = ss.getUrl();
      Logger.log("成功獲取試算表: " + name);
      Logger.log("試算表URL: " + url);
      
      // 列出所有工作表
      const sheets = ss.getSheets();
      Logger.log("試算表包含 " + sheets.length + " 個工作表");
      for (let i = 0; i < sheets.length; i++) {
        Logger.log("工作表 " + i + ": " + sheets[i].getName());
      }
    } catch (error) {
      Logger.log("測試1失敗 - 無法打開試算表: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    // 測試2: 嘗試使用其他方法打開試算表
    Logger.log("測試2: 直接使用 SpreadsheetApp.openById 打開試算表");
    try {
      const ss2 = SpreadsheetApp.openById(SPREADSHEET_ID);
      Logger.log("成功直接通過 openById 打開試算表: " + ss2.getName());
    } catch (error) {
      Logger.log("測試2失敗 - 無法通過 openById 打開試算表: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    // 測試3: 嘗試使用 getActiveSpreadsheet 方法
    Logger.log("測試3: 使用 SpreadsheetApp.getActiveSpreadsheet() 打開試算表");
    try {
      const ss3 = SpreadsheetApp.getActiveSpreadsheet();
      if (ss3) {
        Logger.log("成功通過 getActiveSpreadsheet 獲取試算表: " + ss3.getName());
      } else {
        Logger.log("getActiveSpreadsheet() 返回 null 或 undefined");
      }
    } catch (error) {
      Logger.log("測試3失敗 - 無法通過 getActiveSpreadsheet 獲取試算表: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    // 測試4: 嘗試寫入測試數據
    Logger.log("測試4: 嘗試寫入測試數據");
    try {
      // 使用方法1獲取試算表
      const ss = getSpreadsheet();
      
      // 嘗試使用現有工作表或創建新工作表
      let testSheet = ss.getSheetByName('測試工作表');
      if (!testSheet) {
        Logger.log("創建新的測試工作表");
        testSheet = ss.insertSheet('測試工作表');
      } else {
        Logger.log("使用現有測試工作表");
      }
      
      // 嘗試寫入測試數據
      const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      testSheet.appendRow(["測試時間", timestamp, "測試數據1"]);
      Logger.log("成功寫入測試數據到測試工作表");
      
      // 手動強制保存
      SpreadsheetApp.flush();
      Logger.log("強制保存更改完成");
      
      return "測試完成：所有測試都成功執行";
    } catch (error) {
      Logger.log("測試4失敗 - 無法寫入數據: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
      return "測試失敗: " + error.toString();
    }
  } catch(error) {
    Logger.log("測試過程中出現總體錯誤: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    return "測試整體失敗: " + error.toString();
  }
}

// 完整重置並初始化試算表
function resetAndInitializeSheets() {
  try {
    // 獲取試算表
    const ss = getSpreadsheet();
    Logger.log("已連接到試算表: " + ss.getName());
    
    // 獲取所有工作表
    const allSheets = ss.getSheets();
    
    // 確保至少保留一個工作表 (Google要求)
    if (allSheets.length > 1) {
      // 刪除除第一個外的所有工作表
      for (let i = 1; i < allSheets.length; i++) {
        ss.deleteSheet(allSheets[i]);
      }
    }
    
    // 清空第一個工作表
    const firstSheet = allSheets[0];
    firstSheet.clear();
    
    // 設置四個主要工作表
    const workshopSheet = ss.insertSheet('2025DroneGame-Workshop');
    const workshopHeaders = [
      "報名時間",
      "活動類型",
      "名",
      "姓",
      "電子信箱",
      "連絡電話",
      "身份",
      "學校名稱(學生)",
      "科系與年級(學生)",
      "學校名稱(教師)",
      "科系(教師)",
      "職稱(教師)",
      "職業(社會人士)",
      "公司名稱(社會人士)"
    ];
    workshopSheet.getRange(1, 1, 1, workshopHeaders.length).setValues([workshopHeaders]);
    formatHeaderRow(workshopSheet, workshopHeaders.length);
    
    const fpvSheet = ss.insertSheet('2025DroneGame-FPV');
    const fpvHeaders = ['時間戳記', '姓', '名', '飛手外號', '團傳', '飛機尺寸', '電子信箱', '連絡電話', '學校', '指導老師'];
    fpvSheet.getRange(1, 1, 1, fpvHeaders.length).setValues([fpvHeaders]);
    formatHeaderRow(fpvSheet, fpvHeaders.length);
    
    const beginnerSheet = ss.insertSheet('2025DroneGame-Beginner');
    const beginnerHeaders = ['時間戳記', '姓', '名', '飛手外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'];
    beginnerSheet.getRange(1, 1, 1, beginnerHeaders.length).setValues([beginnerHeaders]);
    formatHeaderRow(beginnerSheet, beginnerHeaders.length);
    
    const teamSheet = ss.insertSheet('2025DroneGame-Team');
    const teamHeaders = ['時間戳記', '隊長姓', '隊長名', '隊員1姓', '隊員1名', '隊員2姓', '隊員2名', '團隊外號', '自備飛機', '電子信箱', '連絡電話', '學校', '指導老師'];
    teamSheet.getRange(1, 1, 1, teamHeaders.length).setValues([teamHeaders]);
    formatHeaderRow(teamSheet, teamHeaders.length);
    
    // 手動強制保存
    SpreadsheetApp.flush();
    
    Logger.log("成功重置並初始化所有工作表");
    return "試算表重置並初始化成功";
  } catch(error) {
    Logger.log("重置試算表時出錯: " + error);
    return "重置試算表失敗: " + error.toString();
  }
}

// 測試試算表權限和訪問
function testSpreadsheetPermissions() {
  try {
    Logger.log("開始測試試算表權限");
    
    // 獲取當前腳本的訪問權
    try {
      Logger.log("檢查當前執行用戶");
      const email = Session.getEffectiveUser().getEmail();
      Logger.log("當前執行用戶: " + email);
    } catch (e) {
      Logger.log("無法獲取當前執行用戶: " + e);
    }
    
    // 檢查試算表 ID 是否有效
    Logger.log("檢查試算表ID是否有效: " + SPREADSHEET_ID);
    if (!SPREADSHEET_ID || SPREADSHEET_ID.trim() === "") {
      return "錯誤: 試算表ID為空或無效";
    }
    
    // 嘗試訪問試算表
    try {
      Logger.log("嘗試訪問試算表");
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      Logger.log("成功通過ID訪問試算表: " + ss.getName());
      
      // 檢查是否有編輯權限
      try {
        Logger.log("檢查編輯權限");
        const testSheet = ss.getSheetByName('權限測試');
        
        if (!testSheet) {
          // 嘗試創建新工作表以測試編輯權限
          Logger.log("嘗試創建新工作表測試編輯權限");
          const newSheet = ss.insertSheet('權限測試');
          newSheet.getRange(1, 1).setValue("權限測試 - " + new Date().toLocaleString());
          Logger.log("成功創建新工作表，確認有編輯權限");
          
          // 刪除測試工作表
          ss.deleteSheet(newSheet);
          Logger.log("已刪除測試工作表");
        } else {
          // 如果已存在，則嘗試寫入
          testSheet.getRange(1, 1).setValue("權限測試 - " + new Date().toLocaleString());
          Logger.log("成功寫入現有工作表，確認有編輯權限");
        }
      } catch (editError) {
        Logger.log("無法編輯試算表: " + editError);
        return "權限錯誤: 腳本可以訪問試算表，但無法編輯。錯誤: " + editError.toString();
      }
      
      // 檢查工作表狀態
      const sheets = ss.getSheets();
      Logger.log("試算表包含 " + sheets.length + " 個工作表:");
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        Logger.log((i+1) + ". " + sheet.getName() + " (行: " + sheet.getLastRow() + ", 列: " + sheet.getLastColumn() + ")");
      }
      
      return "權限測試成功: 腳本可以讀取和編輯試算表";
    } catch (accessError) {
      Logger.log("無法訪問試算表: " + accessError);
      return "訪問錯誤: 無法訪問試算表。錯誤: " + accessError.toString();
    }
  } catch (error) {
    Logger.log("權限測試過程中出現錯誤: " + error);
    return "測試失敗: " + error.toString();
  }
}

// 模擬表單提交測試
function testFormSubmission() {
  try {
    Logger.log("開始模擬表單提交測試");
    
    // 模擬研習活動表單提交
    Logger.log("1. 模擬研習活動表單提交");
    const workshopParams = {
      eventType: "無人機與穿越機研習",
      firstName: "測試",
      lastName: "用戶",
      email: "test@example.com",
      phone: "0912345678",
      identity: "學生",
      school: "弘光科技大學",
      department: "智慧科技應用系 二年級"
    };
    
    try {
      const workshopResult = handleWorkshopForm(workshopParams);
      Logger.log("研習活動表單處理結果: 成功");
    } catch (error) {
      Logger.log("研習活動表單處理錯誤: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    // 模擬FPV競賽表單提交
    Logger.log("2. 模擬FPV競賽表單提交");
    const fpvParams = {
      eventType: "穿越無人機競速闖關賽",
      firstName: "測試",
      lastName: "飛手",
      email: "test.pilot@example.com",
      phone: "0923456789",
      callSign: "测试飛手",
      transmission: "數位",
      size: "5寸",
      school: "弘光科技大學",
      teacher: "陳老師"
    };
    
    try {
      const fpvResult = handleFPVForm(fpvParams);
      Logger.log("FPV競賽表單處理結果: 成功");
    } catch (error) {
      Logger.log("FPV競賽表單處理錯誤: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    // 模擬初學者競賽表單提交
    Logger.log("3. 模擬初學者競賽表單提交");
    const beginnerParams = {
      eventType: "入門無人機競速闖關賽",
      firstName: "小",
      lastName: "初學者",
      email: "beginner@example.com",
      phone: "0934567890",
      callSign: "新手",
      ownDrone: "是",
      school: "弘光科技大學",
      teacher: "王老師"
    };
    
    try {
      const beginnerResult = handleBeginnerForm(beginnerParams);
      Logger.log("初學者競賽表單處理結果: 成功");
    } catch (error) {
      Logger.log("初學者競賽表單處理錯誤: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    // 模擬團隊競賽表單提交
    Logger.log("4. 模擬團隊競賽表單提交");
    const teamParams = {
      eventType: "入門無人機團體解題競速闖關賽",
      firstName: "隊長",
      lastName: "測試",
      teamMember1FirstName: "隊員1",
      teamMember1LastName: "王",
      teamMember2FirstName: "隊員2",
      teamMember2LastName: "李",
      email: "team@example.com",
      phone: "0945678901",
      teamName: "測試團隊",
      ownDrone: "否",
      school: "弘光科技大學",
      teacher: "張老師"
    };
    
    try {
      const teamResult = handleTeamForm(teamParams);
      Logger.log("團隊競賽表單處理結果: 成功");
    } catch (error) {
      Logger.log("團隊競賽表單處理錯誤: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    Logger.log("模擬表單提交測試完成");
    return "模擬表單提交測試完成，請檢查各個表單工作表是否有新增數據";
  } catch (error) {
    Logger.log("模擬表單提交測試過程中出現錯誤: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    return "模擬測試失敗: " + error.toString();
  }
}

// 直接模擬POST請求測試
function testDirectPostRequest() {
  try {
    Logger.log("開始直接模擬POST請求測試");
    
    // 模擬研習活動POST請求
    Logger.log("1. 模擬研習活動POST請求");
    const workshopEvent = {
      parameter: {
        eventType: "無人機與穿越機研習",
        firstName: "直接",
        lastName: "測試",
        email: "direct.test@example.com",
        phone: "0912345678",
        identity: "教師",
        teacherSchool: "弘光科技大學",
        teacherDepartment: "智慧科技應用系",
        teacherTitle: "助理教授"
      }
    };
    
    try {
      const workshopResponse = doPost(workshopEvent);
      Logger.log("研習活動POST請求處理結果: 成功");
    } catch (error) {
      Logger.log("研習活動POST請求處理錯誤: " + error);
      Logger.log("錯誤堆疊: " + (error.stack || "無堆疊信息"));
    }
    
    Logger.log("直接模擬POST請求測試完成");
    return "直接模擬POST請求測試完成，請檢查各個表單工作表是否有新增數據";
  } catch (error) {
    Logger.log("直接模擬POST請求測試過程中出現錯誤: " + error);
    if (error.stack) {
      Logger.log("錯誤堆疊: " + error.stack);
    }
    return "模擬POST請求測試失敗: " + error.toString();
  }
} 