# convert markdown-it-emoji list to json

This script converts markdown-it-emoji list to json to be used for autocompletion in penflow.

## Usage

```bash
# install dependencies
pnpm i
cd scripts/emoji

# create and install virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install chompjs

# run script
python3 markdown-it-emoji-converter.py ../../node_modules/.pnpm/markdown-it-emoji@3.0.0/node_modules/markdown-it-emoji/lib/data/full.mjs -o ../../src/lib/json/emoji.json --minify
```

## License

This script is licensed under the same license as penflow. See [LICENSE](../../LICENSE)
