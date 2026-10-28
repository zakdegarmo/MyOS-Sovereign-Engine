import requests
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROXY_URL = "http://localhost:8082/api/chat"

def load_dataset(file_path="scripts/benchmarks/dataset_v1.json"):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def evaluate_response(response, expected_keywords):
    response_lower = response.lower()
    matches = sum(1 for kw in expected_keywords if kw.lower() in response_lower)
    score = (matches / len(expected_keywords)) * 100
    return score == 100, score

def run_fight_club():
    print("🥊 Welcome to the AI Fight Club (Local Autonomous Benchmark) 🥊")
    print("="*60)
    
    try:
        dataset = load_dataset()
    except FileNotFoundError:
        print("Error: dataset_v1.json not found.")
        return

    total_tasks = len(dataset)
    passed_tasks = 0
    
    for task in dataset:
        print(f"\n[Task {task['task_id']}] Category: {task['category']}")
        print(f"Problem: {task['prompt']}")
        print("Sending to MyOS Proxy for autonomous ReAct evaluation...")
        
        start_time = time.time()
        
        try:
            res = requests.post(PROXY_URL, json={"message": task['prompt']}, timeout=120)
            res.raise_for_status()
            data = res.json()
            agent_response = data.get("response", "")
            
            elapsed = time.time() - start_time
            print(f"Time Taken: {elapsed:.2f} seconds")
            
            # Evaluate
            passed, score = evaluate_response(agent_response, task['expected_keywords'])
            print(f"Agent Final Output:\n{'-'*30}\n{agent_response}\n{'-'*30}")
            
            if passed:
                print(f"✅ PASSED (Score: {score:.0f}%)")
                passed_tasks += 1
            else:
                print(f"❌ FAILED (Score: {score:.0f}%) - Missing expected context.")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ CONNECTION ERROR: {e}")
            
    print("\n" + "="*60)
    final_score = (passed_tasks / total_tasks) * 100
    print(f"🏆 LEADERBOARD SCORE: {final_score:.0f}% ({passed_tasks}/{total_tasks} solved)")

if __name__ == "__main__":
    run_fight_club()
