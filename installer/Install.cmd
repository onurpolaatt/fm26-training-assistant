@echo off
chcp 65001 >nul
rem Stop early when started from inside the zip (Windows copies only this file to a temp folder)
if not exist "%~dp0install.ps1" goto :notextracted
if not exist "%~dp0assistant.js" goto :notextracted
rem Re-launch elevated when not running as administrator
net session >nul 2>&1
if errorlevel 1 (
  if "%~1"=="" (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  ) else (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -ArgumentList '%*' -Verb RunAs"
  )
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
pause
exit /b

:notextracted
echo.
echo  install.ps1 or assistant.js is missing next to Install.cmd.
echo  You probably opened Install.cmd from inside the zip.
echo  Right-click the zip, choose "Extract All", then run Install.cmd from the extracted folder.
echo.
echo  install.ps1 veya assistant.js, Install.cmd ile ayni klasorde yok.
echo  Install.cmd dosyasini muhtemelen zip in icinden actin.
echo  Zip e sag tikla, "Tumunu ayikla" de ve cikan klasordeki Install.cmd yi calistir.
echo.
pause
exit /b 1
