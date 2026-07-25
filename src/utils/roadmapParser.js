/**
 * Safe client-side parser to convert HTML (from roadmap_v6.html) or JSON files into a structured roadmap.
 */

function jsToJson(jsStr) {
  // Remove single-line comments
  let cleaned = jsStr.replace(/\/\/.*/g, '');
  
  // Convert JS object single-quote strings to double-quotes
  cleaned = cleaned.replace(/'((?:\\.|[^'])*)'/g, (_, g1) => {
    return '"' + g1.replace(/\\'/g, "'").replace(/"/g, '\\"') + '"';
  });

  // Put double quotes around unquoted keys (e.g. id: -> "id":)
  // Matches word characters followed by a colon, ensuring it is a key and not part of a URL
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

  // Strip trailing commas before closing brackets or braces
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  return cleaned;
}

export function parseRoadmapFile(fileText, fileName) {
  const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm') || fileText.includes('<html');

  if (isHtml) {
    // 1. Search for CATS = {...}
    const catsMatch = fileText.match(/CATS\s*=\s*(\{[\s\S]*?\})\s*;/);
    if (!catsMatch) {
      throw new Error('Could not find "CATS" definition in the HTML file. Ensure it contains a script with "const CATS = {..."');
    }

    // 2. Search for ITEMS = [...]
    const itemsMatch = fileText.match(/ITEMS\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (!itemsMatch) {
      throw new Error('Could not find "ITEMS" array in the HTML file. Ensure it contains a script with "const ITEMS = [...]"');
    }

    try {
      const catsJson = jsToJson(catsMatch[1]);
      const itemsJson = jsToJson(itemsMatch[1]);

      const categories = JSON.parse(catsJson);
      const items = JSON.parse(itemsJson);

      // Extract unique weeks and build week groups
      const weekKeys = Array.from(new Set(items.map(i => i.week).filter(Boolean)));
      // Sort week keys numerically (e.g. Wk1, Wk2, Wk10)
      weekKeys.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });

      const weeks = weekKeys.map(key => {
        const numStr = key.replace('Wk', '');
        return {
          key,
          label: key.startsWith('Wk') ? `Week ${numStr}: Study Block` : key
        };
      });

      return { categories, items, weeks };
    } catch (err) {
      console.error('HTML JS-to-JSON parsing error:', err);
      throw new Error('Failed to parse script arrays in the HTML. Ensure it contains a valid JS structure. Details: ' + err.message);
    }
  } else {
    // Treat as JSON
    try {
      const data = JSON.parse(fileText);
      if (!data.categories || !data.items) {
        throw new Error('JSON must contain "categories" and "items" properties.');
      }

      // Infer weeks if not provided
      let weeks = data.weeks;
      if (!weeks) {
        const weekKeys = Array.from(new Set(data.items.map(i => i.week).filter(Boolean)));
        weekKeys.sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''));
          const numB = parseInt(b.replace(/\D/g, ''));
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });
        weeks = weekKeys.map(key => ({
          key,
          label: key.startsWith('Wk') ? `Week ${key.replace('Wk', '')}` : key
        }));
      }

      return {
        categories: data.categories,
        items: data.items,
        weeks
      };
    } catch (err) {
      throw new Error('Invalid JSON file. Details: ' + err.message);
    }
  }
}
