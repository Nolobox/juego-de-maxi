@echo off
rem Enciende el servidor del juego para jugar desde el iPhone o la tablet (mismo wifi).
rem Doble clic para encenderlo. Para apagarlo, cerrar esta ventana.
title Servidor del juego de Maxi
cd /d "%~dp0.."

netstat -ano | findstr /r /c:"TCP.*:8080 .*LISTENING" >nul
if not errorlevel 1 (
  echo.
  echo  El servidor del juego ya estaba encendido.
  echo  Puedes cerrar esta ventana.
  echo.
  pause
  exit /b
)

echo.
echo  Servidor del juego de Maxi
echo  --------------------------
echo  En el iPhone o la tablet (mismo wifi) abre:
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet' -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1).IPAddress"`) do echo     http://%%i:8080
echo.
echo  Deja esta ventana abierta mientras se juega. Cerrarla apaga el juego.
echo.
npx -y serve@14 -l tcp://0.0.0.0:8080 .
pause
