#!/bin/bash
# Script para compilar el sitio administrativo de Angular
echo "===================================================="
echo "Compilando Proyecto Angular para WEB (Legacy App)..."
echo "===================================================="

# Ejecuta el build de Angular usando la configuracion de produccion por defecto
ng build --configuration production

if [ $? -eq 0 ]; then
    echo "===================================================="
    echo "✅ Compilación exitosa!"
    echo "📂 Los archivos se encuentran en: dist/legacy-app"
    echo "===================================================="
else
    echo "===================================================="
    echo "❌ Error en la compilación."
    echo "===================================================="
    exit 1
fi
