import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalysis } from './analyzer';

export class AnalysisCache {
    private cacheDir: string;

    constructor(storagePath: string) {
        this.cacheDir = path.join(storagePath, '.shadowwatch-cache');
        this.ensureCacheDir();
    }

    private ensureCacheDir(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    getCacheKey(workspaceRoot: string): string {
        // Create a safe filename from workspace path
        return Buffer.from(workspaceRoot).toString('base64').replace(/[/+=]/g, '_');
    }

    async get(workspaceRoot: string): Promise<CodeAnalysis | null> {
        const cacheFile = this.getCacheFile(workspaceRoot);
        
        if (!fs.existsSync(cacheFile)) {
            return null;
        }

        try {
            const content = fs.readFileSync(cacheFile, 'utf-8');
            const cached = JSON.parse(content);
            
            // Check if cache is still valid (24 hours)
            const now = Date.now();
            if (now - cached.timestamp > 24 * 60 * 60 * 1000) {
                return null;
            }

            return cached.data;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    async set(workspaceRoot: string, data: CodeAnalysis): Promise<void> {
        const cacheFile = this.getCacheFile(workspaceRoot);
        
        try {
            const cached = {
                timestamp: Date.now(),
                data
            };

            fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2), 'utf-8');
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            if (fs.existsSync(this.cacheDir)) {
                const files = fs.readdirSync(this.cacheDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(this.cacheDir, file));
                }
            }
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    private getCacheFile(workspaceRoot: string): string {
        const key = this.getCacheKey(workspaceRoot);
        return path.join(this.cacheDir, `${key}.json`);
    }

    // Get cache statistics
    getStats(): { files: number; size: number } {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                return { files: 0, size: 0 };
            }

            const files = fs.readdirSync(this.cacheDir);
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
            }

            return {
                files: files.length,
                size: totalSize
            };
        } catch (error) {
            return { files: 0, size: 0 };
        }
    }
}

