<?php
// 啟用錯誤顯示
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 記錄文件
$logFile = "alternative_mail_test.log";
file_put_contents($logFile, "===== 開始測試 " . date("Y-m-d H:i:s") . " =====\n", FILE_APPEND);

// 記錄禁用函數
$disabled = ini_get('disable_functions');
file_put_contents($logFile, "已禁用的函數: " . $disabled . "\n", FILE_APPEND);

// 記錄PHP mail設置
file_put_contents($logFile, "PHP mail相關設置:\n", FILE_APPEND);
file_put_contents($logFile, "SMTP: " . ini_get('SMTP') . "\n", FILE_APPEND);
file_put_contents($logFile, "smtp_port: " . ini_get('smtp_port') . "\n", FILE_APPEND);
file_put_contents($logFile, "sendmail_path: " . ini_get('sendmail_path') . "\n", FILE_APPEND);

// 測試多種郵件頭格式
$to = "fgchen@gmail.com";
$subject = "測試郵件 (備選頭格式) - " . date("Y-m-d H:i:s");
$message = "這是一封測試郵件，使用不同的郵件頭格式\n發送時間: " . date("Y-m-d H:i:s");

// 測試1：基本郵件頭
$headers1 = "From: webmaster@example.com\r\n";
file_put_contents($logFile, "\n測試1：基本郵件頭\n", FILE_APPEND);
file_put_contents($logFile, "郵件頭: " . $headers1 . "\n", FILE_APPEND);

$result1 = @mail($to, $subject . " (測試1)", $message, $headers1);
file_put_contents($logFile, "結果: " . ($result1 ? "成功" : "失敗") . "\n", FILE_APPEND);

// 測試2：完整郵件頭
$headers2 = "From: dronecompetition@example.com\r\n";
$headers2 .= "Reply-To: noreply@example.com\r\n";
$headers2 .= "MIME-Version: 1.0\r\n";
$headers2 .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers2 .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers2 .= "X-Priority: 1\r\n";
$headers2 .= "X-MSMail-Priority: High\r\n";
$headers2 .= "Importance: High\r\n";

file_put_contents($logFile, "\n測試2：完整郵件頭\n", FILE_APPEND);
file_put_contents($logFile, "郵件頭: " . $headers2 . "\n", FILE_APPEND);

$result2 = @mail($to, $subject . " (測試2)", $message, $headers2);
file_put_contents($logFile, "結果: " . ($result2 ? "成功" : "失敗") . "\n", FILE_APPEND);

// 測試3：使用email格式的From頭
$headers3 = "From: Drone Competition <dronecompetition@example.com>\r\n";
$headers3 .= "Reply-To: noreply@example.com\r\n";
$headers3 .= "Content-Type: text/plain; charset=UTF-8\r\n";

file_put_contents($logFile, "\n測試3：使用email格式的From頭\n", FILE_APPEND);
file_put_contents($logFile, "郵件頭: " . $headers3 . "\n", FILE_APPEND);

$result3 = @mail($to, $subject . " (測試3)", $message, $headers3);
file_put_contents($logFile, "結果: " . ($result3 ? "成功" : "失敗") . "\n", FILE_APPEND);

// 獲取錯誤信息
$error = error_get_last();
if ($error) {
    file_put_contents($logFile, "\n最後錯誤信息: " . print_r($error, true) . "\n", FILE_APPEND);
}

// 記錄結果總結
file_put_contents($logFile, "\n測試結果總結:\n", FILE_APPEND);
file_put_contents($logFile, "測試1 (基本郵件頭): " . ($result1 ? "成功" : "失敗") . "\n", FILE_APPEND);
file_put_contents($logFile, "測試2 (完整郵件頭): " . ($result2 ? "成功" : "失敗") . "\n", FILE_APPEND);
file_put_contents($logFile, "測試3 (email格式From): " . ($result3 ? "成功" : "失敗") . "\n", FILE_APPEND);
file_put_contents($logFile, "===== 測試結束 " . date("Y-m-d H:i:s") . " =====\n", FILE_APPEND);

// 輸出結果
echo "<h1>備選郵件頭格式測試</h1>";
echo "<p>測試1 (基本郵件頭): " . ($result1 ? "成功" : "失敗") . "</p>";
echo "<p>測試2 (完整郵件頭): " . ($result2 ? "成功" : "失敗") . "</p>";
echo "<p>測試3 (email格式From): " . ($result3 ? "成功" : "失敗") . "</p>";
echo "<p>請檢查日誌文件 " . $logFile . " 獲取詳細信息</p>";
echo "<p>請同時檢查您的郵箱 (包括垃圾郵件文件夾)</p>";

// 顯示日誌內容
echo "<h2>日誌內容</h2>";
echo "<pre>";
echo htmlspecialchars(file_get_contents($logFile));
echo "</pre>";
?> 