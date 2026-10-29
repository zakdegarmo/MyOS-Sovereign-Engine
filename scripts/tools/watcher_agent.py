import time
import json
import os
import sys

STATE_FILE = os.path.join(os.path.dirname(__file__), '../../state.json')

def watch_state():
    print(f"Watcher Agent (Reflection) active.")
    print(f"Monitoring: {os.path.abspath(STATE_FILE)}")
    
    last_modified = 0
    
    while True:
        try:
            if os.path.exists(STATE_FILE):
                current_modified = os.path.getmtime(STATE_FILE)
                if current_modified > last_modified:
                    last_modified = current_modified
                    
                    with open(STATE_FILE, 'r') as f:
                        try:
                            state = json.load(f)
                            timestamp = state.get('timestamp', 'Unknown Time')
                            gem = state.get('activeGem', 'None')
                            module = state.get('activeModule', 'None')
                            
                            print(f"\n[SYNC] {timestamp}")
                            print(f" > Context: {gem}")
                            if module != 'None':
                                print(f" > Focus:   {module}")
                                
                            # Here we could trigger IDE actions, like opening files
                            # or updating the Agent's context.
                            
                        except json.JSONDecodeError:
                            pass # File might be being written to
                            
            time.sleep(0.5)
            
        except KeyboardInterrupt:
            print("\nWatcher stopped.")
            sys.exit(0)
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    watch_state()
