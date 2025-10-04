#!/bin/bash

# Script de prueba para endpoints del backend
# Ejecutar: bash test-endpoints.sh

echo "🧪 Pruebas de Backend - LookUp API"
echo "=================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base
BASE_URL="http://localhost:3000"

echo -e "${BLUE}1. Test: Servidor activo${NC}"
response=$(curl -s $BASE_URL)
if [ "$response" == "¡El servidor está funcionando!" ]; then
    echo -e "${GREEN}✓ Servidor funcionando correctamente${NC}"
else
    echo -e "${RED}✗ Error: Servidor no responde${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}2. Test: Registro de usuario${NC}"
register_response=$(curl -s -X POST $BASE_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Usuario Test","email":"test@ejemplo.com","password":"test123","role":"participant"}')

echo "$register_response" | grep -q "Usuario registrado correctamente"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Usuario registrado exitosamente${NC}"
    echo "$register_response"
else
    echo -e "${RED}✗ Error en registro (puede que el usuario ya exista)${NC}"
    echo "$register_response"
fi
echo ""

echo -e "${BLUE}3. Test: Login de usuario${NC}"
login_response=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@ejemplo.com","password":"test123"}')

echo "$login_response"
token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$token" ]; then
    echo -e "${GREEN}✓ Login exitoso${NC}"
    echo -e "Token: ${token:0:30}..."
else
    echo -e "${RED}✗ Error en login${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}4. Test: Obtener perfil de usuario${NC}"
profile_response=$(curl -s $BASE_URL/api/users/me \
    -H "Authorization: Bearer $token")

echo "$profile_response"
echo "$profile_response" | grep -q '"email":"test@ejemplo.com"'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Perfil obtenido correctamente${NC}"
else
    echo -e "${RED}✗ Error obteniendo perfil${NC}"
fi
echo ""

echo -e "${BLUE}5. Test: Listar concursos${NC}"
contests_response=$(curl -s $BASE_URL/api/contests)
echo "$contests_response"
echo -e "${GREEN}✓ Endpoint de concursos funciona${NC}"
echo ""

echo "=================================="
echo -e "${GREEN}✅ Pruebas completadas${NC}"
echo ""
echo "💡 Guarda este token para pruebas adicionales:"
echo "$token"

