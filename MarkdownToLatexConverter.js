const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const marked = require('marked');

class MarkdownToLatexConverter {
  constructor() {
    this.markedRenderer = new marked.Renderer();
    marked.setOptions({ renderer: this.markedRenderer });
  }

  convertToLatex(inputFile) {
    const rawContent = fs.readFileSync(inputFile, 'utf-8');
    
    const htmlContent = marked.parse(rawContent);
    
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const { Node } = dom.window;
    let latexContent = this.convertNodeToLatex(document.body, Node);

    return latexContent;
  }

  convertNodeToLatex(node, Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return this.escapeLatexSpecialChars(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    switch (node.tagName.toLowerCase()) {
      case 'h1':
        return `\\chapter{${this.extractTextContent(node)}}`;
      case 'h2':
        return `\\section{${this.extractTextContent(node)}}`;
      case 'h3':
        return `\\subsection{${this.extractTextContent(node)}}`;
      case 'h4':
        return `\\subsubsection{${this.extractTextContent(node)}}`;
      
      case 'ul':
        return this.convertList(node, 'itemize', Node);
      case 'ol':
        return this.convertList(node, 'enumerate', Node);
      
      case 'li':
        return `\\item ${this.processNodeChildren(node, Node)}`;
      
      case 'p':
        return `${this.processNodeChildren(node, Node)}\n\n`;
      
      case 'strong':
      case 'b':
        return `\\textbf{${this.processNodeChildren(node, Node)}}`;
      
      case 'em':
      case 'i':
        return `\\textit{${this.processNodeChildren(node, Node)}}`;
      
      case 'code':
        return `\\texttt{${this.extractTextContent(node)}}`;
      
      case 'a':
        const childImages = node.querySelectorAll('img');
        if (childImages.length > 0) {
          const href = node.getAttribute('href');
          const imageLatex = Array.from(childImages)
            .map(img => this.convertImage(img))
            .join('\n');
          
          return `\\href{${href}}{${imageLatex}}`;
        }
        return this.convertLink(node);
      
      case 'img':
        return this.convertImage(node);
      
      case 'table':
        return this.convertTable(node, Node);
      
      case 'pre':
        return this.convertCodeBlock(node);
      
      default:
        return this.processNodeChildren(node, Node);
    }
  }

  convertList(listNode, type, Node) {
    const listItems = Array.from(listNode.children)
      .map(li => this.convertNodeToLatex(li, Node))
      .join('\n');
    
    return `\\begin{${type}}\n${listItems}\n\\end{${type}}`;
  }

  convertLink(node) {
    const href = node.getAttribute('href');
    const text = this.extractTextContent(node);
    return `\\href{${href}}{${this.escapeLatexSpecialChars(text)}}`;
  }

  convertImage(node) {
    const src = node.getAttribute('src');
    const alt = node.getAttribute('alt') || '';

    const labelCmd = alt ? `\\label{${this.escapeLatexSpecialChars(alt)}}` : '';

    return `\\begin{figure}[h]
\\centering
\\includegraphics[width=1\\textwidth]{${src}}
${labelCmd}
\\end{figure}`;
  }

  convertTable(tableNode, Node) {
    const rows = Array.from(tableNode.querySelectorAll('tr'));
    
    const headerCells = rows[0] ? 
      Array.from(rows[0].children).map(cell => this.extractTextContent(cell)).join(' & ') : '';
    
    const bodyRows = rows.slice(1).map(row => 
      Array.from(row.children)
        .map(cell => this.extractTextContent(cell))
        .join(' & ')
    ).join(' \\\\\n');

    return `\\begin{table}[h]
\\centering
\\begin{tabular}{${' c '.repeat(rows[0].children.length)}}
\\hline
${headerCells} \\\\
\\hline
${bodyRows} \\\\
\\hline
\\end{tabular}
\\end{table}`;
  }

  convertCodeBlock(preNode) {
    const codeContent = preNode.textContent;
    return `\\begin{verbatim}
${codeContent}
\\end{verbatim}`;
  }

  processNodeChildren(node, Node) {
    return Array.from(node.childNodes)
      .map(child => this.convertNodeToLatex(child, Node))
      .join('');
  }

  extractTextContent(node) {
    return this.escapeLatexSpecialChars(node.textContent.trim());
  }

  escapeLatexSpecialChars(text) {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/</g, '$<$')
      .replace(/>/g, '$>$');
  }

  preserveMath(latex) {
    return latex.replace(/\$\$(.*?)\$\$/g, (match, math) => {
      return `\\[${math}\\]`;
    }).replace(/\$(.*?)\$/g, (match, math) => {
      return `\\(${math}\\)`;
    });
  }
}

function markdownToLatex(inputFile, outputFile) {
  const converter = new MarkdownToLatexConverter();
  let latexContent = converter.convertToLatex(inputFile);
  latexContent = converter.preserveMath(latexContent);

  fs.writeFileSync(outputFile, latexContent, 'utf-8');
  console.log(`Converted ${inputFile} to ${outputFile}`);
}

if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || inputFile.replace(/\.md$/, '.tex');

  if (!inputFile) {
    console.error('Please provide an input Markdown file');
    process.exit(1);
  }

  markdownToLatex(inputFile, outputFile);
}

module.exports = { MarkdownToLatexConverter, markdownToLatex };