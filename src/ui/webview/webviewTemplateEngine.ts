/**
 * Webview Template Engine - Reduces duplication in HTML generation
 * Extracts common HTML structure, CSS, and JavaScript patterns
 */
export interface WebviewTemplateOptions {
    title?: string;
    content: string;
    customStyles?: string;
    customScript?: string;
    viewport?: string;
}

/**
 * Template engine for generating webview HTML with shared base structure
 */
export class WebviewTemplateEngine {
    /**
     * Get base CSS styles shared across all webviews
     */
    private getBaseStyles(): string {
        return `
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            max-width: 1000px;
            margin: 0 auto;
            color: #333;
        }
        h1 { 
            color: #667eea; 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 10px; 
            margin-top: 0;
        }
        h2 { 
            color: #764ba2; 
            margin-top: 30px; 
            margin-bottom: 15px;
        }
        h3 { 
            color: #444; 
        }
        ul { 
            padding-left: 20px; 
        }
        li { 
            margin: 8px 0; 
        }
        .section { 
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 8px;
        }
        code { 
            background: #f4f4f4; 
            padding: 2px 6px; 
            border-radius: 3px; 
        }
        pre { 
            background: #1e1e1e; 
            color: #d4d4d4; 
            padding: 15px; 
            border-radius: 6px; 
            overflow-x: auto; 
            font-size: 0.9em;
            line-height: 1.5;
        }
        button {
            padding: 10px 20px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
            margin-top: 5px;
        }
        button:hover {
            background: #6d28d9;
        }
        button.secondary {
            background: #95a5a6;
        }
        button.secondary:hover {
            background: #7f8c8d;
        }
        `;
    }

    /**
     * Get base JavaScript for webview communication
     */
    private getBaseScript(): string {
        return `
        const vscode = acquireVsCodeApi();
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    static escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Render a complete HTML document from template options
     */
    render(options: WebviewTemplateOptions): string {
        const title = options.title || 'Shadow Watch';
        const viewport = options.viewport || 'width=device-width, initial-scale=1.0';
        const customStyles = options.customStyles || '';
        const customScript = options.customScript || '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="${viewport}">
    <title>${WebviewTemplateEngine.escapeHtml(title)}</title>
    <style>
        ${this.getBaseStyles()}
        ${customStyles}
    </style>
</head>
<body>
    ${options.content}
    <script>
        ${this.getBaseScript()}
        ${customScript}
    </script>
</body>
</html>`;
    }
}

