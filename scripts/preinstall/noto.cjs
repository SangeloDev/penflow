/**
 * @description This script copies all Noto Emoji SVG files from the
 * 'noto-emoji' git submodule into a static assets directory.
 * It's designed to be run as part of an npm 'prebuild' or custom setup script.
 */

const fs = require("fs");
const path = require("path");

// --- Configuration ---
// The source directory for the emoji SVGs within the submodule.
const SOURCE_FOLDER_NAME = "svg";

// The source path for the submodule, relative to the project root.
const SUBMODULE_PATH = "submodules/noto-emoji";

// The destination path for the emojis, relative to the project root.
const DESTINATION_PATH = "static/assets/emoji/noto";
// --- End Configuration ---

// Get the project's root directory.
const projectRoot = path.resolve(__dirname, "../../");

// Construct the full source and destination paths.
const sourceDir = path.join(projectRoot, SUBMODULE_PATH, SOURCE_FOLDER_NAME);
const destDir = path.join(projectRoot, DESTINATION_PATH);

/**
 * Main function to execute the copy process.
 */
function run() {
  console.log("Starting Noto Emoji SVG copy process from submodule...");

  // Check if the source directory exists.
  if (!fs.existsSync(sourceDir) || fs.readdirSync(sourceDir).length === 0) {
    console.error(`Error: Source directory not found or is empty at: ${sourceDir}`);
    console.error("This likely means the git submodule has not been initialized or updated.");
    console.error('Please run "git submodule update --init --recursive" in your terminal.');
    process.exit(1); // Exit with an error code.
  }

  // Ensure the destination directory exists, creating it if necessary.
  console.log(`Ensuring destination directory exists: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });

  try {
    // Read all files from the source directory.
    console.log(`Reading files from ${sourceDir}...`);
    const files = fs.readdirSync(sourceDir);

    // Filter for SVG files.
    const svgFiles = files.filter((file) => path.extname(file).toLowerCase() === ".svg");

    if (svgFiles.length === 0) {
      console.warn("Warning: No SVG files were found in the source directory.");
      return;
    }

    // Copy each SVG file to the destination.
    console.log(`Found ${svgFiles.length} SVG files to copy.`);
    let copiedCount = 0;
    svgFiles.forEach((file) => {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(sourcePath, destPath);
      copiedCount++;
    });

    console.log(`Successfully copied ${copiedCount} emoji SVGs to ${destDir}`);
  } catch (error) {
    console.error("An error occurred during the file copy process:", error);
    process.exit(1);
  }
}

// Execute the script.
run();
