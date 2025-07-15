#!/bin/bash

set -e
echo "---- WhiteBot VPS Auto Setup ----"

# Where you want your code on the server
APP_ROOT="/opt/whitebot"
FRONTEND="$APP_ROOT/web_dashboard/frontend"
BACKEND="$APP_ROOT/web_dashboard/backend"

# 1. System dependencies
apt update
apt install -y python3 python3-venv python3-pip nginx git build-essential curl

# 2. Node.js (for frontend build)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. (Optional) Clone repo if not already there
# git clone https://github.com/yourname/yourrepo.git $APP_ROOT

cd $APP_ROOT

# 4. Python venv + pip for backend
cd $BACKEND
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install gunicorn eventlet flask flask_cors flask_socketio  # add your other requirements

# 5. Build React frontend
cd $FRONTEND
npm install
npm run build
cd $APP_ROOT

# 6. Gunicorn systemd service (with eventlet for Socket.IO support)
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

# 7. Nginx config (serving frontend build, proxying API/WebSocket)
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

echo "---- Setup complete! ----"
echo "Visit http://YOUR-VPS-IP/ or your domain!"

echo "If you want HTTPS, run:"
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx"
