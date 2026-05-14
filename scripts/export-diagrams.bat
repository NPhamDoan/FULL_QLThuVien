@echo off
echo === Export PlantUML Diagrams to PNG ===
echo.
echo Yeu cau: Java Runtime (java -version) + plantuml.jar
echo Download plantuml.jar tai: https://plantuml.com/download
echo.

cd %~dp0..

set PUML_DIR=.kiro\document\diagrams
set OUT_DIR=.kiro\document\diagrams\png

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

REM Check if plantuml.jar exists
if not exist "scripts\plantuml.jar" (
    echo [ERROR] Khong tim thay scripts\plantuml.jar
    echo Download tu https://plantuml.com/download va dat vao folder scripts\
    exit /b 1
)

echo Exporting all .puml files to PNG...
java -jar scripts\plantuml.jar -tpng -o "%CD%\%OUT_DIR%" "%PUML_DIR%\*.puml"

echo.
echo === Done! Check folder: %OUT_DIR% ===
dir /b "%OUT_DIR%\*.png"
