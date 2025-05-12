import redis
import json
import eventlet
import eventlet.wsgi
from flask import Flask
from flask_socketio import SocketIO

r = redis.Redis(host='redis', port=6379, decode_responses=True)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

def redis_listener():
    pubsub = r.pubsub()
    pubsub.subscribe('vehicle_updates')
    for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = json.loads(message['data'])
                socketio.emit('vehicle_update', data)
            except Exception as e:
                print(f"Error parsing message: {e}")

@app.route('/')
def index():
    return "Realtime WebSocket server online."

if __name__ == '__main__':
    socketio.start_background_task(redis_listener)
    socketio.run(app, host='0.0.0.0', port=6001)
