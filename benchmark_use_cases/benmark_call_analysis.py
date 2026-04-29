"""
Benchmark Script for Call Analysis
Compares GPT-4 mini vs GPT-5 mini performance on call analysis tasks.
"""
import asyncio
import json
import time
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

from openai import OpenAI
import dotenv
dotenv.load_dotenv(override=True)

BENCHMARK_DIR = Path(__file__).parent
TEST_CASES_FILE = BENCHMARK_DIR / "call_analysis.json"
RESULTS_FILE = BENCHMARK_DIR / "benchmark_results.json"

# OPENAI_MODEL_GPT4 = "gpt-4o-mini"
OPENAI_MODEL_GPT5 = "gpt-4o-mini"
OPENAI_MODEL_GPT4 = "gpt-4.1-nano"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)
models = client.models.list()

for m in models.data:
    print(m.id)

SYSTEM_PROMPT = """You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand customers and make better sales decisions.

Analyze conversations and provide insights in the following JSON format:
{
    "customer_needs": ["need1", "need2", "need3"],
    "buying_intent": "high|medium|low",
    "interest_level": "very_high|high|medium|low|very_low",
    "pain_points": ["pain1", "pain2"],
    "sentiment": "positive|neutral|negative",
    "funnel_stage": "lead|qualified|negotiation|close",
    "key_topics": ["topic1", "topic2", "topic3"],
    "objections": ["objection1", "objection2"],
    "recommended_actions": [
        {
            "action": "action_description",
            "priority": "high|medium|low",
            "reason": "why this action is recommended"
        }
    ],
    "suggested_responses": [
        {
            "situation": "when to use this response",
            "response": "the suggested response text",
            "tone": "professional|friendly|empathetic"
        }
    ],
    "next_best_questions": ["question1", "question2", "question3"],
    "product_recommendations": [
        {
            "product": "product_name",
            "reason": "why recommend this product",
            "fit_score": "high|medium|low"
        }
    ],
    "summary": "Brief summary of the conversation and customer state"
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Be specific and actionable
- Base insights on actual conversation content
- Provide realistic recommendations
"""


def format_conversation(conversation_history: List[Dict[str, Any]]) -> str:
    """Format conversation history for the prompt."""
    text = ""
    for msg in conversation_history:
        msg_type = msg.get("type", "incoming")
        content = msg.get("content", "")
        timestamp = msg.get("created_at", "")
        role = "Customer" if msg_type == "incoming" else "Sales Rep"
        text += f"[{role} - {timestamp}]: {content}\n"
    return text.strip()


def build_prompt(test_case: Dict[str, Any]) -> str:
    """Build the full prompt from a test case."""
    customer = test_case.get("customer_profile", {})
    campaign = test_case.get("campaign_context", {})
    conversation = format_conversation(test_case.get("conversation_history", []))

    customer_context = f"""Customer Profile:
- Name: {customer.get('first_name', '')} {customer.get('last_name', '')}
- Company: {customer.get('company', 'N/A')}
- Job Title: {customer.get('job_title', 'N/A')}
- Email: {customer.get('email', 'N/A')}"""

    campaign_context = f"""Campaign Context:
- Campaign Name: {campaign.get('name', 'N/A')}
- Campaign Type: {campaign.get('type', 'N/A')}
- Call Script: {campaign.get('call_script', 'N/A')}"""

    prompt = f"""{customer_context}

{campaign_context}

Conversation History:
{conversation}

Analyze this conversation and provide insights in JSON format."""

    return prompt


async def call_openai(prompt: str, model: str = OPENAI_MODEL_GPT4, timeout: int = 60) -> Optional[Dict[str, Any]]:
    """Call OpenAI API (GPT-4 mini or GPT-5 mini)."""
    try:
        if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
            print(f"  [OpenAI-{model}] OPENAI_API_KEY not configured")
            return None

        client = OpenAI(api_key=OPENAI_API_KEY)

        kwargs = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "max_completion_tokens": 2000
        }

        if "gpt-5" not in model:
            kwargs["temperature"] = 0.3

        response = client.chat.completions.create(**kwargs)

        content = response.choices[0].message.content.strip()

        if not content:
            print(f"  [OpenAI-{model}] Empty response")
            return None

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(content[start : end + 1])
            print(f"  [OpenAI-{model}] Failed to parse JSON response")
            return None

    except Exception as e:
        print(f"  [OpenAI-{model}] Error: {str(e)}")
        return None


