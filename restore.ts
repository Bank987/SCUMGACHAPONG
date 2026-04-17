import { execSync } from 'child_process';
try {
    execSync('git config --global --add safe.directory /app/applet');
    console.log(execSync('git status').toString());
    console.log(execSync('git checkout .').toString());
    console.log(execSync('git status').toString());
} catch (e) {
    console.error(e);
}