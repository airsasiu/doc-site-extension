// Formats common languages with Prettier and falls back to indentation-only formatting.
(function () {
  const PRETTIER_OPTIONS = {
    plugins: prettierPlugins,
    semi: true,
    singleQuote: true,
    tabWidth: 4,
    useTabs: false,
    printWidth: 1000000,
    bracketSpacing: true,
    arrowParens: 'always',
    trailingComma: 'es5',
    endOfLine: 'lf'
  };

  function detectLanguage(code) {
    const text = code.trim();

    if (/^<\?xml\b|^<!DOCTYPE\b|^<\/?[A-Za-z][\s\S]*>$/i.test(text)) {
      return 'html';
    }

    if (/^\s*[\[{]/.test(text)) {
      try {
        JSON.parse(text);
        return 'json';
      } catch (error) {
        // This can still be JavaScript, TypeScript, or a partial object literal.
      }
    }

    if (/\b(interface|implements|namespace|enum|public|private|protected|internal|using)\b|:\s*[A-Za-z_$][\w.$<>\[\],?]*/.test(text)) {
      return 'typescript';
    }

    return 'javascript';
  }

  function isObjectFragment(code) {
    return /^[\w$"'`-]+\s*:/.test(code.trim()) && !/^[{[]/.test(code.trim());
  }

  function formatObjectFragment(code, parser) {
    const prefix = 'const __docSiteFormatValue = {\n';
    const suffix = '\n};';
    const formatted = prettier.format(prefix + code.trim() + suffix, {
      ...PRETTIER_OPTIONS,
      parser
    });
    const match = formatted.match(/^const __docSiteFormatValue = \{\n([\s\S]*)\n\};\n?$/);

    if (!match) {
      throw new Error('无法提取对象代码片段');
    }

    return match[1].replace(/^ {4}/gm, '') + '\n';
  }

  function formatWithPrettier(code, language) {
    if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
      throw new Error('Prettier 未加载');
    }

    const parser = language === 'html'
      ? 'html'
      : language === 'json'
        ? 'json'
        : language === 'typescript'
          ? 'babel-ts'
          : 'babel';

    if (language !== 'html' && isObjectFragment(code)) {
      return formatObjectFragment(code, parser);
    }

    const options = {
      ...PRETTIER_OPTIONS,
      parser
    };

    if (language === 'html') {
      options.printWidth = 100;
      options.bracketSameLine = true;
    }

    const formatted = prettier.format(code, options);

    // Prettier can render unknown XML element names with a standalone closing
    // bracket. The markup fallback produces a more readable XML hierarchy.
    if (language === 'html' && /<[^>]*\n\s*>/.test(formatted)) {
      return formatMarkupFallback(code);
    }

    return formatted;
  }

  function tokenizeCode(code) {
    const tokens = [];
    let index = 0;

    while (index < code.length) {
      const character = code[index];
      const next = code[index + 1];

      if (/\s/.test(character)) {
        index += 1;
        continue;
      }

      if (character === '"' || character === "'" || character === '`') {
        const quote = character;
        let value = quote;
        index += 1;

        while (index < code.length) {
          const current = code[index];
          value += current;
          index += 1;
          if (current === '\\' && index < code.length) {
            value += code[index];
            index += 1;
          } else if (current === quote) {
            break;
          }
        }

        tokens.push({ type: 'literal', value });
        continue;
      }

      if (character === '/' && next === '/') {
        const end = code.indexOf('\n', index);
        tokens.push({
          type: 'line-comment',
          value: code.slice(index, end === -1 ? code.length : end).trim()
        });
        index = end === -1 ? code.length : end + 1;
        continue;
      }

      if (character === '/' && next === '*') {
        const end = code.indexOf('*/', index + 2);
        const stop = end === -1 ? code.length : end + 2;
        tokens.push({ type: 'block-comment', value: code.slice(index, stop).trim() });
        index = stop;
        continue;
      }

      if (character === '#' && (index === 0 || code[index - 1] === '\n')) {
        const end = code.indexOf('\n', index);
        tokens.push({
          type: 'line-comment',
          value: code.slice(index, end === -1 ? code.length : end).trim()
        });
        index = end === -1 ? code.length : end + 1;
        continue;
      }

      const operator = code.slice(index, index + 3);
      if (['===', '!==', '>>>', '??=', '=>'].includes(operator)) {
        tokens.push({ type: 'operator', value: operator });
        index += operator.length;
        continue;
      }

      const doubleOperator = code.slice(index, index + 2);
      if (['==', '!=', '<=', '>=', '&&', '||', '??', '?.', '::', '++', '--', '+=', '-=', '*=', '/=', '=>'].includes(doubleOperator)) {
        tokens.push({ type: 'operator', value: doubleOperator });
        index += doubleOperator.length;
        continue;
      }

      if ('{}[]();,:.'.includes(character)) {
        tokens.push({ type: 'punctuation', value: character });
        index += 1;
        continue;
      }

      if ('+-*/%=!<>?&|'.includes(character)) {
        tokens.push({ type: 'operator', value: character });
        index += 1;
        continue;
      }

      let end = index + 1;
      while (end < code.length && !/\s/.test(code[end]) && !'{}[]();,:."\'`+-*/%=!<>?&|'.includes(code[end])) {
        end += 1;
      }
      tokens.push({ type: 'word', value: code.slice(index, end) });
      index = end;
    }

    return tokens;
  }

  function formatStructuredCode(code) {
    const indentUnit = ' '.repeat(4);
    const tokens = tokenizeCode(code);
    const lines = [];
    let depth = 0;
    let line = '';

    function append(value, spaceBefore) {
      if (line && spaceBefore && !/\s$/.test(line)) {
        line += ' ';
      }
      line += value;
    }

    function flush() {
      const value = line.trim();
      if (value) {
        lines.push(indentUnit.repeat(Math.max(depth, 0)) + value);
      }
      line = '';
    }

    tokens.forEach((token, index) => {
      const previous = tokens[index - 1];
      const next = tokens[index + 1];
      const value = token.value;

      if (token.type === 'line-comment' || token.type === 'block-comment') {
        if (line.trim()) {
          append(value, true);
        } else {
          line = value;
        }
        flush();
        return;
      }

      if (value === '{') {
        append('{', line.trim().length > 0 && !/[([\s]$/.test(line));
        flush();
        depth += 1;
        return;
      }

      if (value === '}') {
        flush();
        depth -= 1;
        line = '}';
        if (!next || ![';', ',', ')', ']', '.'].includes(next.value)) {
          flush();
        }
        return;
      }

      if (value === ';') {
        append(';', false);
        flush();
        return;
      }

      if (value === ',') {
        append(',', false);
        if (depth > 0 && ![')', ']'].includes(next && next.value)) {
          flush();
        } else {
          append('', true);
        }
        return;
      }

      if (value === ':') {
        append(':', false);
        append('', true);
        return;
      }

      if (value === '.') {
        append('.', false);
        return;
      }

      if (value === '(' || value === '[') {
        const isControlKeyword = previous && previous.type === 'word' && /^(if|for|foreach|while|switch|catch|using|lock)$/.test(previous.value);
        append(value, isControlKeyword);
        return;
      }

      if (value === ')' || value === ']') {
        append(value, false);
        return;
      }

      if (token.type === 'operator') {
        append(value, value !== '?.' && value !== '::' && value !== '++' && value !== '--');
        if (!['?.', '::', '++', '--'].includes(value)) {
          append('', true);
        }
        return;
      }

      const requiresSpace = line.trim().length > 0
        && !/[([.\s]$/.test(line)
        && !(previous && previous.type === 'operator' && ['?.', '::'].includes(previous.value));
      append(value, requiresSpace);
    });

    flush();
    return lines.join('\n') + '\n';
  }

  function formatMarkupFallback(code) {
    const indentUnit = ' '.repeat(4);
    const tokens = code.match(/<[^>]*>|[^<]+/g) || [];
    const lines = [];
    let depth = 0;

    tokens.forEach((token) => {
      const value = token.trim();
      if (!value) {
        return;
      }

      if (/^<\//.test(value)) {
        depth = Math.max(depth - 1, 0);
      }

      lines.push(indentUnit.repeat(depth) + value);

      const isTag = /^<[^!/][^>]*>$/.test(value);
      const isClosing = /^<\//.test(value);
      const isSelfClosing = /\/>$/.test(value) || /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(value);
      if (isTag && !isClosing && !isSelfClosing) {
        depth += 1;
      }
    });

    return lines.join('\n') + '\n';
  }

  function formatCode(code) {
    const language = detectLanguage(code);

    try {
      return {
        code: formatWithPrettier(code, language),
        method: language === 'html' ? 'HTML/XML' : language === 'typescript' ? 'TypeScript' : 'Prettier'
      };
    } catch (error) {
      console.warn('Prettier formatting failed; using structured fallback.', error);
      return {
        code: language === 'html' ? formatMarkupFallback(code) : formatStructuredCode(code),
        method: '通用结构'
      };
    }
  }

  try {
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (!selectedText) {
      showNotification('请先选中需要格式化的代码', 'error');
      return;
    }

    const result = formatCode(selectedText);
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(result.code));
      showNotification('代码已按 ' + result.method + ' 格式化', 'success');
    }
  } catch (error) {
    console.error('格式化代码时出错:', error);
    showNotification('格式化代码时出错: ' + error.message, 'error');
  }

  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = [
      'position: fixed',
      'top: 20px',
      'left: 50%',
      'transform: translateX(-50%)',
      'padding: 10px 20px',
      'background: ' + (type === 'success' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 0, 0, 0.75)'),
      'color: white',
      'border-radius: 4px',
      'z-index: 9999'
    ].join(';');
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), type === 'success' ? 2000 : 3000);
  }
})();
