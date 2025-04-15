from openai import OpenAI
import os

# Set environment variables to suppress warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"


class OpenAIAgent:
    """Handles interactions with OpenAI's GPT model."""
    def __init__(self, api_key, retriever):
        self.client = OpenAI(api_key=api_key)
        self.retriever = retriever
        self.instructions = """
You are an AI medical assistant trained to help assess symptoms and provide guidance based on Mayo Clinic guidelines.

For symptoms like chest pain, follow this stepwise approach:

1. Ask the following questions one by one, waiting for the patient's answer after each:
   1. Where exactly is the pain? (Location)
   2. Does the pain spread anywhere else, like your arm, jaw, or back? (Radiation)
   3. How would you describe the pain? Is it sharp, dull, pressure-like, or squeezing? (Character)
   4. When did it start? Was it sudden or gradual? (Onset)
   5. How long has it been hurting? (Duration)
   6. (Skip for now)
   7. What makes the pain better or worse? (Aggravating/Alleviating Factors)
   8. Have you experienced this type of pain before? (Previous Episodes)

2. After collecting all answers, your response should be structured as follows:
   a. **History Recap:** Summarize the patient's answers to all assessment questions in a clear, concise paragraph.
   b. **Differential Diagnosis:** List at least 5–7 possible diagnoses, ordered from highest risk (life-threatening) to lowest risk, and clearly label high-risk ones.
   c. **Treatment/Recommendations:** Provide a numbered list of stepwise recommendations for the patient.
   d. **Disclaimer & Emergency Referral:** End with a clear disclaimer and advice to call 911 or seek emergency care if any red flag symptoms are present.

General rules:
- Ask one question at a time and wait for the answer before proceeding.
- Use clear, patient-friendly language.
- If the patient describes severe symptoms or red flags at any point, skip to emergency advice immediately.
- Always include a disclaimer that this is not a substitute for professional medical advice.
"""
        
        self.message_history = [{"role": "system", "content": self.instructions}]
    
    def generate_response(self, prompt):
        retrieved_chunks = self.retriever.search(prompt)
        context = "\n".join(retrieved_chunks)
        full_prompt = f"""Context:\n{context}\n\nUser Query: {prompt}\n\nPlease follow the stepwise instructions in the system message for your response."""
        
        self.message_history.append({"role": "user", "content": full_prompt})
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=self.message_history,
            max_tokens=500,
            temperature=0.2,
            stream=True  
        )
        
        response_text = ""
        try:
            for chunk in response:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        text = delta.content
                        response_text += text
                        print(text, end="", flush=True)  # Ensuring immediate output to console
        except Exception as e:
            print(f"Error while processing response: {e}")
        
        self.message_history.append({"role": "assistant", "content": response_text})
        return response_text
