#!/usr/bin/env python3
import PyPDF2
import sys
import os

def extract_text_from_pdf(pdf_path, output_path):
    """Extract text from PDF and save to text file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            print(f"PDF has {len(pdf_reader.pages)} pages")
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page_text
                text += "\n"
            
            # Save to text file
            with open(output_path, 'w', encoding='utf-8') as output_file:
                output_file.write(text)
            
            print(f"Text extracted successfully to: {output_path}")
            print(f"Total characters extracted: {len(text)}")
            
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return False
    
    return True

if __name__ == "__main__":
    pdf_file = "Work Sample Request from Health Note.pdf"
    output_file = "Work Sample Request from Health Note.txt"
    
    if not os.path.exists(pdf_file):
        print(f"PDF file not found: {pdf_file}")
        sys.exit(1)
    
    success = extract_text_from_pdf(pdf_file, output_file)
    if success:
        print("PDF to text conversion completed successfully!")
    else:
        print("PDF to text conversion failed!")
        sys.exit(1)
