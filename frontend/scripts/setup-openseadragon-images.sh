#!/bin/bash

# Script para instalar las imágenes de control de OpenSeadragon
# Ejecutar desde el directorio frontend/

echo "🔧 Configurando imágenes de OpenSeadragon..."

# Crear directorio si no existe
mkdir -p public/openseadragon-images

# Descargar y extraer imágenes
echo "📥 Descargando imágenes de control..."
cd public/openseadragon-images

# Descargar el repositorio temporalmente
if command -v git &> /dev/null; then
    echo "📦 Clonando repositorio de OpenSeadragon..."
    git clone --depth 1 https://github.com/openseadragon/openseadragon.git temp-osd
    cp -r temp-osd/images/* ./
    rm -rf temp-osd
    echo "✅ Imágenes instaladas correctamente"
else
    echo "❌ Git no está instalado. Instalando manualmente..."
    
    # Descargar ZIP si git no está disponible
    if command -v curl &> /dev/null; then
        curl -L https://github.com/openseadragon/openseadragon/archive/master.zip -o osd.zip
        if command -v unzip &> /dev/null; then
            unzip osd.zip
            cp -r openseadragon-master/images/* ./
            rm -rf openseadragon-master osd.zip
            echo "✅ Imágenes instaladas correctamente"
        else
            echo "❌ Unzip no está instalado. Instala las imágenes manualmente."
            exit 1
        fi
    else
        echo "❌ Curl no está instalado. Instala las imágenes manualmente."
        exit 1
    fi
fi

cd ../..

echo "🎉 Configuración completada!"
echo "📁 Las imágenes están en: public/openseadragon-images/"
echo "🚀 Ahora puedes ejecutar: npm run dev"
