@echo off
cd /d "%~dp0"
echo ============================================
echo   TUESTE - Vista previa de la tienda
echo ============================================
echo.
echo   Abriendo en tu navegador: http://localhost:8000
echo   (Para detener: cierra esta ventana)
echo.
timeout /t 1 >nul
start http://localhost:8000
python -m http.server 8000
