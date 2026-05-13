#!/bin/bash

# ─────────────────────────────────────────────
#  setup.sh — Installer og start nettbutikk
#  Legg denne filen i rotmappen til prosjektet
# ─────────────────────────────────────────────

set -e

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Colour

VENV_DIR=".venv"
PORT=5000
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${MAGENTA}========================================${NC}"
echo -e "  ${MAGENTA}Nettbutikk — Oppsett og oppstart${NC}"
echo -e "${MAGENTA}========================================${NC}"

# 1 - Installer python og venv (virtual enviroment)
echo ""
echo -e "${GREEN}[1/4] Installerer Python3.12 og Python3.12-venv...${NC}"

sudo apt-get update -qq
sudo apt-get install -y python3.12 python3.12-venv

echo -e "      ${GREEN}✓ $(python3.12 --version) installert${NC}"

# 2 - Opprett og aktiver .venv
echo ""
echo -e "${GREEN}[2/4] Setter opp .venv${NC}"

if [ ! -d "$VENV_DIR" ]; then
    python3.12 -m venv "$VENV_DIR"
    echo -e "      ${GREEN}✓ Venv opprettet${NC}"
else
    echo -e "      ${YELLOW}✓ Venv finnes allerede${NC}"
fi

source "$VENV_DIR/bin/activate"
echo -e "      ${GREEN}✓ Venv aktivert${NC}"

# 3 - Installerer -r requirements.txt
echo ""
echo -e "${GREEN}[3/4] Installerer avhengigheter...${NC}"

# Finn requirements.txt
if [ -f "requirements.txt" ]; then
    pip install --quiet -r requirements.txt
    echo -e "      ${GREEN}✓ Installert fra requirements.txt${NC}"
else
    echo -e "      ${RED}⚠ Ingen requirements.txt funnet — installerer Flask...${NC}"
    pip install --quiet Flask
    echo -e "      ${YELLOW}✓ Flask installert${NC}"
fi

# 4 - Åpne port og start Flask (app.py)
echo ""
echo -e "${GREEN}[4/4] Åpne port $PORT og starter server...${NC}"

if command -v ufw &>/dev/null; then
    sudo ufw allow "$PORT"/tcp 2>/dev/null \
        && echo -e "      ${GREEN}✓ Port ${CYAN}$PORT åpnet${NC}" \
        || echo -e "      ${RED}⚠ Kunne ikke åpne port (prøv å kjøre med sudo)${NC}"
fi

# Finn app.py

if [ ! -f "app.py" ]; then
    echo ""
    echo -e "  ${RED}✗ FEIL: Finner ikke app.py${NC}"
    echo -e "  ${CYAN}Sjekk at setup.sh ligger i rotmappen til prosjektet.${NC}"
    deactivate
    exit 1
fi

sed -i 's/    app.run(debug=True)/    # app.run(debug=True)/' app.py
sed -i 's/    # app.run(host="0.0.0.0", port=5000)/    app.run(host="0.0.0.0", port=5000)/' app.py
echo ""
echo -e "${GREEN}✓ Configured app.py for LAN hosting${NC}"

echo ""
echo -e "${GREEN}========================================"
echo -e "  Åpne i nettleseren: http://localhost:$PORT"
echo -e "  Åpne i nettleseren: http://$SERVER_IP:$PORT"
echo -e "  Stopp serveren:     CTRL+C"
echo -e "========================================${NC}"
echo ""



python app.py