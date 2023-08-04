<?php
header('Content-Type: application/json'); // Отправка JSON-ответа

// Подключение к базе данных
$connection = mysqli_connect('127.0.0.1', 'root', '', 'ranking');

// Проверка подключения
if (!$connection) {
    http_response_code(500); // Установка статуса ответа
    echo json_encode(['error' => 'Ошибка подключения к базе данных']);
    exit();
}

// Проверка полученных данных
if (!isset($_POST['ratingName']) || !isset($_POST['ratingTime'])) {
    http_response_code(400); // Установка статуса ответа
    echo json_encode(['error' => 'Отсутствуют необходимые параметры в запросе']);
    exit();
}

// Фильтрация данных перед передачей в запрос
$username = mysqli_real_escape_string($connection, $_POST['ratingName']);
$time = (int) $_POST['ratingTime'];

// Вставка данных в таблицу ranking
$query = "INSERT INTO `ranking`(`username`,`time`) VALUES('{$username}', {$time})";
$result = mysqli_query($connection, $query);

// Проверка результата запроса
if ($result) {
    http_response_code(200);
    echo json_encode(['message' => 'Данные успешно сохранены']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка выполнения запроса']);
}

// Закрытие подключения к базе данных
mysqli_close($connection);
?>