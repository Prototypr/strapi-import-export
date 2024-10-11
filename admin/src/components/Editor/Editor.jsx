import './style.css';

import React, { useEffect, useState } from 'react';
import CodeMirror from "@uiw/react-codemirror";

export const Editor = ({ content = '', language = 'csv', readOnly = false, onChange, style }) => {
 
  const [codeMirrorContent, setCodeMirrorContent] = useState('');

  useEffect(() => {
    console.log('content', content);
    if (typeof content === 'object') {
      setCodeMirrorContent(content.data);
    }else{
      setCodeMirrorContent(content);
    }

  }, [content, language]);
 
  return (
    <>
    <CodeMirror
      className="plugin-ie-editor"
      mode= {{ name: "javascript", json: true }}
      lineNumbers={true}
      readOnly={false}
      style={style}
      height="40vh"
      theme="dark"
      value={codeMirrorContent}
      onChange={onChange}
      editable={!readOnly}
      // extensions={[]}
    />
    </>
  );
};
