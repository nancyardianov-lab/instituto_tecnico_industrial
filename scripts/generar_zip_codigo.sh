#!/usr/bin/env bash
# Genera un ZIP con todo el código fuente del proyecto.
# Usa `git archive` que solo incluye archivos tracked (excluye automáticamente
# lo del .gitignore: node_modules, .env*, .next, etc.).
# Luego añade algunos archivos adicionales que NO están en git pero son útiles
# (worklog.md, .env.example ya está tracked).

set -e

PROJECT_ROOT="/home/z/my-project"
OUTPUT_DIR="/home/z/my-project/download"
DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="$OUTPUT_DIR/instituto-tecnico-industrial-codigo-$DATE.zip"

mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_ROOT"

# Eliminar ZIP anterior si existe
rm -f "$OUTPUT_FILE"

# 1. Generar ZIP base con todos los archivos tracked de git
git archive --format=zip --output="$OUTPUT_FILE" HEAD

# 2. Listar contenido y mostrar tamaño
echo "=== ZIP generado ==="
ls -lh "$OUTPUT_FILE"
echo ""
echo "=== Total de archivos en el ZIP ==="
unzip -l "$OUTPUT_FILE" | tail -1
echo ""
echo "=== Primeras 30 entradas ==="
unzip -l "$OUTPUT_FILE" | head -35

echo ""
echo "=== Archivo disponible en ==="
echo "$OUTPUT_FILE"