async def call_gpt5_mini(prompt: str, timeout: int = 60) -> Optional[Dict[str, Any]]:
    """Call GPT-5 mini API."""
    return await call_openai(prompt, model=OPENAI_MODEL_GPT5, timeout=timeout)


async def run_single_test(
    test_case: Dict[str, Any],
    llm_type: int
) -> Dict[str, Any]:
    """Run a single test case with the specified LLM (1=GPT4-mini, 2=GPT5-mini)."""
    test_id = test_case.get("id", "unknown")
    test_name = test_case.get("name", "Unknown")

    prompt = build_prompt(test_case)

    start_time = time.time()

    if llm_type == 1:
        print(f"  Running with GPT-4 mini...")
        result = await call_openai(prompt, model=OPENAI_MODEL_GPT4)
        llm_name = "GPT-4 mini"
    else:
        print(f"  Running with GPT-5 mini...")
        result = await call_gpt5_mini(prompt)
        llm_name = "GPT-5 mini"

    elapsed = time.time() - start_time

    return {
        "test_id": test_id,
        "test_name": test_name,
        "llm_type": llm_type,
        "llm_name": llm_name,
        "success": result is not None,
        "result": result,
        "elapsed_seconds": round(elapsed, 2)
    }


async def run_benchmark(llm_type: int) -> List[Dict[str, Any]]:
    """Run all test cases with the specified LLM type (1=GPT4-mini, 2=GPT5-mini)."""
    llm_name = "GPT-4 mini" if llm_type == 1 else "GPT-5 mini"
    print(f"\n{'='*60}")
    print(f"Running benchmark with {llm_name}")
    print(f"{'='*60}\n")

    with open(TEST_CASES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    test_cases = data.get("test_cases", [])
    results = []

    for i, test_case in enumerate(test_cases, 1):
        print(f"[{i}/{len(test_cases)}] Test: {test_case.get('name', 'Unknown')}")
        result = await run_single_test(test_case, llm_type)
        results.append(result)

        if result["success"]:
            print(f"  [OK] Success ({result['elapsed_seconds']}s)")
        else:
            print(f"  [FAIL] Failed")

        await asyncio.sleep(1)

    return results


def compare_results(
    gpt4_results: List[Dict[str, Any]],
    gpt5_results: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Compare results between GPT-4 mini and GPT-5 mini."""
    comparison = {
        "gpt4_mini": {
            "total_tests": len(gpt4_results),
            "successful": sum(1 for r in gpt4_results if r["success"]),
            "failed": sum(1 for r in gpt4_results if not r["success"]),
            "avg_time_seconds": round(
                sum(r["elapsed_seconds"] for r in gpt4_results if r["success"]) /
                max(sum(1 for r in gpt4_results if r["success"]), 1),
                2
            )
        },
        "gpt5_mini": {
            "total_tests": len(gpt5_results),
            "successful": sum(1 for r in gpt5_results if r["success"]),
            "failed": sum(1 for r in gpt5_results if not r["success"]),
            "avg_time_seconds": round(
                sum(r["elapsed_seconds"] for r in gpt5_results if r["success"]) /
                max(sum(1 for r in gpt5_results if r["success"]), 1),
                2
            )
        }
    }

    for i, (g4, g5) in enumerate(zip(gpt4_results, gpt5_results)):
        if g4["success"] and g5["success"]:
            g4_result = g4["result"] or {}
            g5_result = g5["result"] or {}

            comparison[f"test_{i+1}"] = {
                "test_id": g4.get("test_id"),
                "test_name": g4.get("test_name"),
                "gpt4_analysis": {
                    "buying_intent": g4_result.get("buying_intent"),
                    "interest_level": g4_result.get("interest_level"),
                    "sentiment": g4_result.get("sentiment"),
                    "pain_points_count": len(g4_result.get("pain_points", [])),
                    "objections_count": len(g4_result.get("objections", []))
                },
                "gpt5_analysis": {
                    "buying_intent": g5_result.get("buying_intent"),
                    "interest_level": g5_result.get("interest_level"),
                    "sentiment": g5_result.get("sentiment"),
                    "pain_points_count": len(g5_result.get("pain_points", [])),
                    "objections_count": len(g5_result.get("objections", []))
                }
            }

    return comparison


async def main():
    """Main benchmark execution."""
    import argparse
    parser = argparse.ArgumentParser(description="Call Analysis Benchmark")
    parser.add_argument("--llm", type=int, choices=[1, 2, 3], default=3,
                       help="1=GPT-4 mini only, 2=GPT-5 mini only, 3=Both (default)")
    args = parser.parse_args()

    print("\n" + "="*70)
    print("CALL ANALYSIS BENCHMARK - OpenAI vs Claude Haiku")
    print("="*70)

    print(f"\nTest cases loaded from: {TEST_CASES_FILE}")

    with open(TEST_CASES_FILE, "r", encoding="utf-8") as f:
        test_data = json.load(f)
    test_count = len(test_data.get("test_cases", []))
    print(f"Total test cases: {test_count}")

    choice = str(args.llm)

    all_results = {
        "benchmark_info": {
            "timestamp": datetime.now().isoformat(),
            "test_cases_file": str(TEST_CASES_FILE),
            "total_test_cases": test_count,
            "models": {
                "gpt4_mini": OPENAI_MODEL_GPT4,
                "gpt5_mini": OPENAI_MODEL_GPT5
            }
        },
        "results": {}
    }

    if choice == "1":
        results = await run_benchmark(llm_type=1)
        all_results["results"]["gpt4_mini"] = results

    elif choice == "2":
        results = await run_benchmark(llm_type=2)
        all_results["results"]["gpt5_mini"] = results

    elif choice == "3":
        gpt4_results = await run_benchmark(llm_type=1)
        all_results["results"]["gpt4_mini"] = gpt4_results

        print("\n" + "="*70)
        print("Switching to GPT-5 mini...")
        print("="*70)

        gpt5_results = await run_benchmark(llm_type=2)
        all_results["results"]["gpt5_mini"] = gpt5_results

        comparison = compare_results(gpt4_results, gpt5_results)
        all_results["comparison"] = comparison

    else:
        print("Invalid choice. Running both by default...")
        gpt4_results = await run_benchmark(llm_type=1)
        all_results["results"]["gpt4_mini"] = gpt4_results

        gpt5_results = await run_benchmark(llm_type=2)
        all_results["results"]["gpt5_mini"] = gpt5_results

        comparison = compare_results(gpt4_results, gpt5_results)
        all_results["comparison"] = comparison

    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print("\n" + "="*70)
    print("BENCHMARK COMPLETE")
    print("="*70)
    print(f"\nResults saved to: {RESULTS_FILE}")

    if "gpt4_mini" in all_results["results"] and "gpt5_mini" in all_results["results"]:
        gpt4_res = all_results["results"]["gpt4_mini"]
        gpt5_res = all_results["results"]["gpt5_mini"]

        print("\n--- Summary ---")
        print(f"GPT-4 mini: {sum(1 for r in gpt4_res if r['success'])}/{len(gpt4_res)} successful, "
              f"avg {all_results['comparison']['gpt4_mini']['avg_time_seconds']}s")
        print(f"GPT-5 mini: {sum(1 for r in gpt5_res if r['success'])}/{len(gpt5_res)} successful, "
              f"avg {all_results['comparison']['gpt5_mini']['avg_time_seconds']}s")

    print()


if __name__ == "__main__":
    asyncio.run(main())
