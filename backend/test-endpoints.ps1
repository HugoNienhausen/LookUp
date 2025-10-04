# Script de prueba para endpoints del backend (PowerShell)
# Ejecutar: .\test-endpoints.ps1

Write-Host "Pruebas de Backend - LookUp API" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:3000"

# 1. Test: Servidor activo
Write-Host "1. Test: Servidor activo" -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri $BASE_URL -Method Get
    if ($response -eq "¡El servidor está funcionando!") {
        Write-Host "[OK] Servidor funcionando correctamente" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Servidor no responde" -ForegroundColor Red
    Write-Host "   Asegurate de que el servidor este corriendo: node server.js" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Test: Registro de usuario
Write-Host "2. Test: Registro de usuario" -ForegroundColor Blue
$registerBody = @{
    name = "Usuario Test"
    email = "test@ejemplo.com"
    password = "test123"
    role = "participant"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json"
    
    Write-Host "[OK] Usuario registrado exitosamente" -ForegroundColor Green
    $registerResponse | ConvertTo-Json
} catch {
    Write-Host "[AVISO] Error en registro (puede que el usuario ya exista)" -ForegroundColor Yellow
    $_.Exception.Response
}
Write-Host ""

# 3. Test: Login de usuario
Write-Host "3. Test: Login de usuario" -ForegroundColor Blue
$loginBody = @{
    email = "test@ejemplo.com"
    password = "test123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "[OK] Login exitoso" -ForegroundColor Green
    $loginResponse | ConvertTo-Json
    
    $token = $loginResponse.token
    Write-Host "Token: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Error en login" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Test: Obtener perfil de usuario
Write-Host "4. Test: Obtener perfil de usuario" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $profileResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[OK] Perfil obtenido correctamente" -ForegroundColor Green
    $profileResponse | ConvertTo-Json
} catch {
    Write-Host "[ERROR] Error obteniendo perfil" -ForegroundColor Red
}
Write-Host ""

# 5. Test: Listar concursos
Write-Host "5. Test: Listar concursos" -ForegroundColor Blue
try {
    $contestsResponse = Invoke-RestMethod -Uri "$BASE_URL/api/contests" -Method Get
    Write-Host "[OK] Endpoint de concursos funciona" -ForegroundColor Green
    $contestsResponse | ConvertTo-Json
} catch {
    Write-Host "[ERROR] Error listando concursos" -ForegroundColor Red
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "[COMPLETADO] Pruebas completadas" -ForegroundColor Green
Write-Host ""
Write-Host "NOTA: Guarda este token para pruebas adicionales:" -ForegroundColor Yellow
Write-Host $token -ForegroundColor Cyan

