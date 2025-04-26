<?php
// 啟用錯誤顯示和記錄
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 設置日誌文件
$logFile = 'form_submissions.log';

// 記錄請求開始
file_put_contents($logFile, "\n===== 新請求開始 " . date('Y-m-d H:i:s') . " =====\n", FILE_APPEND);
file_put_contents($logFile, "請求方法: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

// 設置允許跨域請求
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// 記錄參數
file_put_contents($logFile, "請求參數:\n", FILE_APPEND);
file_put_contents($logFile, "POST數據: " . print_r($_POST, true) . "\n", FILE_APPEND);

// 獲取POST數據
$formData = $_POST;

// 確定表單類型
$formType = isset($formData['eventType']) ? $formData['eventType'] : '未知競賽';
file_put_contents($logFile, "表單類型: " . $formType . "\n", FILE_APPEND);

// 獲取姓名
$firstName = isset($formData['firstName']) ? $formData['firstName'] : '';
$lastName = isset($formData['lastName']) ? $formData['lastName'] : '';
$fullName = $lastName . $firstName;
file_put_contents($logFile, "報名者姓名: " . $fullName . "\n", FILE_APPEND);

// 獲取當前時間
$submissionTime = date('Y-m-d H:i:s');

// 構建郵件內容
$subject = "新報名通知：" . $formType;
$message = "有新的報名資訊：\n\n";
$message .= "競賽類型：" . $formType . "\n";
$message .= "報名者姓名：" . $fullName . "\n";
$message .= "報名時間：" . $submissionTime . "\n\n";
$message .= "表單詳細信息：\n";

// 添加所有表單字段
foreach ($formData as $key => $value) {
    if (!empty($value)) {
        $message .= $key . ": " . $value . "\n";
    }
}

// 郵件發送設置
$to = "fgchen@gmail.com";
$headers = "From: drone-competition@example.com\r\n";
$headers .= "Reply-To: no-reply@example.com\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// 記錄郵件內容
file_put_contents($logFile, "發送郵件到: " . $to . "\n", FILE_APPEND);
file_put_contents($logFile, "郵件主題: " . $subject . "\n", FILE_APPEND);
file_put_contents($logFile, "郵件內容:\n" . $message . "\n", FILE_APPEND);
file_put_contents($logFile, "郵件頭信息: " . $headers . "\n", FILE_APPEND);

// 嘗試發送郵件並捕獲任何錯誤
try {
    $mailSuccess = mail($to, $subject, $message, $headers);
    file_put_contents($logFile, "郵件發送結果: " . ($mailSuccess ? "成功" : "失敗") . "\n", FILE_APPEND);
    
    if (!$mailSuccess) {
        file_put_contents($logFile, "郵件發送失敗，可能的原因: " . error_get_last()['message'] . "\n", FILE_APPEND);
    }
} catch (Exception $e) {
    file_put_contents($logFile, "郵件發送異常: " . $e->getMessage() . "\n", FILE_APPEND);
    $mailSuccess = false;
}

// 返回結果
$response = array(
    "success" => true,
    "mailSent" => $mailSuccess,
    "message" => $mailSuccess ? "郵件發送成功" : "郵件發送失敗，但表單已提交",
    "time" => $submissionTime,
    "formType" => $formType,
    "name" => $fullName
);

// 記錄響應
file_put_contents($logFile, "響應內容: " . json_encode($response) . "\n", FILE_APPEND);
file_put_contents($logFile, "===== 請求結束 " . date('Y-m-d H:i:s') . " =====\n", FILE_APPEND);

echo json_encode($response);
?>