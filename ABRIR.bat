@echo off
title Minha Gibiteca - servidor local

rem Vai para a pasta onde este arquivo esta, nao importa de onde foi aberto.
cd /d "%~dp0"

echo.
echo   MINHA GIBITECA
echo   ------------------------------------------
echo.

rem O Node esta instalado?
where node >nul 2>nul || goto :sem_node

rem Primeira vez? Instala as dependencias.
if not exist "node_modules" (
  echo   Primeira execucao: instalando as dependencias.
  echo   Isso demora alguns minutos, so acontece uma vez.
  echo.
  call npm install || goto :falhou_install
  echo.
)

echo   Subindo o servidor (normalmente http://localhost:5173).
echo   O navegador abre sozinho em instantes.
echo.
echo   Para parar: aperte Ctrl+C ou feche esta janela.
echo   ------------------------------------------
echo.

rem Nao use "if errorlevel 1" com npm: ele sai com codigos NEGATIVOS
rem (ex: -4058) e "if errorlevel 1" significa ">= 1", entao erro passa batido.
rem O operador || testa "diferente de zero" e pega qualquer falha.
call npm run dev || goto :falhou_dev

echo.
echo   ------------------------------------------
echo   O servidor foi encerrado.
echo.
pause
exit /b 0

:sem_node
echo   [ERRO] O Node.js nao foi encontrado neste computador.
echo.
echo   Baixe a versao LTS em https://nodejs.org e instale.
echo   Depois e so abrir este arquivo de novo.
echo.
pause
exit /b 1

:falhou_install
echo.
echo   [ERRO] A instalacao das dependencias falhou.
echo   A mensagem do npm esta logo acima.
echo.
pause
exit /b 1

:falhou_dev
echo.
echo   ------------------------------------------
echo   [ERRO] O servidor parou com erro.
echo.
echo   Leia a mensagem acima. Se nao fizer sentido, mande
echo   esse texto para o Claude Code que ele explica.
echo.
pause
exit /b 1
