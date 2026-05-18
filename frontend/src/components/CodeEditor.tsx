import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { MONACO_LANGUAGE_MAP } from '../utils/judgeStatus';

interface CodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string) => void;
  height?: string;
}

const defaultTemplates: Record<string, string> = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    while (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    int a, b;
    while (scanf("%d %d", &a, &b) != EOF) {
        printf("%d\n", a + b);
    }
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            System.out.println(a + b);
        }
    }
}
`,
  python: `import sys

for line in sys.stdin:
    a, b = map(int, line.strip().split())
    print(a + b)
`,
  javascript: `const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const [a, b] = line.trim().split(' ').map(Number);
    console.log(a + b);
});
`,
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  code,
  onChange,
  height = '400px',
}) => {
  const monacoLanguage = MONACO_LANGUAGE_MAP[language] || 'javascript';

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editor.focus();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={monacoLanguage}
        value={code}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
        }}
      />
    </div>
  );
};

export { CodeEditor, defaultTemplates };
export default CodeEditor;
