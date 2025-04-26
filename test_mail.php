<?php
// 啟用錯誤顯示
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 記錄環境信息
file_put_contents("mail_debug.log", "===== 開始測試 " . date("Y-m-d H:i:s") . " =====\n", FILE_APPEND);
file_put_contents("mail_debug.log", "PHP版本: " . phpversion() . "\n", FILE_APPEND);
file_put_contents("mail_debug.log", "mail函數存在: " . (function_exists("mail") ? "是" : "否") . "\n", FILE_APPEND);
file_put_contents("mail_debug.log", "服務器: " . $_SERVER["SERVER_SOFTWARE"] . "\n", FILE_APPEND);

// 記錄PHP mail相關設置
file_put_contents("mail_debug.log", "PHP mail設置:\n", FILE_APPEND);
file_put_contents("mail_debug.log", "SMTP設置: " . ini_get('SMTP') . "\n", FILE_APPEND);
file_put_contents("mail_debug.log", "smtp_port設置: " . ini_get('smtp_port') . "\n", FILE_APPEND);
file_put_contents("mail_debug.log", "sendmail_path設置: " . ini_get('sendmail_path') . "\n", FILE_APPEND);

// 獲取已禁用的函數
$disabled = ini_get('disable_functions');
file_put_contents("mail_debug.log", "禁用的函數: " . $disabled . "\n", FILE_APPEND);

// 測試郵件發送
$to = "fgchen@gmail.com";
$subject = "測試郵件 - " . date("Y-m-d H:i:s");
$message = "這是一封測試郵件，發送時間: " . date("Y-m-d H:i:s");

// 添加更多郵件頭信息，嘗試提高送達率
$headers = "From: webmaster@" . $_SERVER["SERVER_NAME"] . "\r\n";
$headers .= "Reply-To: webmaster@" . $_SERVER["SERVER_NAME"] . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 1 (Highest)\r\n";
$headers .= "X-MSMail-Priority: High\r\n";
$headers .= "Importance: High\r\n";

file_put_contents("mail_debug.log", "郵件頭信息: " . $headers . "\n", FILE_APPEND);

// 嘗試發送郵件
$result = mail($to, $subject, $message, $headers);
file_put_contents("mail_debug.log", "郵件發送結果: " . ($result ? "成功" : "失敗") . "\n", FILE_APPEND);

// 如果發送失敗，記錄錯誤信息
if (!$result) {
    $error = error_get_last();
    if ($error) {
        file_put_contents("mail_debug.log", "錯誤信息: " . print_r($error, true) . "\n", FILE_APPEND);
    } else {
        file_put_contents("mail_debug.log", "無詳細錯誤信息\n", FILE_APPEND);
    }
}

file_put_contents("mail_debug.log", "===== 測試結束 " . date("Y-m-d H:i:s") . " =====\n", FILE_APPEND);

// 返回結果
echo "<h1>郵件測試</h1>";
echo "<p>郵件發送結果: " . ($result ? "成功" : "失敗") . "</p>";
echo "<p>請查看 mail_debug.log 文件獲取詳細信息</p>";
echo "<p>請同時檢查您的郵箱 (包括垃圾郵件文件夾)</p>";

// 顯示日誌內容
echo "<h2>日誌內容</h2>";
echo "<pre>";
echo htmlspecialchars(file_get_contents("mail_debug.log"));
echo "</pre>";
?> 