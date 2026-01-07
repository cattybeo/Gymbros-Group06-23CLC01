import os

import fitz  # PyMuPDF


def convert_pdf_to_images(pdf_path, output_folder):
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        return

    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Created output folder: {output_folder}")

    try:
        doc = fitz.open(pdf_path)
        print(f"Opened PDF: {pdf_path} - Pages: {len(doc)}")

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap()
            output_file = os.path.join(
                output_folder, f"ui_design_page_{page_num + 1}.png"
            )
            pix.save(output_file)
            print(f"Saved: {output_file}")

        print("Conversion complete!")
    except ImportError:
        print("Error: PyMuPDF (fitz) is not installed. Please run: pip install pymupdf")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    pdf_path = r"e:\2. Documents FIT-HCMUS\YEAR 3\HKI\IntroSE\Gymbros-Group06-23CLC01\docs_need_to_work\pa3_submission\UI_Design.pdf"
    output_folder = r"e:\2. Documents FIT-HCMUS\YEAR 3\HKI\IntroSE\Gymbros-Group06-23CLC01\design_references"
    convert_pdf_to_images(pdf_path, output_folder)
