/**
 * @description This script acts as a runner for preinstall scripts.
 * It executes them sequentially in alphabetical order.
 * It's designed to be called from an npm script (e.g., "preinstall").
 * The script will exit with an error if any of the sub-scripts fail.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// The name of this main script, to exclude it from being run.
const mainScriptName = path.basename(__filename);
// The script's prefix
const scriptPrefix = "[preinstall]";

console.log(`${scriptPrefix} Executing all scripts in: ${__dirname}`);

try {
  // Read all files from the script's directory.
  const files = fs.readdirSync(__dirname);

  // Filter for JavaScript files (.js, .cjs) and exclude the main script itself.
  // Sorting ensures a predictable, sequential execution order (e.g., 01-..., 02-...).
  const scriptsToRun = files
    .filter((file) => (file.endsWith(".js") || file.endsWith(".cjs")) && file !== mainScriptName)
    .sort();

  if (scriptsToRun.length === 0) {
    console.log(`${scriptPrefix} No scripts found to execute.`);
    process.exit(0);
  }

  console.log(`${scriptPrefix} Found scripts to run: ${scriptsToRun.join(", ")}`);

  // Execute each script sequentially.
  for (const script of scriptsToRun) {
    const scriptPath = path.join(__dirname, script);
    console.log(`\n${scriptPrefix} --- Executing: ${script} ---`);
    try {
      // Execute the script using Node. 'stdio: inherit' pipes the child's output
      // to this process, making its logs visible in the console.
      execSync(`node "${scriptPath}"`, { stdio: "inherit" });
      console.log(`${scriptPrefix} --- Finished: ${script} ---`);
    } catch (error) {
      console.error(`\n${scriptPrefix} !!! Error executing script: ${script}. Halting execution. !!!`);
      // The error from the child process is already piped, so we just need to exit.
      process.exit(1);
    }
  }

  console.log(`\n${scriptPrefix} All scripts executed successfully.`);
} catch (error) {
  console.error(`${scriptPrefix} A critical error occurred:`);
  console.error(error);
  process.exit(1);
}
