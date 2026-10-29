import os
import ijson
import json
import time

input_file = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\data\myos_vector_store.json'
output_file = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\data\vector_metadata_index.json'

print(f"Starting extraction from {input_file} (2.88 GB)...")
start_time = time.time()

metadata = {}
count = 0

try:
    with open(input_file, 'rb') as f:
        # ijson.kvitems generates (key, value) pairs from the root object
        # but since value includes the embedding, loading the whole value into memory 
        # might still be slow for 2.88GB if there are huge arrays.
        # Actually, since each object's embedding is just an array of ~1536 floats,
        # it is small enough to fit in memory one at a time.
        
        objects = ijson.kvitems(f, '')
        for key, value in objects:
            # We have the whole object, just drop the embedding
            if 'embedding' in value:
                del value['embedding']
            
            # Truncate text if it's too long, just keeping a preview for the ledger
            if 'text' in value and isinstance(value['text'], str):
                if len(value['text']) > 500:
                    value['text'] = value['text'][:500] + "... [TRUNCATED]"
                    
            metadata[key] = value
            count += 1
            if count % 1000 == 0:
                print(f"Processed {count} entries...")

    print(f"Finished extracting {count} entries in {time.time() - start_time:.2f} seconds.")
    
    print(f"Writing lightweight index to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as out:
        json.dump(metadata, out, indent=2)
    print("Done!")

except Exception as e:
    print(f"Error during extraction: {e}")
