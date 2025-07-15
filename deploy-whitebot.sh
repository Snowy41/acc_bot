#!/bin/bash

# ----- CONFIG -----
APP_ROOT="/opt/whitebot"
FRONTEND="$APP_ROOT/web_dashboard/frontend"
BACKEND="$APP_ROOT/web_dashboard/backend"

# -- Begin Script --
set -e
echo "---- WhiteBot Full VPS Setup ----"

# 1. System packages
apt update
apt install -y python3 python3-venv python3-pip nginx git build-essential curl

# 2. Node.js (for Vite/React)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. Clone or copy code to $APP_ROOT as needed
# git clone https://github.com/yourname/yourrepo.git $APP_ROOT

# 4. Backend setup
cd "$BACKEND"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

pip install \
  gunicorn eventlet flask flask_cors flask_socketio \
  fastapi starlette \
  requests \
  discord.py \
  aiosqlite \
  bcrypt \
  paramiko \
  playwright \
  aiohttp \
  twocaptcha \
  beautifulsoup4 \
  Flask-Limiter \
  python-dotenv

# 5. Playwright browser install (needed for playwright to actually run)
playwright install

# 6. Frontend build
cd "$FRONTEND"
npm install
npm run build

# 7. Gunicorn + eventlet as systemd service
cat >/etc/systemd/system/whitebot.service <<EOF
[Unit]
Description=WhiteBot Gunicorn Service
After=network.target

[Service]
User=root
WorkingDirectory=$BACKEND
ExecStart=$BACKEND/venv/bin/gunicorn -k eventlet -w 1 -b 127.0.0.1:8000 main:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable whitebot
systemctl restart whitebot

# 8. Nginx config (React frontend + Flask backend/API)
cat >/etc/nginx/sites-available/whitebot <<EOF
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location / {
        root $FRONTEND/dist;
        try_files \$uri /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/whitebot /etc/nginx/sites-enabled/whitebot
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# 9. (Optional) HTTPS via Let's Encrypt
echo
echo "If you want HTTPS, run:"
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx"

echo
echo "---- DONE! ----"
echo "Visit http://YOUR-VPS-IP/ or your domain"
