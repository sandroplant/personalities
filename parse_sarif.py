import json

# Path to the SARIF file
sarif_file_path = '/Users/aniavsa/Desktop/personalities/results.sarif'

# Load the JSON content from the SARIF file
with open(sarif_file_path, 'r') as file:
    data = json.load(file)

# Debug: Print the top-level keys
print("Top-level keys:", data.keys())

# Extract the runs
runs = data.get('runs', [])
if not runs:
    print("No runs found in the SARIF file.")
else:
    # Debug: Print the keys in the first run
    print("Keys in the first run:", runs[0].keys())

    # Extract the tool
    tool = runs[0].get('tool', {})
    if not tool:
        print("No tool found in the first run.")
    else:
        # Debug: Print the keys in the tool
        print("Keys in the tool:", tool.keys())

        # Extract the driver
        driver = tool.get('driver', {})
        if not driver:
            print("No driver found in the tool.")
        else:
            # Debug: Print the keys in the driver
            print("Keys in the driver:", driver.keys())

            # Extract the rules
            rules = driver.get('rules', [])
            if not rules:
                print("No rules found in the driver.")
            else:
                # Print the details of each rule
                for rule in rules:
                    print(f"ID: {rule['id']}")
                    print(f"Name: {rule['name']}")
                    print(f"Short Description: {rule['shortDescription']['text']}")
                    print(f"Full Description: {rule['fullDescription']['text']}")
                    print(f"Default Configuration: {rule['defaultConfiguration']}")
                    print(f"Properties: {rule['properties']}")
                    print("\n")