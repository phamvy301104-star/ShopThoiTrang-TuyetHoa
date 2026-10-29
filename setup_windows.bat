@echo off
setlocal
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set "PYTHON=.venv\Scripts\python.exe"
) else (
    set "PYTHON=python"
)

echo [1/3] Cai dependencies...
%PYTHON% -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo [2/3] Tao va cap nhat database...
%PYTHON% manage.py migrate
if errorlevel 1 goto :error

%PYTHON% manage.py seed_catalog
if errorlevel 1 goto :error

echo [3/3] Khoi dong webshop...
start "Shop Thoi Trang" http://127.0.0.1:8000/
%PYTHON% manage.py runserver
exit /b 0

:error
echo.
echo Khong the khoi dong. Kiem tra loi ben tren va chay lai script.
pause
exit /b 1
