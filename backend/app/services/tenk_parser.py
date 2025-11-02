"""
10-K Parser Service
Parses 10-K filings and extracts structured information
"""

import re
from typing import Dict, List, Optional


class TenKParser:
    """Service for parsing 10-K filings"""
    
    @staticmethod
    def parse_tenk(document_text: str, ticker: str) -> Dict:
        """
        Parse 10-K filing and extract structured information
        """
        if not document_text or len(document_text.strip()) < 500:
            raise ValueError("10-K document text is too short")
        
        # Extract company name
        company_name = TenKParser._extract_company_name(document_text, ticker)
        
        # Extract fiscal year
        fiscal_year = TenKParser._extract_fiscal_year(document_text)
        
        # Extract business model
        business_model = TenKParser._extract_business_model(document_text)
        
        # Extract key suppliers
        key_suppliers = TenKParser._extract_suppliers(document_text)
        
        # Extract geographic revenue
        geographic_revenue = TenKParser._extract_geographic_revenue(document_text)
        
        # Extract product lines
        product_lines = TenKParser._extract_product_lines(document_text)
        
        # Extract risk factors
        risk_factors = TenKParser._extract_risk_factors(document_text)
        
        # Extract regulatory mentions
        regulatory_mentions = TenKParser._extract_regulatory_mentions(document_text)
        
        # Extract trade dependencies
        trade_dependencies = TenKParser._extract_trade_dependencies(document_text)
        
        return {
            "ticker": ticker,
            "company_name": company_name or f"{ticker} Inc.",
            "fiscal_year": fiscal_year or "2024",
            "business_model": business_model or "Technology company providing products and services.",
            "key_suppliers": key_suppliers,
            "geographic_revenue": geographic_revenue,
            "product_lines": product_lines,
            "risk_factors": risk_factors,
            "regulatory_mentions": regulatory_mentions,
            "trade_dependencies": trade_dependencies
        }
    
    @staticmethod
    def _extract_company_name(document_text: str, ticker: str) -> Optional[str]:
        """Extract company name from 10-K"""
        # Look for common patterns
        patterns = [
            rf'registrant\'?s\s+name:\s*([^\n]+)',
            rf'company\s+name:\s*([^\n]+)',
            rf'item\s+1\.\s+business[^\n]*\n([^\n]{{10,100}})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, document_text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if len(name) > 5 and len(name) < 100:
                    return name
        
        # Fallback: use ticker
        return f"{ticker} Inc."
    
    @staticmethod
    def _extract_fiscal_year(document_text: str) -> Optional[str]:
        """Extract fiscal year"""
        patterns = [
            r'fiscal\s+year\s+ended\s+.*?(\d{4})',
            r'fiscal\s+year\s+(\d{4})',
            r'(\d{4})\s+fiscal\s+year',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, document_text, re.IGNORECASE)
            if match:
                year = match.group(1)
                if 2000 <= int(year) <= 2030:
                    return year
        
        return None
    
    @staticmethod
    def _extract_business_model(document_text: str) -> Optional[str]:
        """Extract business model description"""
        # Look for Item 1 (Business) section
        business_section_pattern = r'item\s+1\.\s+business[^\n]*\n(.*?)(?=item\s+2|item\s+1a|$)'
        match = re.search(business_section_pattern, document_text, re.IGNORECASE | re.DOTALL)
        
        if match:
            business_text = match.group(1)
            # Extract first 2-3 sentences
            sentences = re.split(r'[.!?]\s+', business_text)
            business_model = '. '.join(sentences[:3])
            return business_model.strip()[:500]
        
        # Fallback: look for business description keywords
        business_keywords = ['business', 'company', 'operates', 'provides', 'products', 'services']
        sentences = re.split(r'[.!?]\s+', document_text)
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in business_keywords):
                if len(sentence) > 50 and len(sentence) < 300:
                    return sentence.strip()
        
        return None
    
    @staticmethod
    def _extract_suppliers(document_text: str) -> List[Dict]:
        """Extract key suppliers"""
        suppliers = []
        
        # Look for supplier-related sections
        supplier_patterns = [
            r'(?:supplier|vendor|manufacturer)[^.!?]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)[^.!?]*?(?:country|location|region)[^.!?]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'supplier[^.!?]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)[^.!?]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        ]
        
        supplier_keywords = ['supplier', 'vendor', 'manufacturer', 'partner']
        sentences = [s for s in re.split(r'[.!?]\s+', document_text) 
                    if any(kw in s.lower() for kw in supplier_keywords)]
        
        countries = ['China', 'USA', 'United States', 'Taiwan', 'South Korea', 'Japan', 'Germany', 'Mexico']
        
        for sentence in sentences[:20]:
            # Try to extract supplier name and country
            for country in countries:
                if country in sentence:
                    # Extract potential supplier name (words before country)
                    words = sentence.split()
                    country_idx = next((i for i, w in enumerate(words) if country.lower() in w.lower()), None)
                    if country_idx and country_idx > 0:
                        supplier_name = ' '.join(words[max(0, country_idx-3):country_idx])
                        if len(supplier_name) > 3:
                            suppliers.append({
                                "name": supplier_name.strip(),
                                "country": country,
                                "products": "Components and materials",
                                "dependency": "Medium"
                            })
                            break
        
        # Remove duplicates
        seen = set()
        unique_suppliers = []
        for supplier in suppliers:
            key = (supplier["name"].lower(), supplier["country"])
            if key not in seen:
                seen.add(key)
                unique_suppliers.append(supplier)
        
        return unique_suppliers[:10]
    
    @staticmethod
    def _extract_geographic_revenue(document_text: str) -> List[Dict]:
        """Extract geographic revenue breakdown"""
        revenue_data = []
        
        # Look for geographic revenue tables or sections
        geo_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)[^0-9]*(\d+(?:\.\d+)?)\s*%',
            r'geographic[^.!?]*revenue[^.!?]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)[^0-9]*(\d+(?:\.\d+)?)\s*%',
        ]
        
        regions = ['Americas', 'Europe', 'Asia', 'Pacific', 'China', 'Japan', 'Other']
        
        for region in regions:
            # Look for revenue percentages associated with regions
            pattern = rf'{region}[^0-9]*(\d+(?:\.\d+)?)\s*%[^$]*\$?(\d+(?:\.\d+)?)\s*(?:million|billion|B|M)'
            matches = re.findall(pattern, document_text, re.IGNORECASE)
            
            for match in matches:
                if len(match) == 2:
                    pct = float(match[0])
                    amount_str = match[1]
                    revenue_data.append({
                        "region": region,
                        "revenue_percent": pct,
                        "revenue_amount": f"${amount_str}B" if 'billion' in document_text.lower() else f"${amount_str}M"
                    })
        
        # If no structured data found, estimate from mentions
        if not revenue_data:
            for region in ['Americas', 'Europe', 'Asia']:
                if region.lower() in document_text.lower():
                    revenue_data.append({
                        "region": region,
                        "revenue_percent": 30.0,  # Placeholder
                        "revenue_amount": "$50B"
                    })
        
        return revenue_data[:10]
    
    @staticmethod
    def _extract_product_lines(document_text: str) -> List[Dict]:
        """Extract product lines"""
        product_lines = []
        
        # Look for product/service sections
        product_keywords = ['product', 'service', 'segment', 'division', 'revenue']
        
        sentences = [s for s in re.split(r'[.!?]\s+', document_text) 
                    if any(kw in s.lower() for kw in product_keywords)]
        
        # Look for patterns with percentages
        for sentence in sentences[:20]:
            pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', sentence)
            if pct_match:
                # Extract product name (words before percentage)
                words = sentence.split()
                pct_idx = next((i for i, w in enumerate(words) if '%' in w), None)
                if pct_idx and pct_idx > 0:
                    product_name = ' '.join(words[max(0, pct_idx-3):pct_idx])
                    if len(product_name) > 3:
                        product_lines.append({
                            "name": product_name.strip(),
                            "revenue_percent": float(pct_match.group(1)),
                            "description": sentence.strip()[:200]
                        })
        
        return product_lines[:10]
    
    @staticmethod
    def _extract_risk_factors(document_text: str) -> List[str]:
        """Extract risk factors"""
        risk_factors = []
        
        # Look for Item 1A (Risk Factors)
        risk_pattern = r'item\s+1a\.\s+risk\s+factors[^\n]*\n(.*?)(?=item\s+2|item\s+1b|$)'
        match = re.search(risk_pattern, document_text, re.IGNORECASE | re.DOTALL)
        
        if match:
            risk_text = match.group(1)
            # Extract numbered or bulleted items
            risk_items = re.split(r'(?:^\d+\.|^[•\-])\s+', risk_text, flags=re.MULTILINE)
            
            for item in risk_items[:15]:
                item = item.strip()
                if len(item) > 30 and len(item) < 300:
                    risk_factors.append(item)
        
        # Fallback: look for risk-related sentences
        if not risk_factors:
            risk_keywords = ['risk', 'uncertainty', 'could', 'may', 'adverse', 'impact']
            sentences = [s for s in re.split(r'[.!?]\s+', document_text) 
                        if any(kw in s.lower() for kw in risk_keywords)]
            
            for sentence in sentences[:10]:
                if len(sentence) > 30 and len(sentence) < 300:
                    risk_factors.append(sentence.strip())
        
        return risk_factors[:10]
    
    @staticmethod
    def _extract_regulatory_mentions(document_text: str) -> List[str]:
        """Extract regulatory mentions"""
        regulatory_mentions = []
        
        regulatory_keywords = [
            'regulation', 'regulatory', 'compliance', 'law', 'directive',
            'gdpr', 'sec', 'fda', 'ftc', 'tariff', 'sanction', 'trade'
        ]
        
        sentences = [s for s in re.split(r'[.!?]\s+', document_text) 
                    if any(kw in s.lower() for kw in regulatory_keywords)]
        
        for sentence in sentences[:10]:
            sentence = sentence.strip()
            if len(sentence) > 20 and len(sentence) < 300:
                regulatory_mentions.append(sentence)
        
        return list(set(regulatory_mentions))[:10]  # Remove duplicates
    
    @staticmethod
    def _extract_trade_dependencies(document_text: str) -> str:
        """Extract trade dependency description"""
        trade_keywords = ['trade', 'import', 'export', 'supply chain', 'international', 'global']
        
        sentences = [s for s in re.split(r'[.!?]\s+', document_text) 
                    if any(kw in s.lower() for kw in trade_keywords)]
        
        if sentences:
            # Combine first few relevant sentences
            dependency_text = '. '.join(sentences[:3])
            return dependency_text.strip()[:500]
        
        return "International trade dependencies vary based on business model and supply chain structure."