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
    enableScripts?: boolean;
}

export interface CardContent {
    title: string;
    content: string;
    className?: string;
}

export interface TableData {
    headers: string[];
    rows: string[][];
    className?: string;
}

export interface ListItem {
    text: string;
    subtext?: string;
    icon?: string;
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
            background: #fafafa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 10px; 
            margin-top: 0;
        }
        h2 { 
            color: #34495e; 
            margin-top: 30px; 
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        h3 { 
            color: #444; 
            margin-top: 20px;
        }
        ul { 
            padding-left: 20px; 
            margin: 10px 0;
        }
        li { 
            margin: 8px 0; 
        }
        .section { 
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 8px;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        .card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .card-content {
            color: #555;
            line-height: 1.8;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 2px solid #dee2e6;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e9ecef;
        }
        tr:hover {
            background: #f8f9fa;
        }
        code { 
            background: #f4f4f4; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
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
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
            margin-top: 5px;
        }
        button:hover {
            background: #2980b9;
        }
        button.secondary {
            background: #95a5a6;
        }
        button.secondary:hover {
            background: #7f8c8d;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin-top: 20px;
        }
        strong { 
            color: #2c3e50; 
            font-weight: 600; 
        }
        `;
    }

    /**
     * Get base JavaScript for webview communication
     */
    private getBaseScript(): string {
        return `
        const vscode = acquireVsCodeApi();
        
        // Helper function to copy text to clipboard
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }
        `;
    }

    /**
     * Render a card component
     */
    renderCard(card: CardContent): string {
        const className = card.className || '';
        return `
        <div class="card ${className}">
            <div class="card-title">${WebviewTemplateEngine.escapeHtml(card.title)}</div>
            <div class="card-content">${card.content}</div>
        </div>`;
    }

    /**
     * Render a table
     */
    renderTable(data: TableData): string {
        const className = data.className || '';
        const headers = data.headers.map(h => `<th>${WebviewTemplateEngine.escapeHtml(h)}</th>`).join('');
        const rows = data.rows.map(row => 
            `<tr>${row.map(cell => `<td>${WebviewTemplateEngine.escapeHtml(cell)}</td>`).join('')}</tr>`
        ).join('');
        
        return `
        <table class="${className}">
            <thead>
                <tr>${headers}</tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`;
    }

    /**
     * Render a list
     */
    renderList(items: ListItem[]): string {
        const listItems = items.map(item => {
            const icon = item.icon ? `${item.icon} ` : '';
            const subtext = item.subtext ? `<br><small style="color: #777;">${WebviewTemplateEngine.escapeHtml(item.subtext)}</small>` : '';
            return `<li>${icon}${WebviewTemplateEngine.escapeHtml(item.text)}${subtext}</li>`;
        }).join('');
        
        return `<ul>${listItems}</ul>`;
    }

    /**
     * Render a section with title and content
     */
    renderSection(title: string, content: string, className?: string): string {
        const sectionClass = className ? ` ${className}` : '';
        return `
        <div class="section${sectionClass}">
            <h2>${WebviewTemplateEngine.escapeHtml(title)}</h2>
            ${content}
        </div>`;
    }

    /**
     * Convert markdown-style formatting to HTML
     */
    static markdownToHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
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

