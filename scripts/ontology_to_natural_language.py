import json
import os
import datetime

def _get_current_timestamp():
    """Generates a timestamp for logging."""
    return datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

def translate_ontology_to_natural_language(ontology_file_path: str):
    """
    Reads the ontology.data.json file and prints its contents in a human-readable format.
    """
    print(f"[{_get_current_timestamp()}] Ontology Translator: Starting translation of '{ontology_file_path}'...")

    if not os.path.exists(ontology_file_path):
        print(f"[{_get_current_timestamp()}] ERROR: Ontology file not found at '{ontology_file_path}'.")
        print("Please ensure AUTO.SCRIBE has been run and 'ontology.data.json' exists in the specified directory.")
        return

    try:
        with open(ontology_file_path, 'r', encoding='utf-8') as f:
            ontology_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[{_get_current_timestamp()}] ERROR: Could not parse '{ontology_file_path}' (invalid JSON): {e}")
        return
    except Exception as e:
        print(f"[{_get_current_timestamp()}] ERROR: Could not read '{ontology_file_path}': {e}")
        return

    print("\n--- Truthseeker's Discovered Ontology ---")
    print("---------------------------------------")

    if not ontology_data:
        print("No truths currently indexed in the ontology database.")
        print("---------------------------------------")
        return

    # Iterate through the top-level contexts (e.g., Memory-Management, Process-Management)
    for context_key, directive_types in ontology_data.items():
        print(f"\nDOMAIN: {context_key.replace('-', ' ').upper()}")
        print(f"---------------------------------------")
        
        # Iterate through the directive types within each context
        for directive_key, nld_entries in directive_types.items():
            print(f"  CONCEPT: {directive_key.replace('-', ' ').upper()}")
            
            # Iterate through individual NLD entries
            for nld_id, nld_info in nld_entries.items():
                outcome = nld_info.get("Expected_Outcome", "No outcome described.")
                source_file = os.path.basename(nld_info.get("Source_File", "Unknown File"))
                signature = nld_info.get("Weave_Signature", "N/A")
                
                # Format for readability
                print(f"    - NLD: {nld_id.replace('NLD_', '')}")
                print(f"      Purpose: {outcome}")
                print(f"      Source: {source_file}")
                # Optional: Add full signature if desired, but keep it concise for 'high-level'
                # print(f"      Signature: {signature}") 
            print("") # Add a blank line between concepts

    print("---------------------------------------")
    print(f"[{_get_current_timestamp()}] Ontology Translator: Translation complete.")

# --- Example Usage ---
if __name__ == "__main__":
    script_directory = os.path.dirname(os.path.abspath(__file__))
    
    # Assuming ontology.data.json is in the same dummy directory used by AUTO.SCRIBE
    ontology_file = os.path.join(script_directory, "temp_linux_docs_for_nld_test", "ontology.data.json")
    
    # Run the translator
    translate_ontology_to_natural_language(ontology_file)

    # You could also provide a direct path:
    # translate_ontology_to_natural_language(/ontology.data.json")
