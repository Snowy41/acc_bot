#!/bin/bash

cd /opt/whitebot   # Your repo path
git pull origin main   # or 'master' or whichever branch you use

# (Optional) Rebuild frontend if needed
cd web_dashboard/frontend
npm install
npm run build

# (Optional) Restart backend service
sudo systemctl restart whitebot
