import os
import httpx
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import time


class WebScraperService:
    DEFAULT_TIMEOUT = 15.0
    MAX_CONTENT_LENGTH = 50000
    
    @staticmethod
    def scrape_url(url: str, timeout: float = DEFAULT_TIMEOUT) -> Dict:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            with httpx.Client(timeout=timeout, headers=headers, follow_redirects=True) as client:
                response = client.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    script.decompose()
                
                title = ""
                if soup.title:
                    title = soup.title.get_text().strip()
                elif soup.find('h1'):
                    title = soup.find('h1').get_text().strip()
                
                main_content = None
                for tag in ['main', 'article', '[role="main"]', '.content', '#content', 'body']:
                    if tag.startswith('[') or tag.startswith('.'):
                        main_content = soup.select_one(tag)
                    else:
                        main_content = soup.find(tag)
                    if main_content:
                        break
                
                if main_content:
                    text = main_content.get_text()
                else:
                    text = soup.get_text()
                
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                content = '\n'.join(chunk for chunk in chunks if chunk)
                
                if len(content) > WebScraperService.MAX_CONTENT_LENGTH:
                    content = content[:WebScraperService.MAX_CONTENT_LENGTH] + "... [Content truncated]"
                
                return {
                    "success": True,
                    "url": url,
                    "title": title,
                    "content": content,
                    "length": len(content)
                }
        
        except httpx.TimeoutException:
            return {
                "success": False,
                "url": url,
                "error": "Request timed out",
                "content": ""
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "url": url,
                "error": f"Request failed: {str(e)}",
                "content": ""
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": f"Scraping error: {str(e)}",
                "content": ""
            }
    
    @staticmethod
    def scrape_urls(urls: List[str], max_urls: Optional[int] = None, delay: float = 1.0) -> List[Dict]:
        if max_urls:
            urls = urls[:max_urls]
        
        results = []
        for i, url in enumerate(urls):
            if i > 0:
                time.sleep(delay)
            
            result = WebScraperService.scrape_url(url)
            results.append(result)
            
            successful = sum(1 for r in results if r.get("success"))
            if successful >= (max_urls or len(urls)):
                break
        
        return results
    
    @staticmethod
    def format_scraped_content_for_rag(scraped_results: List[Dict]) -> str:
        successful_results = [r for r in scraped_results if r.get("success")]
        
        if not successful_results:
            return "[No content successfully scraped from URLs]"
        
        formatted = "=== SCRAPED WEB CONTENT FOR RAG ===\n\n"
        
        for i, result in enumerate(successful_results, 1):
            formatted += f"--- Source {i} ---\n"
            formatted += f"URL: {result.get('url', 'N/A')}\n"
            formatted += f"Title: {result.get('title', 'N/A')}\n"
            formatted += f"Content:\n{result.get('content', '')}\n\n"
        
        formatted += "=== END OF SCRAPED CONTENT ===\n"
        
        return formatted

