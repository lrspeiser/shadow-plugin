import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class SWLogger {
    private static ensureDir(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private static getLogPath(): string | null {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return null;
        const logsDir = path.join(root, '.shadow', 'logs');
        this.ensureDir(logsDir);
        return path.join(logsDir, 'shadow-watch.log');
    }

    public static log(message: string): void {
        try {
            const logPath = this.getLogPath();
            if (!logPath) return;
            const ts = new Date().toISOString();
            fs.appendFileSync(logPath, `[${ts}] ${message}\n`, 'utf-8');
        } catch {
            // best-effort logging; ignore errors
        }
    }

    public static section(title: string): void {
        this.log('');
        this.log(`===== ${title} =====`);
    }
}


