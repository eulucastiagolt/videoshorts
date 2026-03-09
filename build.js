const fs = require('fs');
const path = require('path');

function minifyJS(code) {
  const preservedComments = [];
  let index = 0;
  
  const codeWithPlaceholders = code.replace(/\/\*\![\s\S]*?\*\//g, (match) => {
    const placeholder = `__PRESERVED_COMMENT_${index}__`;
    preservedComments.push(match.replace(/\s+/g, ' ').trim());
    index++;
    return placeholder;
  });
  
  return codeWithPlaceholders
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:<>=\+\-\*\/\!\?&|\[\]])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/__PRESERVED_COMMENT_(\d+)__/g, (match, idx) => preservedComments[parseInt(idx)])
    .trim();
}

function minifyCSS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function build() {
  const distDir = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const jsFile = path.join(__dirname, 'videoshots.js');
  const cssFile = path.join(__dirname, 'videoshots.css');
  
  const jsCode = fs.readFileSync(jsFile, 'utf8');
  const cssCode = fs.readFileSync(cssFile, 'utf8');
  
  const minifiedJS = minifyJS(jsCode);
  const minifiedCSS = minifyCSS(cssCode);
  
  fs.writeFileSync(path.join(distDir, 'videoshots.min.js'), minifiedJS);
  fs.writeFileSync(path.join(distDir, 'videoshots.min.css'), minifiedCSS);
  
  const jsSize = (minifiedJS.length / 1024).toFixed(2);
  const cssSize = (minifiedCSS.length / 1024).toFixed(2);
  
  console.log('\x1b[32m%s\x1b[0m', '✓ Build completed!');
  console.log('\x1b[36m%s\x1b[0m', `  dist/videoshots.min.js (${jsSize} KB)`);
  console.log('\x1b[36m%s\x1b[0m', `  dist/videoshots.min.css (${cssSize} KB)`);
}

build();
