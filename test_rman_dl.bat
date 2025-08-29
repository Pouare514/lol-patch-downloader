@echo off
echo Test de rman-dl.exe avec le manifest...
echo.

cd "src-tauri\target\release\downloads"

echo Test avec le manifest existant...
echo Manifest: manifest_task_1756506878101.manifest
echo.

if exist "test_download" (
    echo Suppression du dossier de test existant...
    rmdir /s /q "test_download"
)

echo Creation du dossier de test...
mkdir "test_download"

echo Lancement de rman-dl.exe...
echo.
echo Commande: ..\rman-dl.exe --no-progress --no-verify -l none manifest_task_1756506878101.manifest test_download
echo.

..\rman-dl.exe --no-progress --no-verify -l none manifest_task_1756506878101.manifest test_download

echo.
echo Test termine.
echo Contenu du dossier de test:
Test de rman-dl.exe avec arguments simplifiés
