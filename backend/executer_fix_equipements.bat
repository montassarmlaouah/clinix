@echo off
echo ====================================================
echo  Correction de la colonne "etat" dans equipements
echo ====================================================
echo.

REM Modifiez ces variables selon votre configuration PostgreSQL
SET PGUSER=postgres
SET PGPASSWORD=saif
SET PGDATABASE=PFE
SET PGHOST=localhost
SET PGPORT=5432

echo Execution du script SQL...
echo.

psql -U %PGUSER% -d %PGDATABASE% -h %PGHOST% -p %PGPORT% -f "src/main/resources/sql/fix_equipements_final.sql"

echo.
echo ====================================================
echo  Script termine !
echo ====================================================
pause
