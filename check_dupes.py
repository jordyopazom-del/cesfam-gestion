
import json

try:
    with open('src/data/personnel.ts', 'r') as f:
        content = f.read()
        # Extract the array content roughly
        import re
        matches = re.findall(r'profession:\s*"([^"]+)"', content)
        unique_profs = sorted(list(set(matches)))
        print("Unique professions in personnel.ts:")
        for p in unique_profs:
            print(f"'{p}'")

    with open('data/personnel.json', 'r') as f:
        data = json.load(f)
        profs = [p['profession'] for p in data]
        unique_profs_json = sorted(list(set(profs)))
        print("\nUnique professions in personnel.json:")
        for p in unique_profs_json:
            print(f"'{p}'")

except Exception as e:
    print(e)
