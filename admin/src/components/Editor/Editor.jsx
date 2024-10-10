import './style.css';

import React from 'react';
import CodeMirror from "@uiw/react-codemirror";

export const Editor = ({ content = '', language = 'csv', readOnly = false, onChange, style }) => {
  return (
    <>
    <CodeMirror
      className="plugin-ie-editor"
      style={style}
      height="40vh"
      theme="dark"
      value={content}
      onChange={onChange}
      editable={!readOnly}
      extensions={[]}
    />
    </>
  );
};
