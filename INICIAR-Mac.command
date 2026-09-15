#!/bin/bash
cd "$(dirname "$0")"
echo "════════════════════════════════════════════"
echo "  TUESTE · Vista previa de la tienda"
echo "════════════════════════════════════════════"
echo ""
echo "  Abriendo en tu navegador: http://localhost:8000"
echo "  (Para detener el servidor: cierra esta ventana"
echo "   o presiona Control + C)"
echo ""
sleep 1
open "http://localhost:8000" 2>/dev/null
python3 -m http.server 8000
