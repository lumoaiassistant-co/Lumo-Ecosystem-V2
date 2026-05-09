import ollama
import time

MODEL_NAME = "llama3.2" 
PROMPT = "Write a short poem about a robot learning to love."

def benchmark_model():
    print(f"\n--- 🚀 BENCHMARKING: {MODEL_NAME} ---")
    print(f"Prompt: {PROMPT}\n")
    print("Generating response... (Please wait)\n")

    start_time = time.time()
    
    try:
        response = ollama.generate(model=MODEL_NAME, prompt=PROMPT)
    except Exception as e:
        print(f"ERROR: Could not connect to Ollama. Is it running? {e}")
        return

    end_time = time.time()
    
    # --- EXTRACT METRICS FROM OLLAMA RESPONSE ---
    # Ollama returns durations in nanoseconds (1e9 ns = 1 second)
    
    # 1. Output Speed (Generation)
    eval_count = response.get('eval_count', 0)          # Number of tokens generated
    eval_duration_ns = response.get('eval_duration', 0) # Time taken (nanoseconds)
    eval_duration_s = eval_duration_ns / 1e9
    tokens_per_sec = eval_count / eval_duration_s if eval_duration_s > 0 else 0

    # 2. Input Speed (Prompt Processing)
    prompt_eval_count = response.get('prompt_eval_count', 0)
    prompt_duration_ns = response.get('prompt_eval_duration', 0)
    prompt_duration_s = prompt_duration_ns / 1e9
    prompt_tps = prompt_eval_count / prompt_duration_s if prompt_duration_s > 0 else 0

    # 3. Total Wall Time
    total_duration_s = response.get('total_duration', 0) / 1e9

    # --- DISPLAY RESULTS ---
    print("="*40)
    print("       📊 PERFORMANCE REPORT       ")
    print("="*40)
    print(f"Response: {response['response'].strip()[:50]}... (truncated)")
    print("-" * 40)
    
    print(f"1. GENERATION SPEED (Speed of talking):")
    print(f"   Tokens Generated: {eval_count}")
    print(f"   Time Taken:       {eval_duration_s:.2f}s")
    print(f"   Speed:            {tokens_per_sec:.2f} tokens/sec")
    
    print("-" * 40)
    print(f"2. PROMPT PROCESSING (Speed of reading):")
    print(f"   Tokens Read:      {prompt_eval_count}")
    print(f"   Time Taken:       {prompt_duration_s:.2f}s")
    print(f"   Speed:            {prompt_tps:.2f} tokens/sec")

    print("-" * 40)
    print(f"3. OVERALL STATS:")
    print(f"   Total Time:       {total_duration_s:.2f}s")
    print(f"   Model Load Time:  {(response.get('load_duration', 0)/1e9):.4f}s")
    print("="*40)

    # --- RATING ---
    if tokens_per_sec > 30:
        print("RESULT: ⚡ EXTREMELY FAST (Real-time voice capable)")
    elif tokens_per_sec > 15:
        print("RESULT: ✅ GOOD (Comfortable for chat)")
    elif tokens_per_sec > 5:
        print("RESULT: ⚠️ SLOW (Might feel laggy)")
    else:
        print("RESULT: ❌ VERY SLOW (Need smaller model or GPU)")

if __name__ == "__main__":
    benchmark_model()