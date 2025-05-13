import time
import random
import redis
import json

r = redis.Redis(host='redis', port=6379, decode_responses=True)

def simulate_vehicle(vehicle_id):
    lat = 40.0 + random.random()
    lon = -95.0 + random.random()
    return {
        "id": vehicle_id,
        "lat": lat,
        "lon": lon,
        "speed": round(random.uniform(30, 70), 1)
    }

while True:
    vehicles = [simulate_vehicle(i) for i in range(1, 6)]
    for vehicle in vehicles:
        r.publish('vehicle_updates', json.dumps(vehicle))
    print("Published vehicle data...")
    time.sleep(.5)

