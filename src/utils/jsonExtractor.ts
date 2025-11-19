/**
 * Robust JSON extraction utility
 * Handles extraction of valid JSON from LLM responses that may contain
 * text, markdown, or malformed JSON
 */

/**
 * Extract valid JSON from text content
 * Tries multiple strategies to find and parse valid JSON
 */
export function extractJSON(content: string): any | null {
    if (!content || content.trim().length === 0) {
        return null;
    }

    // Strategy 1: Try parsing the entire content as JSON
    try {
        const trimmed = content.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return JSON.parse(trimmed);
        }
    } catch (e) {
        // Not valid JSON, continue to other strategies
    }

    // Strategy 2: Extract JSON from markdown code blocks
    const codeBlockPatterns = [
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
        /```(?:json)?\s*(\[[\s\S]*?\])\s*```/,
    ];

    for (const pattern of codeBlockPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                // Try to extract valid JSON from the code block
                const extracted = extractValidJSONObject(match[1]);
                if (extracted) {
                    return extracted;
                }
            }
        }
    }

    // Strategy 3: Find the first valid JSON object by counting braces
    const jsonObject = extractValidJSONObject(content);
    if (jsonObject) {
        return jsonObject;
    }

    // Strategy 4: Try to find JSON array
    const jsonArray = extractValidJSONArray(content);
    if (jsonArray) {
        return jsonArray;
    }

    return null;
}

/**
 * Extract a valid JSON object from text by properly counting braces
 * This handles nested objects and escaped strings correctly
 */
function extractValidJSONObject(text: string): any | null {
    const startIndex = text.indexOf('{');
    if (startIndex === -1) {
        return null;
    }

    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let stringChar: string | null = null;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            continue;
        }

        if (inString && char === stringChar) {
            inString = false;
            stringChar = null;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    // Found matching closing brace
                    const jsonCandidate = text.substring(startIndex, i + 1);
                    try {
                        return JSON.parse(jsonCandidate);
                    } catch (e) {
                        // Invalid JSON, try to fix common issues
                        const fixed = tryFixJSON(jsonCandidate);
                        if (fixed) {
                            try {
                                return JSON.parse(fixed);
                            } catch (e2) {
                                // Still invalid, continue searching
                            }
                        }
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Extract a valid JSON array from text
 */
function extractValidJSONArray(text: string): any | null {
    const startIndex = text.indexOf('[');
    if (startIndex === -1) {
        return null;
    }

    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let stringChar: string | null = null;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            continue;
        }

        if (inString && char === stringChar) {
            inString = false;
            stringChar = null;
            continue;
        }

        if (!inString) {
            if (char === '[') {
                bracketCount++;
            } else if (char === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                    const jsonCandidate = text.substring(startIndex, i + 1);
                    try {
                        return JSON.parse(jsonCandidate);
                    } catch (e) {
                        const fixed = tryFixJSON(jsonCandidate);
                        if (fixed) {
                            try {
                                return JSON.parse(fixed);
                            } catch (e2) {
                                // Continue searching
                            }
                        }
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Try to fix common JSON issues like unterminated strings
 */
function tryFixJSON(json: string): string | null {
    // Check for unterminated strings
    let fixed = json;
    let inString = false;
    let escapeNext = false;
    let stringChar: string | null = null;
    let lastStringStart = -1;

    for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            lastStringStart = i;
            continue;
        }

        if (inString && char === stringChar) {
            inString = false;
            stringChar = null;
            lastStringStart = -1;
            continue;
        }
    }

    // If we're still in a string at the end, try to close it
    if (inString && lastStringStart >= 0) {
        // Find the end of the JSON structure and close the string there
        // This is a heuristic - we'll close the string before the last brace
        const lastBrace = fixed.lastIndexOf('}');
        if (lastBrace > lastStringStart) {
            fixed = fixed.substring(0, lastBrace) + stringChar + fixed.substring(lastBrace);
        } else {
            // Just append the closing quote
            fixed = fixed + stringChar;
        }
    }

    return fixed;
}

/**
 * Safely parse JSON with multiple fallback strategies
 */
export function safeParseJSON(content: string, fallback: any = null): any {
    if (!content || content.trim().length === 0) {
        return fallback;
    }

    // Try direct extraction first
    const extracted = extractJSON(content);
    if (extracted !== null) {
        return extracted;
    }

    // If extraction failed, return fallback
    return fallback;
}



