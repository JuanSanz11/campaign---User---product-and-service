#!/bin/bash
# Este script inicia el túnel de Ngrok usando tu dominio estático gratuito.
# De esta manera, n8n siempre tendrá la misma URL pública y no tendrás que editar Docker.

echo "Iniciando Ngrok con la URL estática: https://afoot-parting-caterer.ngrok-free.dev"
./ngrok http --domain=afoot-parting-caterer.ngrok-free.dev 5678
