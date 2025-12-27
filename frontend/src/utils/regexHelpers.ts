// Polyfill for unicode property escapes support if regjsparser fails or returns unexpected types
// We will just patch the parser input for visualizer if needed, but regjsparser 0.10.0+ generally supports 'u' flag features 
// if we can enable them or if it parses them as identities.
// Actually, regjsparser might throw on \p{L} without the unicode flag.

export const cleanRegex = (regex: string): string => {
    let clean = regex;
    
    // Handle Python raw string syntax r"..." or r'...' or r"""..."""
    // We only care about the content inside the quotes for visualization
    const rawStringMatch = clean.trim().match(/^r(["']{3}|["'])([\s\S]*)\1$/);
    if (rawStringMatch) {
        clean = rawStringMatch[2];
    } else {
        // Handle simple start/end quotes if user pasted python string
        const simpleStringMatch = clean.match(/^(["'])([\s\S]*)\1$/);
        if (simpleStringMatch) {
            clean = simpleStringMatch[2];
        }
    }

    // Python x flag (verbose mode) stripping
    // Remove comments starting with # and whitespace, but be careful about character classes and escaped chars.
    // This is still a heuristic.
    // If we detect significant whitespace usage or comments, we assume verbose mode.
    if (clean.includes('\n') || clean.includes('#')) {
        // Remove comments
        clean = clean.replace(/#[^\n]*/g, '');
        // Remove whitespace (space, tab, newline)
        // WARN: This removes ALL whitespace, which breaks spaces inside [] or escaped spaces.
        // The original replace(/\s+(?=[^\]]*(?:\[|$))/g, '') was too aggressive and could strip spaces that are intended
        // if the structure was complex or nested.
        
        // For the specific pattern provided:
        // r"""'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
        // It does NOT have newlines, but if it came from a verbose block it might.
        // Actually, the example provided by user was r"""...""" but on one line.
        // If it's on one line, `includes('\n')` is false.
        // So the stripping logic wasn't running!
        
        // Wait, if it's one line, but uses r"""...""", `cleanRegex` extracts the content.
        // If the content has no newlines, this block is skipped.
        // So ` ?` remains ` ?`.
        // AND `\s+` remains `\s+`.
        
        // However, if the user meant verbose mode, spaces are ignored.
        // If the pattern provided IS verbose, spaces should be stripped unless escaped or in [].
        // But the pattern `| ?\p{L}+` suggests ` ?` (optional space) is INTENDED.
        // So verbose mode cleaning would actually BREAK this pattern if it stripped the space in ` ?`.
        
        // The user says "match result by typescript is not as the python".
        // Python result: `['Type', ' here', ...]`
        // This means ` ?` matched the space!
        // So spaces ARE significant.
        // So it is NOT verbose mode (or at least spaces are not ignored).
        
        // So `cleanRegex` SHOULD NOT strip spaces for this pattern.
        // If `includes('\n')` is false, it doesn't strip. Good.
        
        // So why did TS fail?
        // Because `\p{L}` requires `u` flag.
        // Without `u`, `\p` matches literal `p`.
        // So `\p{L}` matches `p{L}` literally.
        // And `[^\s\p{L}\p{N}]` matches "not space, p, L, N, {, }".
        // "Type" -> T matches (not space/p/L/N/{/})
        // y matches
        // p matches? No, `p` is excluded.
        // e matches.
        // So "Type" -> "Ty" matches, "e" matches. "p" is skipped?
        // Wait, `[^\s...]` means match one char that is NOT in the set.
        // If `p` is in the set, then `p` in "Type" is NOT matched.
        // So we get "Ty", then "e".
        // That explains the split behavior the user saw!
    }
    // Python specific syntax replacements
    
    // 1. Inline modifiers: (?i:...) -> (?:...)  (Ignore case modifier not supported inline in JS)
    clean = clean.replace(/\(\?([a-z]*):/g, '(?:');

    // 2. Possessive quantifiers: ++, *+, ?+ -> +, *, ?
    clean = clean.replace(/(\*|\+|\?)\+/g, '$1');
    
    // 3. Atomic groups: (?>...) -> (?:...)
    clean = clean.replace(/\(\?>/g, '(?:');
    
    return clean;
};

// Helper to replace python specific \p{L} with [a-zA-Z] visual approximation or similar if parser chokes
// OR preferably, pass { unicodePropertyEscape: true } to regjsparser if supported?
// regjsparser supports unicodePropertyEscape option.

export const parseOptions = {
    unicodePropertyEscape: true,
    namedGroups: true,
    lookbehind: true,
};

