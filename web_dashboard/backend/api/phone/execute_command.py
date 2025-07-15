import paramiko
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
import subprocess
import threading

app = Flask(__name__)
socketio = SocketIO(app)

# SSH credentials
IP_ADDRESS = "192.168.0.45"
SSH_USER = "mobile"  # Replace with your iPhone's SSH user
SSH_PASSWORD = "Tobi0601"  # Replace with your mobile SSH password

# Function to execute SSH commands on the iPhone
def execute_ssh_command(command: str):
    try:
        # Set up SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(IP_ADDRESS, username=SSH_USER, password=SSH_PASSWORD)

        # Execute the command
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        ssh.close()

        return output, error
    except Exception as e:
        return f"Error: {str(e)}", ""

# Flask route to execute commands
@app.route("/api/execute_command", methods=["POST"])
def execute_command():
    data = request.json
    command = data.get("command")
    if not command:
        return jsonify({"error": "Command is required"}), 400

    output, error = execute_ssh_command(command)
    return jsonify({"output": output, "error": error})

# WebSocket handling for VNC (iPhone screen) streaming
@socketio.on('connect')
def handle_connect():
    print("WebSocket Connected")
    # Add VNC setup or control here if needed

@socketio.on('disconnect')
def handle_disconnect():
    print("WebSocket Disconnected")
    # Clean up any active VNC connections or resources

if __name__ == "__main__":
    threading.Thread(target=socketio.run, args=(app,)).start()
    app.run(port=5000, debug=False, use_reloader=False)
