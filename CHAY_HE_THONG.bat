@echo off
title HE THONG IOT NHOM 3
echo ========================================================
echo       KHOI DONG HE THONG IOT - NHOM 3
echo ========================================================
echo 1. Dang mo Cau noi Arduino USB (Port 5000)...
start "Arduino Bridge COM5" cmd /k "node bridge/arduino-bridge.js"

echo 2. Dang khoi dong App Expo Go...
start "Expo Go App" cmd /k "npx expo start"

echo ========================================================
echo   HE THONG DA CHAY XONG! BAN CHI CAN MO APP DE SU DUNG.
echo ========================================================
