import json
import os

def convert():
    input_path = r"c:\Users\zakde\.gemini\antigravity\scratch\MyOS\apps\web\src\Thought\data\dewey_mapping.json"
    output_path = r"c:\Users\zakde\.gemini\antigravity\scratch\MyOS\apps\web\src\Thought\data\DeweyData.ts"
    
    with open(input_path, 'r') as f:
        mapping = json.load(f)
    
    # Flip mapping: code -> name
    # Since there are multiple names for one code, we might want to be careful.
    # We'll use the longest name or handle specifically.
    code_to_name = {}
    for name, code in mapping.items():
        if code not in code_to_name or len(name) > len(code_to_name[code]):
            code_to_name[code] = name

    # Ensure 000-900 main classes exist
    main_classes = {
        "000": "Computer Science, Information & General Works",
        "100": "Philosophy & Psychology",
        "200": "Religion",
        "300": "Social Sciences",
        "400": "Language",
        "500": "Pure Science",
        "600": "Technology",
        "700": "Arts & Recreation",
        "800": "Literature",
        "900": "History & Geography"
    }
    
    for code, name in main_classes.items():
        if code not in code_to_name:
            code_to_name[code] = name

    # Build hierarchy
    tree = []
    
    # 1st level: 000, 100, ...
    for i in range(10):
        code1 = f"{i}00"
        name1 = code_to_name.get(code1, f"Class {code1}")
        node1 = {"code": code1, "name": name1, "children": []}
        
        # 2nd level: 010, 020, ... (within 000)
        for j in range(10):
            code2 = f"{i}{j}0"
            name2 = code_to_name.get(code2)
            if name2:
                node2 = {"code": code2, "name": name2, "children": []}
                
                # 3rd level: 011, 012...
                for k in range(1, 10):
                    code3 = f"{i}{j}{k}"
                    name3 = code_to_name.get(code3)
                    if name3:
                        node2["children"].append({"code": code3, "name": name3})
                
                node1["children"].append(node2)
        
        tree.append(node1)

    # Output as TypeScript
    with open(output_path, 'w') as f:
        f.write("export interface DeweyNode {\n")
        f.write("    code: string;\n")
        f.write("    name: string;\n")
        f.write("    children?: DeweyNode[];\n")
        f.write("}\n\n")
        f.write("export const DEWEY_DATA: DeweyNode[] = ")
        f.write(json.dumps(tree, indent=4))
        f.write(";\n")

if __name__ == "__main__":
    convert()
