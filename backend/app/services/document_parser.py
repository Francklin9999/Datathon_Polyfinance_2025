"""
Document Parser Service
Handles parsing of various document formats (PDF, HTML, XML, TXT, DOCX)
"""

import os
import re
from typing import Tuple, Dict, List, Optional

from app.services.aws_textract_service import TextractService
from app.services.aws_config import is_aws_configured


class DocumentParser:
    """Service for parsing various document formats"""
    
    @staticmethod
    def parse_file(file_path: str) -> Tuple[str, str]:
        """
        Parse a file and extract text content
        Returns: (text_content, file_format)
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.txt':
            return DocumentParser._parse_txt(file_path), 'txt'
        elif file_ext == '.html' or file_ext == '.htm':
            return DocumentParser._parse_html(file_path), 'html'
        elif file_ext == '.xml':
            return DocumentParser._parse_xml(file_path), 'xml'
        elif file_ext == '.pdf':
            return DocumentParser._parse_pdf(file_path), 'pdf'
        elif file_ext == '.docx':
            return DocumentParser._parse_docx(file_path), 'docx'
        else:
            # Try text parsing as fallback
            try:
                return DocumentParser._parse_txt(file_path), 'txt'
            except:
                raise ValueError(f"Unsupported file format: {file_ext}")
    
    @staticmethod
    def _parse_txt(file_path: str) -> str:
        """Parse plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
    
    @staticmethod
    def _parse_html(file_path: str) -> str:
        """Parse HTML file and extract text content"""
        try:
            from bs4 import BeautifulSoup
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
        except ImportError:
            # Fallback: basic HTML parsing without BeautifulSoup
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Remove HTML tags using regex
            text = re.sub(r'<[^>]+>', '', content)
            return text
        except Exception as e:
            # Final fallback: return raw content
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
    
    @staticmethod
    def _parse_xml(file_path: str) -> str:
        """Parse XML file and extract text content"""
        try:
            import xml.etree.ElementTree as ET
            
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract text from all elements
            text_parts = []
            for elem in root.iter():
                if elem.text and elem.text.strip():
                    text_parts.append(elem.text.strip())
            
            return '\n'.join(text_parts)
        except Exception:
            # Fallback: try HTML parsing (XML and HTML are similar)
            return DocumentParser._parse_html(file_path)
    
    @staticmethod
    def _parse_pdf(file_path: str) -> str:
        """Parse PDF file and extract text content"""
        # Try AWS Textract first if configured
        if is_aws_configured():
            try:
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                
                textract_result = TextractService.extract_text_from_document(
                    file_content=file_content,
                    file_format="pdf"
                )
                
                if textract_result.get("method") == "aws_textract":
                    return textract_result.get("text", "")
            except Exception:
                # Fallback to local parsing if Textract fails
                pass
        
        # Local PDF parsing fallback
        try:
            import PyPDF2
            
            text = ""
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            try:
                import pdfplumber
                
                text = ""
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        text += page.extract_text() + "\n"
                return text
            except ImportError:
                raise ImportError(
                    "PDF parsing requires PyPDF2 or pdfplumber. "
                    "Install with: pip install PyPDF2 or pip install pdfplumber"
                )
        except Exception as e:
            raise ValueError(f"Error parsing PDF: {str(e)}")
    
    @staticmethod
    def _parse_docx(file_path: str) -> str:
        """Parse DOCX file and extract text content"""
        try:
            from docx import Document
            
            doc = Document(file_path)
            text_parts = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
            
            return '\n'.join(text_parts)
        except ImportError:
            raise ImportError(
                "DOCX parsing requires python-docx. "
                "Install with: pip install python-docx"
            )
        except Exception as e:
            raise ValueError(f"Error parsing DOCX: {str(e)}")
    
    @staticmethod
    def extract_structure(document_text: str, format_type: str = "html") -> Dict:
        """
        Extract document structure (sections, paragraphs, titles)
        """
        structure = {
            "sections": [],
            "paragraphs": [],
            "titles": []
        }
        
        if format_type in ["html", "xml"]:
            try:
                from bs4 import BeautifulSoup
                
                soup = BeautifulSoup(document_text, 'html.parser')
                
                # Extract headings
                for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                    title_text = heading.get_text().strip()
                    if title_text:
                        structure["titles"].append({
                            "level": heading.name,
                            "text": title_text
                        })
                
                # Extract sections
                for section in soup.find_all(['section', 'div', 'article']):
                    section_text = section.get_text().strip()
                    if section_text and len(section_text) > 50:
                        structure["sections"].append(section_text)
                
                # Extract paragraphs
                for para in soup.find_all('p'):
                    para_text = para.get_text().strip()
                    if para_text and len(para_text) > 20:
                        structure["paragraphs"].append(para_text)
                        
            except ImportError:
                # Fallback: basic structure extraction using regex
                lines = document_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if len(line) > 10:
                        structure["paragraphs"].append(line)
        
        else:
            # For plain text, split by double newlines
            sections = document_text.split('\n\n')
            structure["sections"] = [s.strip() for s in sections if len(s.strip()) > 50]
            
            # Extract paragraphs
            paragraphs = re.split(r'\n\n+', document_text)
            structure["paragraphs"] = [p.strip() for p in paragraphs if len(p.strip()) > 20]
        
        return structure