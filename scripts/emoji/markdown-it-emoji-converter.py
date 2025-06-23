import json
import re
import argparse
import chompjs

def convert_emoji_file(js_file_path, minify=False):
    """
    Reads a JS file, parses the default exported object, and converts
    it to a JSON string.

    Args:
        js_file_path (str): The path to the input JavaScript file.
        minify (bool): If True, the output JSON will be minified.
                       Otherwise, it will be pretty-printed.

    Returns:
        A JSON formatted string.
    """
    try:
        # 1. Read the content of the JavaScript file
        with open(js_file_path, 'r', encoding='utf-8') as f:
            js_content = f.read()

        # 2. Extract the object string using a robust regex
        match = re.search(r'\{[\s\S]*\}', js_content)
        if not match:
            raise ValueError("Could not find a JavaScript object in the file.")

        object_string = match.group(0)

        # 3. Parse the JavaScript object string into a Python dictionary
        emoji_data = chompjs.parse_js_object(object_string)

        # 4. Transform the data into the desired final structure
        output_structure = {"emojis": []}
        for shortname, emoji in emoji_data.items():
            output_structure["emojis"].append({
                "emoji": emoji,
                "shortname": f":{shortname}:"
            })

        # 5. Convert to JSON, conditionally minifying the output
        if minify:
            # Minified: no indentation, no spaces after separators
            json_output = json.dumps(
                output_structure,
                ensure_ascii=False,
                separators=(',', ':')
            )
        else:
            # Pretty-printed: 2-space indentation for readability
            json_output = json.dumps(
                output_structure,
                ensure_ascii=False,
                indent=2
            )

        return json_output

    except FileNotFoundError:
        # Using f-strings for formatted error messages
        return f"Error: The file '{js_file_path}' was not found."
    except Exception as e:
        return f"An error occurred: {e}"

# --- Command-Line Execution ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert a JS emoji object to a JSON file.",
        formatter_class=argparse.RawTextHelpFormatter
    )

    parser.add_argument(
        "js_file",
        help="Path to the input JavaScript file (e.g., emojis.js)."
    )
    parser.add_argument(
        "--minify",
        action="store_true",
        help="Output the JSON in a minified format."
    )
    parser.add_argument(
        "-o", "--output",
        help="Optional: Path to the output file. If not provided, prints to console."
    )

    args = parser.parse_args()

    # Call the main function with arguments from the command line
    final_json = convert_emoji_file(args.js_file, minify=args.minify)

    # Handle output
    if "Error:" in final_json:
        print(final_json)
    elif args.output:
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(final_json)
            print(f"✅ Successfully converted and saved to {args.output}")
        except Exception as e:
            print(f"Error writing to file: {e}")
    else:
        print(final_json)
