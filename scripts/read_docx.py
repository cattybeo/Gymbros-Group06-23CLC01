import os
import sys
import xml.etree.ElementTree as ET
import zipfile


def docx_to_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as zf:
            xml_content = zf.read("word/document.xml")
            tree = ET.fromstring(xml_content)

            # Namespace for Word
            namespaces = {
                "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            }

            text_content = []
            for p in tree.findall(".//w:p", namespaces):
                texts = [
                    node.text for node in p.findall(".//w:t", namespaces) if node.text
                ]
                if texts:
                    text_content.append("".join(texts))
                else:
                    text_content.append("")  # Blank line for paragraph

            return "\n".join(text_content)

    except Exception as e:
        return f"Error reading {docx_path}: {e}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python read_docx.py <path_to_docx>")
        sys.exit(1)

    path = sys.argv[1]
    if os.path.exists(path):
        text = docx_to_text(path)
        output_path = path + ".txt"  # Save as txt since it's raw extraction
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Saved extracted text to {output_path}")
    else:
        print(f"File not found: {path}")
