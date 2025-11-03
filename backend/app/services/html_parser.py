"""
HTML Parser Service
Uses BeautifulSoup to extract clean text from HTML filings
"""

from typing import Optional

try:
    from bs4 import BeautifulSoup
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    BEAUTIFULSOUP_AVAILABLE = False


def extract_text_from_html(html_content: str, max_length: Optional[int] = None) -> str:
    """
    Extract clean text from HTML content using BeautifulSoup
    
    Args:
        html_content: Raw HTML content
        max_length: Optional maximum length to return
        
    Returns:
        Clean text extracted from HTML
    """
    if not BEAUTIFULSOUP_AVAILABLE:
        # Fallback: basic text extraction without BeautifulSoup
        import re
        # Remove HTML tags using regex (less accurate than BeautifulSoup)
        text = re.sub(r'<[^>]+>', '', html_content)
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = text.strip()
        
        if max_length and len(text) > max_length:
            text = text[:max_length]
        return text
    
    try:
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        if max_length and len(text) > max_length:
            text = text[:max_length]
        
        return text
    except Exception as e:
        print(f"Error parsing HTML with BeautifulSoup: {e}")
        # Fallback to regex-based extraction
        import re
        text = re.sub(r'<[^>]+>', '', html_content)
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        if max_length and len(text) > max_length:
            text = text[:max_length]
        return text

