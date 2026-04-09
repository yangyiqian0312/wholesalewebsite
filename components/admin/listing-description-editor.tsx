"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";

type ListingDescriptionEditorProps = {
  name: string;
  initialValue?: string | null;
};

function sanitizeEditorHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export default function ListingDescriptionEditor({
  name,
  initialValue,
}: ListingDescriptionEditorProps) {
  const editorId = useId();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialValue?.trim() || "<p></p>");

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function syncValue() {
    if (!editorRef.current) {
      return;
    }

    const nextValue = sanitizeEditorHtml(editorRef.current.innerHTML.trim() || "<p></p>");
    if (inputRef.current) {
      inputRef.current.value = nextValue;
    }
    setValue(nextValue);
  }

  function exec(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  function handleBlockChange(event: ChangeEvent<HTMLSelectElement>) {
    exec("formatBlock", event.target.value);
  }

  function handleInsertLink() {
    const url = window.prompt("Enter a link URL");

    if (!url) {
      return;
    }

    exec("createLink", url);
  }

  function handleInsertImage() {
    const url = window.prompt("Enter an image URL");

    if (!url) {
      return;
    }

    exec("insertImage", url);
  }

  return (
    <div className="admin-description-editor-shell">
      <div className="admin-description-editor-toolbar" role="toolbar" aria-label="Description editor">
        <select
          aria-label="Text style"
          className="admin-description-toolbar-select"
          defaultValue="P"
          onChange={handleBlockChange}
        >
          <option value="P">Paragraph</option>
          <option value="H3">Heading</option>
          <option value="BLOCKQUOTE">Quote</option>
        </select>
        <button
          className="admin-description-toolbar-button"
          onClick={() => exec("bold")}
          type="button"
        >
          B
        </button>
        <button
          className="admin-description-toolbar-button admin-description-toolbar-button-italic"
          onClick={() => exec("italic")}
          type="button"
        >
          I
        </button>
        <button
          className="admin-description-toolbar-button"
          onClick={() => exec("underline")}
          type="button"
        >
          U
        </button>
        <button
          className="admin-description-toolbar-button"
          onClick={() => exec("insertUnorderedList")}
          type="button"
        >
          List
        </button>
        <button
          className="admin-description-toolbar-button"
          onClick={handleInsertLink}
          type="button"
        >
          Link
        </button>
        <button
          className="admin-description-toolbar-button"
          onClick={handleInsertImage}
          type="button"
        >
          Image
        </button>
      </div>
      <div
        aria-labelledby={editorId}
        className="admin-description-editor"
        contentEditable
        onBlur={syncValue}
        onInput={syncValue}
        ref={editorRef}
        suppressContentEditableWarning
      />
      <input name={name} ref={inputRef} type="hidden" value={value} />
      <span className="admin-description-editor-help" id={editorId}>
        Supports simple formatting, links, and image URLs.
      </span>
    </div>
  );
}
