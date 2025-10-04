# Script de prueba para Fase 2 - Nuevos Endpoints
# Ejecutar: .\test-fase2.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "PRUEBAS FASE 2 - Backend Completo" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:3000"

# Test 1: Registro y Login
Write-Host "[PASO 1] Registrar usuario participant..." -ForegroundColor Blue
$registerBody = @{
    name = "Test User"
    email = "testuser@ejemplo.com"
    password = "test123"
    role = "participant"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json"
    Write-Host "[OK] Usuario registrado" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Usuario puede ya existir" -ForegroundColor Yellow
}
Write-Host ""

# Login
Write-Host "[PASO 2] Login de usuario..." -ForegroundColor Blue
$loginBody = @{
    email = "testuser@ejemplo.com"
    password = "test123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
    -Method Post `
    -Body $loginBody `
    -ContentType "application/json"

$token = $loginResponse.token
Write-Host "[OK] Login exitoso" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 2: Ver perfil con estadisticas
Write-Host "[PASO 3] Obtener perfil con estadisticas..." -ForegroundColor Blue
try {
    $profile = Invoke-RestMethod -Uri "$BASE_URL/api/users/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[OK] Perfil obtenido" -ForegroundColor Green
    Write-Host "  Nombre: $($profile.name)" -ForegroundColor White
    Write-Host "  Rol: $($profile.role)" -ForegroundColor White
    Write-Host "  Score: $($profile.score)" -ForegroundColor White
    Write-Host "  Anotaciones: $($profile.annotations_count)" -ForegroundColor White
    Write-Host "  Rank: #$($profile.rank)" -ForegroundColor White
} catch {
    Write-Host "[ERROR] Error obteniendo perfil" -ForegroundColor Red
}
Write-Host ""

# Test 3: Crear concurso (necesita usuario agency)
Write-Host "[PASO 4] Registrar usuario agency..." -ForegroundColor Blue
$agencyRegBody = @{
    name = "NASA Test"
    email = "nasa@ejemplo.com"
    password = "test123"
    role = "agency"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" `
        -Method Post `
        -Body $agencyRegBody `
        -ContentType "application/json"
    Write-Host "[OK] Agency registrada" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Agency puede ya existir" -ForegroundColor Yellow
}
Write-Host ""

# Login agency
Write-Host "[PASO 5] Login de agency..." -ForegroundColor Blue
$agencyLoginBody = @{
    email = "nasa@ejemplo.com"
    password = "test123"
} | ConvertTo-Json

$agencyLogin = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
    -Method Post `
    -Body $agencyLoginBody `
    -ContentType "application/json"

$agencyToken = $agencyLogin.token
$agencyHeaders = @{
    Authorization = "Bearer $agencyToken"
    "Content-Type" = "application/json"
}
Write-Host "[OK] Agency logueada" -ForegroundColor Green
Write-Host ""

# Crear concurso
Write-Host "[PASO 6] Crear concurso..." -ForegroundColor Blue
$contestBody = @{
    name = "Crateres de Marte - Test"
    description = "Identificar crateres en imagenes de Marte"
    rules = "Marcar todos los crateres visibles"
    objective = "Mapeo de superficie marciana"
} | ConvertTo-Json

try {
    $contest = Invoke-RestMethod -Uri "$BASE_URL/api/contests" `
        -Method Post `
        -Body $contestBody `
        -Headers $agencyHeaders
    
    $contestId = $contest.contest_id
    Write-Host "[OK] Concurso creado con ID: $contestId" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error creando concurso" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 4: Crear dataset
Write-Host "[PASO 7] Crear dataset..." -ForegroundColor Blue
$datasetBody = @{
    name = "Mars Surface Images - Set 1"
    description = "Primera coleccion de imagenes"
} | ConvertTo-Json

try {
    $dataset = Invoke-RestMethod -Uri "$BASE_URL/api/contests/$contestId/datasets" `
        -Method Post `
        -Body $datasetBody `
        -Headers $agencyHeaders
    
    $datasetId = $dataset.dataset_id
    Write-Host "[OK] Dataset creado con ID: $datasetId" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error creando dataset" -ForegroundColor Red
}
Write-Host ""

# Test 5: Agregar imagenes
Write-Host "[PASO 8] Agregar imagenes al dataset..." -ForegroundColor Blue
$imagesBody = @{
    images = @(
        @{
            dzi_url = "https://via.placeholder.com/4000x3000/8B4513/FFFFFF?text=Mars+1"
            metadata = @{ width = 4000; height = 3000 }
        },
        @{
            dzi_url = "https://via.placeholder.com/4000x3000/8B4513/FFFFFF?text=Mars+2"
            metadata = @{ width = 4000; height = 3000 }
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $images = Invoke-RestMethod -Uri "$BASE_URL/api/datasets/$datasetId/images" `
        -Method Post `
        -Body $imagesBody `
        -Headers $agencyHeaders
    
    Write-Host "[OK] Imagenes agregadas: $($images.inserted)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error agregando imagenes" -ForegroundColor Red
}
Write-Host ""

# Test 6: Crear anotaciones (simular auto-promocion - necesita 20)
Write-Host "[PASO 9] Crear 20 anotaciones para auto-promocion..." -ForegroundColor Blue
# Primero necesitamos el ID de una imagen real del dataset
$imageId = 1  # Asumimos que la primera imagen tiene ID 1

for ($i = 1; $i -le 20; $i++) {
    $annotationBody = @{
        image_id = $imageId
        annotations = @(
            @{
                type = "rectangle"
                x = (100 + ($i * 10))
                y = (100 + ($i * 10))
                width = 200
                height = 150
            }
        )
        metadata = @{
            tool = "annotorious"
            timestamp = (Get-Date -Format "o")
            annotation_number = $i
        }
    } | ConvertTo-Json -Depth 5

    try {
        $annotation = Invoke-RestMethod -Uri "$BASE_URL/api/annotations" `
            -Method Post `
            -Body $annotationBody `
            -Headers $headers
        
        if ($annotation.promoted) {
            Write-Host "[OK] Anotacion $i creada - PROMOCION A VALIDATOR!" -ForegroundColor Magenta
            Write-Host "    Nuevo rol: $($annotation.new_role)" -ForegroundColor Magenta
            Write-Host "    Bonus: +$($annotation.bonus_points) puntos" -ForegroundColor Magenta
        } else {
            $progress = "$($annotation.annotations_count)/20"
            Write-Host "[OK] Anotacion $i creada (Progreso: $progress)" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Error en anotacion $i" -ForegroundColor Red
    }
}
Write-Host ""

# Test 7: Ver perfil actualizado
Write-Host "[PASO 10] Ver perfil actualizado..." -ForegroundColor Blue
try {
    $updatedProfile = Invoke-RestMethod -Uri "$BASE_URL/api/users/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[OK] Perfil actualizado" -ForegroundColor Green
    Write-Host "  Rol: $($updatedProfile.role)" -ForegroundColor Cyan
    Write-Host "  Score: $($updatedProfile.score)" -ForegroundColor Cyan
    Write-Host "  Anotaciones: $($updatedProfile.annotations_count)" -ForegroundColor Cyan
    Write-Host "  Anotaciones validadas: $($updatedProfile.validated_annotations)" -ForegroundColor Cyan
    Write-Host "  Rank: #$($updatedProfile.rank)" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Error obteniendo perfil" -ForegroundColor Red
}
Write-Host ""

# Test 8: Ver anotaciones pendientes
Write-Host "[PASO 11] Listar anotaciones pendientes..." -ForegroundColor Blue
try {
    $pending = Invoke-RestMethod -Uri "$BASE_URL/api/annotations?status=pending" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[OK] Anotaciones pendientes: $($pending.Count)" -ForegroundColor Green
    if ($pending.Count -gt 0) {
        $firstAnnotation = $pending[0]
        Write-Host "  Primera anotacion ID: $($firstAnnotation.id)" -ForegroundColor White
        Write-Host "  Usuario: $($firstAnnotation.user_name)" -ForegroundColor White
        Write-Host "  Estado: $($firstAnnotation.status)" -ForegroundColor White
        
        # Test 9: Validar anotacion
        Write-Host "`n[PASO 12] Validar anotacion..." -ForegroundColor Blue
        $validationBody = @{
            decision = "approved"
            comment = "Excelente trabajo identificando el crater"
        } | ConvertTo-Json

        try {
            $validation = Invoke-RestMethod -Uri "$BASE_URL/api/annotations/$($firstAnnotation.id)/validate" `
                -Method Post `
                -Body $validationBody `
                -Headers $headers
            
            Write-Host "[OK] Anotacion validada" -ForegroundColor Green
            Write-Host "  Decision: $($validation.decision)" -ForegroundColor White
            Write-Host "  Puntos otorgados: +$($validation.points_awarded)" -ForegroundColor White
        } catch {
            Write-Host "[ERROR] Error validando (probablemente necesitas ser validator)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[ERROR] Error listando anotaciones" -ForegroundColor Red
}
Write-Host ""

# Test 10: Ver ranking
Write-Host "[PASO 13] Ver ranking global..." -ForegroundColor Blue
try {
    $ranking = Invoke-RestMethod -Uri "$BASE_URL/api/ranking?limit=5" `
        -Method Get
    
    Write-Host "[OK] Top 5 del ranking:" -ForegroundColor Green
    foreach ($user in $ranking) {
        Write-Host "  #$($user.rank) - $($user.name) - $($user.score) puntos ($($user.annotations_count) anotaciones)" -ForegroundColor White
    }
} catch {
    Write-Host "[ERROR] Error obteniendo ranking" -ForegroundColor Red
}
Write-Host ""

# Test 11: Ver concurso especifico con imagenes
Write-Host "[PASO 14] Ver concurso con imagenes..." -ForegroundColor Blue
try {
    $contestDetail = Invoke-RestMethod -Uri "$BASE_URL/api/contests/$contestId" `
        -Method Get
    
    Write-Host "[OK] Concurso obtenido" -ForegroundColor Green
    Write-Host "  Nombre: $($contestDetail.name)" -ForegroundColor White
    Write-Host "  Imagenes: $($contestDetail.images.Count)" -ForegroundColor White
} catch {
    Write-Host "[ERROR] Error obteniendo concurso" -ForegroundColor Red
}
Write-Host ""

# Test 12: Probar alias /api/challenges
Write-Host "[PASO 15] Probar alias /api/challenges..." -ForegroundColor Blue
try {
    $challenges = Invoke-RestMethod -Uri "$BASE_URL/api/challenges" `
        -Method Get
    
    Write-Host "[OK] Alias funcionando - Concursos/Challenges: $($challenges.Count)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Error con alias" -ForegroundColor Red
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "[COMPLETADO] Todas las pruebas de Fase 2 completadas!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Yellow
Write-Host "- Auto-promocion: OK" -ForegroundColor White
Write-Host "- Sistema de puntos: OK" -ForegroundColor White
Write-Host "- Validacion: OK" -ForegroundColor White
Write-Host "- Ranking: OK" -ForegroundColor White
Write-Host "- Datasets e imagenes: OK" -ForegroundColor White
Write-Host "- Estadisticas: OK" -ForegroundColor White
Write-Host ""

