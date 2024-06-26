import asyncio
import websockets
import json
import time

actions = []
motor_status = "Idle"
connected_clients = set()

async def broadcast_motor_status():
    if connected_clients:
        message = json.dumps({"type": "motor_status", "status": motor_status})
        await asyncio.gather(
            *[client.send(message) for client in connected_clients]
        )

async def execute_action(action):
    global motor_status
    print(f"Executing action: Motor {action['type']}")
    motor_status = f"Running {action['type']}"
    await broadcast_motor_status()
    
    duration = action.get('duration', 60)
    await asyncio.sleep(duration)
    
    motor_status = "Idle"
    await broadcast_motor_status()
    print(f"Action completed: Motor {action['type']}")

async def time_server(websocket, path):
    global motor_status
    connected_clients.add(websocket)
    try:
        while True:
            current_time = int(time.time())
            await websocket.send(json.dumps({"type": "time", "time": current_time}))
            await websocket.send(json.dumps({"type": "motor_status", "status": motor_status}))
            
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                data = json.loads(message)
                if data['type'] == 'add_action':
                    actions.append(data['action'])
                    print(f"Action added: {data['action']}")
                elif data['type'] == 'remove_action':
                    if 0 <= data['index'] < len(actions):
                        del actions[data['index']]
                        print(f"Action removed at index {data['index']}")
            except asyncio.TimeoutError:
                pass
            except json.JSONDecodeError:
                print("Received invalid JSON data")
            
            # Check and execute actions
            for action in actions[:]:
                action_time = time.strptime(action['time'], "%H:%M")
                current_time_struct = time.localtime(current_time)
                if action_time.tm_hour == current_time_struct.tm_hour and action_time.tm_min == current_time_struct.tm_min:
                    await execute_action(action)
                    actions.remove(action)
            
            await asyncio.sleep(1)
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        connected_clients.remove(websocket)

async def main():
    server = await websockets.serve(time_server, "localhost", 8765)
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())