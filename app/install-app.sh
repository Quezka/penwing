#!/usr/bin/env bash
# Installs the Penwing launcher: command, menu entry and icon (per user).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p ~/.local/bin ~/.local/share/applications ~/.local/share/icons/hicolor/256x256/apps
ln -sf "$PWD/app/penwing" ~/.local/bin/penwing
# Absolute icon path: GNOME Shell does not see new theme icons until re-login.
ICON="$HOME/.local/share/icons/hicolor/256x256/apps/penwing.png"
gjs -m tools/make-icon.js "$ICON" 256 >/dev/null
sed -e "s|^Exec=penwing|Exec=$HOME/.local/bin/penwing|" \
    -e "s|^Icon=penwing|Icon=$ICON|" app/penwing.desktop \
  > ~/.local/share/applications/penwing.desktop
gtk-update-icon-cache -q ~/.local/share/icons/hicolor 2>/dev/null || true
update-desktop-database -q ~/.local/share/applications 2>/dev/null || true
echo "Penwing launcher installed. Open 'Penwing' from the app grid to start or stop it."
