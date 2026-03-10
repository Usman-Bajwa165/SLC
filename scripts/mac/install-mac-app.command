#!/usr/bin/env bash

# Get absolute path of the SLC directory
SLC_DIR=$(cd "$(dirname "$0")/../.." && pwd)
APP_NAME="Start SLC System"
APP_DIR="/Applications/$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

echo "Generating Mac Application in your Applications folder..."

# Create Mac App directory structure
mkdir -p "$MACOS_DIR"

# Create the executable script that points back to the project folder
cat <<EOF > "$MACOS_DIR/$APP_NAME"
#!/usr/bin/env bash
cd "$SLC_DIR"
./scripts/mac/start.command
EOF

# Make it executable
chmod +x "$MACOS_DIR/$APP_NAME"

echo ""
echo "Success! '$APP_NAME' has been added to your Applications folder."
echo "You can now find it in your Launchpad, and you can drag it to your Dock!"
echo ""
