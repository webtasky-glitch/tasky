@echo off
setlocal enabledelayedexpansion
title Tasky Desktop Application Installer
color 0B

echo =======================================================
echo          TASKY - DESKTOP INSTALLER (.EXE / PWA)
echo =======================================================
echo.
echo Installing Tasky permanently to your Windows PC...
echo.

:: 1. Define Paths and App Settings
set "APP_NAME=Tasky"
set "APP_URL=https://webtasky.com"
set "ICON_URL=https://i.postimg.cc/13414BQq/app-icon.jpg"
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\%APP_NAME%"
set "VBS_SCRIPT=%TEMP%\Tasky_installer_helper.vbs"

echo [*] Creating application directory at:
echo     "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: 2. Download App Icon (.ico / .jpg)
echo.
echo [*] Downloading high-resolution application icon...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Invoke-WebRequest -Uri '%ICON_URL%' -OutFile '%INSTALL_DIR%\app-icon.ico' -UseBasicParsing; Write-Host '    [+] Icon installed successfully.' } catch { Write-Host '    [-] Using default system icon.' }"

:: 3. Detect Chrome / Edge / Brave / Chromium Browsers for Native App Window Mode (--app)
set "BROWSER_EXE="

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BROWSER_EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
)

:: 4. Generate Tasky.exe / Tasky.bat Launcher Executable inside the Install Directory
echo.
echo [*] Creating permanent standalone launcher...
(
  echo @echo off
  echo start "" "!BROWSER_EXE!" --app="%APP_URL%" --user-data-dir="%INSTALL_DIR%\User_Data"
) > "%INSTALL_DIR%\Tasky.cmd"

:: 5. Create Desktop and Start Menu Shortcuts with Tasky Icon and Name via PowerShell/VBS
echo.
echo [*] Creating Desktop and Start Menu shortcuts...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -comObject WScript.Shell; ^
   $DesktopPath = [System.Environment]::GetFolderPath('Desktop'); ^
   $StartMenuPath = [System.Environment]::GetFolderPath('Programs'); ^
   $IconPath = '%INSTALL_DIR%\app-icon.ico'; ^
   ^
   $ShortcutDesktop = $WshShell.CreateShortcut(\"$DesktopPath\%APP_NAME%.lnk\"); ^
   $ShortcutDesktop.TargetPath = '!BROWSER_EXE!'; ^
   $ShortcutDesktop.Arguments = '--app=\"%APP_URL%\" --user-data-dir=\"%INSTALL_DIR%\User_Data\"'; ^
   $ShortcutDesktop.Description = 'Tasky Productivity & Workspace Application'; ^
   if (Test-Path $IconPath) { $ShortcutDesktop.IconLocation = \"$IconPath,0\"; } ^
   $ShortcutDesktop.WorkingDirectory = '%INSTALL_DIR%'; ^
   $ShortcutDesktop.Save(); ^
   ^
   $ShortcutStart = $WshShell.CreateShortcut(\"$StartMenuPath\%APP_NAME%.lnk\"); ^
   $ShortcutStart.TargetPath = '!BROWSER_EXE!'; ^
   $ShortcutStart.Arguments = '--app=\"%APP_URL%\" --user-data-dir=\"%INSTALL_DIR%\User_Data\"'; ^
   $ShortcutStart.Description = 'Tasky Productivity & Workspace Application'; ^
   if (Test-Path $IconPath) { $ShortcutStart.IconLocation = \"$IconPath,0\"; } ^
   $ShortcutStart.WorkingDirectory = '%INSTALL_DIR%'; ^
   $ShortcutStart.Save(); ^
   Write-Host '    [+] Shortcuts created on Desktop and in Start Menu!'"

:: 6. Register Tasky in Windows "Apps & Features" / Control Panel (Uninstall Support)
echo.
echo [*] Registering Tasky into Windows Installed Applications...
set "REG_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\%APP_NAME%"

reg add "%REG_KEY%" /v "DisplayName" /d "%APP_NAME%" /f >nul 2>&1
reg add "%REG_KEY%" /v "DisplayVersion" /d "1.0.0" /f >nul 2>&1
reg add "%REG_KEY%" /v "Publisher" /d "Tasky Workspace" /f >nul 2>&1
reg add "%REG_KEY%" /v "DisplayIcon" /d "%INSTALL_DIR%\app-icon.ico" /f >nul 2>&1
reg add "%REG_KEY%" /v "InstallLocation" /d "%INSTALL_DIR%" /f >nul 2>&1
reg add "%REG_KEY%" /v "UninstallString" /d "cmd.exe /c rmdir /s /q \"%INSTALL_DIR%\" ^& reg delete \"%REG_KEY%\" /f" /f >nul 2>&1

echo.
echo =======================================================
echo             INSTALLATION COMPLETE!
echo =======================================================
echo Tasky is now installed permanently on your computer!
echo - Desktop Shortcut created: "Tasky"
echo - Start Menu Shortcut created: "Tasky"
echo - Full windowed native app experience with official icon.
echo.
echo Launching Tasky now...
start "" "!BROWSER_EXE!" --app="%APP_URL%" --user-data-dir="%INSTALL_DIR%\User_Data"

timeout /t 3 >nul
exit /b 0
