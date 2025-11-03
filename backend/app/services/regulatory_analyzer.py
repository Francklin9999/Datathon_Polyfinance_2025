"""
Regulatory Analyzer Service
Analyzes regulatory documents using NLP and AI
"""

import re
import json
import numpy as np
from typing import Dict, List, Optional

try:
    import spacy
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    SPACY_AVAILABLE = True
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    TRANSFORMERS_AVAILABLE = False

from app.services.aws_comprehend_service import ComprehendService
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured


class RegulatoryAnalyzer:
    """Service for analyzing regulatory documents"""
    
    @staticmethod
    def analyze_document(document_text: str) -> Dict:
        """
        Analyze regulatory document and extract structured information
        Uses AWS Comprehend and Bedrock when available, falls back to basic extraction
        """
        if not document_text or len(document_text.strip()) < 100:
            raise ValueError("Document text is too short or empty")
        
        # Try AWS Bedrock analysis first if configured
        if is_aws_configured():
            import logging
            logger = logging.getLogger(__name__)
            logger.info("   Attempting AWS Bedrock analysis...")
            try:
                bedrock_analysis = BedrockService.analyze_regulatory_document(
                    document_text=document_text,
                    document_type="regulation"
                )
                logger.info("   AWS Bedrock analysis completed successfully")
                
                if bedrock_analysis.get("parsed", True):
                    # Use Bedrock results as base
                    result = {
                        "regulation_name": bedrock_analysis.get("regulation_name", "Regulatory Document"),
                        "regulation_type": bedrock_analysis.get("regulation_type", "other"),
                        "issuing_body": bedrock_analysis.get("issuing_body", "Government"),
                        "jurisdiction": bedrock_analysis.get("jurisdiction", "USA"),
                        "effective_date": bedrock_analysis.get("effective_date", "2024-01-01"),
                        "summary": bedrock_analysis.get("summary", ""),
                        "method": "aws_bedrock",
                        **bedrock_analysis
                    }
                    
                    # Enhance with AWS Comprehend entity extraction
                    try:
                        logger.info("   Attempting AWS Comprehend entity extraction...")
                        comprehend_entities = ComprehendService.extract_entities(document_text)
                        result["entities"] = comprehend_entities.get("entities", {})
                        result["key_phrases"] = comprehend_entities.get("key_phrases", [])
                        logger.info("   AWS Comprehend extraction completed successfully")
                    except Exception as e:
                        logger.warning(f"   AWS Comprehend extraction failed: {str(e)}")
                        pass
                    
                    # Add basic extraction as fallback for missing fields
                    if not result.get("measures"):
                        result["measures"] = RegulatoryAnalyzer._extract_measures(document_text)
                    if not result.get("key_provisions"):
                        result["key_provisions"] = RegulatoryAnalyzer._extract_provisions(document_text)
                    
                    return result
            except Exception as e:
                # Fallback to basic extraction on error
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"   AWS Bedrock analysis failed: {str(e)}, falling back to basic extraction")
                pass
        
        # Basic extraction (fallback)
        # Extract basic information
        entities = RegulatoryAnalyzer._extract_entities(document_text)
        
        # Try AWS Comprehend for better entity extraction if configured
        if is_aws_configured():
            import logging
            logger = logging.getLogger(__name__)
            logger.info("   Attempting AWS Comprehend entity extraction (fallback path)...")
            try:
                comprehend_entities = ComprehendService.extract_entities(document_text)
                # Merge Comprehend entities with basic extraction
                comprehend_orgs = comprehend_entities.get("entities", {}).get("organizations", [])
                comprehend_locs = comprehend_entities.get("entities", {}).get("locations", [])
                
                if comprehend_orgs:
                    entities["tickers"].extend([e.get("text", "") for e in comprehend_orgs[:10]])
                if comprehend_locs:
                    entities["countries"].extend([e.get("text", "") for e in comprehend_locs[:10]])
                
                entities["key_phrases"] = [p.get("text", "") for p in comprehend_entities.get("key_phrases", [])[:20]]
                logger.info("   AWS Comprehend extraction completed successfully (fallback path)")
            except Exception as e:
                logger.warning(f"   AWS Comprehend extraction failed: {str(e)}")
                pass
        
        measures = RegulatoryAnalyzer._extract_measures(document_text)
        provisions = RegulatoryAnalyzer._extract_provisions(document_text)
        supply_chain_impact = RegulatoryAnalyzer._analyze_supply_chain_impact(document_text)
        
        # Generate summary
        summary = RegulatoryAnalyzer._generate_summary(document_text, entities, measures)
        
        # Extract dates
        effective_date = RegulatoryAnalyzer._extract_dates(document_text)
        
        # Extract jurisdiction and issuing body
        jurisdiction = RegulatoryAnalyzer._extract_jurisdiction(document_text)
        issuing_body = RegulatoryAnalyzer._extract_issuing_body(document_text)
        
        # Determine regulation type
        regulation_type = RegulatoryAnalyzer._classify_regulation_type(document_text, measures)
        
        # Extract regulation name
        regulation_name = RegulatoryAnalyzer._extract_regulation_name(document_text)
        
        # Extract citations
        citations = RegulatoryAnalyzer._extract_citations(document_text)
        
        return {
            "regulation_name": regulation_name or "Regulatory Document",
            "regulation_type": regulation_type,
            "issuing_body": issuing_body or "Government",
            "jurisdiction": jurisdiction or "USA",
            "effective_date": effective_date or "2024-01-01",
            "summary": summary,
            "entities": entities,
            "measures": measures,
            "key_provisions": provisions,
            "penalties": RegulatoryAnalyzer._extract_penalties(document_text),
            "exemptions": RegulatoryAnalyzer._extract_exemptions(document_text),
            "citations": citations,
            "supply_chain_impact": supply_chain_impact,
            "method": "basic_extraction"
        }
    
    @staticmethod
    def _extract_entities(document_text: str) -> Dict:
        """Extract entities using spaCy NER and embeddings for better accuracy"""
        entities = {
            "tickers": [],
            "sectors": [],
            "countries": []
        }
        
        # Use spaCy NER for entity extraction
        if SPACY_AVAILABLE:
            try:
                if not hasattr(RegulatoryAnalyzer, '_nlp_model'):
                    try:
                        RegulatoryAnalyzer._nlp_model = spacy.load("en_core_web_sm")
                    except:
                        RegulatoryAnalyzer._nlp_model = None
                
                if RegulatoryAnalyzer._nlp_model:
                    doc = RegulatoryAnalyzer._nlp_model(document_text[:100000])  # Limit text length
                    
                    # Extract organizations (often companies/tickers)
                    orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
                    # Filter for potential tickers (3-5 uppercase letters)
                    potential_tickers = [
                        org for org in orgs 
                        if 3 <= len(org) <= 5 and org.isupper() and org.isalpha()
                    ]
                    common_words = {'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN'}
                    entities["tickers"] = [t for t in set(potential_tickers) if t not in common_words][:20]
                    
                    # Extract locations (countries)
                    locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
                    # Known country list for filtering
                    known_countries = [
                        "USA", "United States", "China", "Japan", "Germany", "France",
                        "United Kingdom", "Canada", "Mexico", "South Korea", "India",
                        "Brazil", "Australia", "Italy", "Spain", "Netherlands", "Russia"
                    ]
                    # Use embeddings for semantic matching of country names
                    if TRANSFORMERS_AVAILABLE:
                        try:
                            if not hasattr(RegulatoryAnalyzer, '_embedding_model'):
                                try:
                                    # Use better prebuilt transformer for regulatory text analysis
                                    RegulatoryAnalyzer._embedding_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
                                except:
                                    try:
                                        RegulatoryAnalyzer._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                                    except:
                                        RegulatoryAnalyzer._embedding_model = None
                            
                            if RegulatoryAnalyzer._embedding_model:
                                location_embeddings = RegulatoryAnalyzer._embedding_model.encode(
                                    locations[:50], convert_to_numpy=True
                                )
                                country_embeddings = RegulatoryAnalyzer._embedding_model.encode(
                                    known_countries, convert_to_numpy=True
                                )
                                
                                similarities = cosine_similarity(location_embeddings, country_embeddings)
                                # Extract countries with similarity > 0.7
                                for i, loc in enumerate(locations[:50]):
                                    if np.max(similarities[i]) > 0.7:
                                        idx = np.argmax(similarities[i])
                                        if known_countries[idx] not in entities["countries"]:
                                            entities["countries"].append(known_countries[idx])
                        except:
                            pass
                    
                    # If embedding matching didn't work, fall back to keyword matching
                    if not entities["countries"]:
                        for country in known_countries:
                            if country.lower() in document_text.lower() or country in document_text:
                                entities["countries"].append(country)
                    
            except:
                pass
        
        # Fallback to regex pattern matching if spaCy not available
        if not entities["tickers"]:
            ticker_pattern = r'\b([A-Z]{2,5})\b'
            potential_tickers = re.findall(ticker_pattern, document_text)
            common_words = {'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'}
            entities["tickers"] = [t for t in set(potential_tickers) if t not in common_words and len(t) >= 3][:20]
        
        # Extract sectors using semantic embeddings
        sectors_list = [
            "Technology", "Healthcare", "Financials", "Consumer Discretionary",
            "Communication Services", "Industrials", "Consumer Staples",
            "Energy", "Utilities", "Real Estate", "Materials", "Automotive",
            "Manufacturing", "Aerospace", "Defense", "Pharmaceuticals"
        ]
        
        if TRANSFORMERS_AVAILABLE and hasattr(RegulatoryAnalyzer, '_embedding_model') and RegulatoryAnalyzer._embedding_model:
            try:
                # Split document into chunks for better matching
                sentences = re.split(r'[.!?]\s+', document_text)
                doc_chunks = [s for s in sentences if len(s) > 20][:20]  # Top 20 sentences
                
                if doc_chunks:
                    chunk_embeddings = RegulatoryAnalyzer._embedding_model.encode(
                        doc_chunks, convert_to_numpy=True
                    )
                    sector_embeddings = RegulatoryAnalyzer._embedding_model.encode(
                        [f"{s} sector industry" for s in sectors_list], convert_to_numpy=True
                    )
                    
                    similarities = cosine_similarity(chunk_embeddings, sector_embeddings)
                    # If any chunk has high similarity with a sector, include it
                    for i, sector in enumerate(sectors_list):
                        if np.max(similarities[:, i]) > 0.65:
                            if sector not in entities["sectors"]:
                                entities["sectors"].append(sector)
            except:
                pass
        
        # Fallback to keyword matching if embeddings didn't find sectors
        if not entities["sectors"]:
            for sector in sectors_list:
                if sector.lower() in document_text.lower():
                    entities["sectors"].append(sector)
        
        return entities
    
    @staticmethod
    def _extract_measures(document_text: str) -> List[Dict]:
        """Extract regulatory measures (tariffs, quotas, etc.)"""
        measures = []
        
        # Pattern for percentage-based measures
        pct_pattern = r'(\d+(?:\.\d+)?)\s*%'
        percentages = re.findall(pct_pattern, document_text)
        
        # Pattern for dollar amounts
        dollar_pattern = r'\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|billion|M|B)?'
        dollar_amounts = re.findall(dollar_pattern, document_text, re.IGNORECASE)
        
        # Look for common measure keywords
        measure_keywords = [
            "tariff", "tax", "subsidy", "credit", "quota", "ban", "restriction",
            "requirement", "mandate", "prohibition", "limitation"
        ]
        
        sentences = re.split(r'[.!?]\s+', document_text)
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for keyword in measure_keywords:
                if keyword in sentence_lower:
                    # Extract percentage if present
                    rate_pct = None
                    if percentages:
                        # Find percentage in same sentence
                        pct_in_sentence = re.findall(pct_pattern, sentence)
                        if pct_in_sentence:
                            rate_pct = float(pct_in_sentence[0])
                    
                    # Extract target
                    target_match = re.search(rf'{keyword}\s+(?:on|for|of)\s+([^,.!?]+)', sentence, re.IGNORECASE)
                    target = target_match.group(1).strip() if target_match else keyword.capitalize()
                    
                    measures.append({
                        "target": target,
                        "rate_pct": rate_pct,
                        "quota": None,
                        "description": sentence.strip(),
                        "citation_id": f"para-{len(measures) + 1}"
                    })
                    break
        
        # Limit to top 10 measures
        return measures[:10]
    
    @staticmethod
    def _extract_provisions(document_text: str) -> List[str]:
        """Extract key provisions"""
        provisions = []
        
        # Look for numbered sections
        section_pattern = r'(?:Section|Article|§|Sec\.?)\s*(\d+(?:[\.-]\d+)*)[:\s]+([^\n]{50,200})'
        sections = re.findall(section_pattern, document_text, re.IGNORECASE)
        
        for section_num, section_text in sections[:10]:
            provisions.append(f"{section_text.strip()} [sec-{section_num}]")
        
        # If no sections found, extract important sentences
        if not provisions:
            sentences = re.split(r'[.!?]\s+', document_text)
            important_keywords = ["shall", "must", "required", "prohibited", "mandated"]
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in important_keywords):
                    if len(sentence) > 30 and len(sentence) < 300:
                        provisions.append(sentence.strip())
                        if len(provisions) >= 10:
                            break
        
        return provisions[:10]
    
    @staticmethod
    def _analyze_supply_chain_impact(document_text: str) -> Dict:
        """Analyze supply chain impact"""
        supply_chain_keywords = [
            "supply chain", "supplier", "manufacturing", "component", "material",
            "sourcing", "procurement", "logistics", "vendor", "factory"
        ]
        
        affected_components = []
        affected_suppliers = []
        geographic_choke_points = []
        
        # Extract component mentions
        component_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:component|material|part)',
            r'components?\s+(?:such\s+as|including|including|:)\s+([^.!?]+)'
        ]
        
        for pattern in component_patterns:
            matches = re.findall(pattern, document_text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0] if match[0] else match[1]
                components = [c.strip() for c in re.split(r'[,;]', match) if len(c.strip()) > 3]
                affected_components.extend(components[:5])
        
        # Extract supplier mentions
        supplier_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:supplier|vendor|manufacturer)'
        supplier_matches = re.findall(supplier_pattern, document_text, re.IGNORECASE)
        affected_suppliers.extend(supplier_matches[:5])
        
        # Extract geographic mentions
        country_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:country|nation|region)'
        geo_matches = re.findall(country_pattern, document_text, re.IGNORECASE)
        geographic_choke_points.extend(geo_matches[:5])
        
        return {
            "affected_components": list(set(affected_components))[:10] if affected_components else ["Various components"],
            "affected_suppliers": list(set(affected_suppliers))[:10] if affected_suppliers else ["Various suppliers"],
            "geographic_choke_points": list(set(geographic_choke_points))[:10] if geographic_choke_points else ["Multiple regions"]
        }
    
    @staticmethod
    def _generate_summary(document_text: str, entities: Dict, measures: List) -> str:
        """Generate a summary of the regulation"""
        # Take first few sentences as summary
        sentences = re.split(r'[.!?]\s+', document_text)
        summary_sentences = []
        
        for sentence in sentences[:5]:
            if len(sentence) > 30:
                summary_sentences.append(sentence.strip())
        
        summary = '. '.join(summary_sentences)
        
        if len(summary) < 50:
            # Fallback summary
            entity_count = len(entities.get("tickers", []))
            measure_count = len(measures)
            summary = f"Regulatory document affecting {entity_count} companies with {measure_count} key measures. "
            summary += document_text[:200] + "..."
        
        return summary[:500]  # Limit summary length
    
    @staticmethod
    def _extract_dates(document_text: str) -> Optional[str]:
        """Extract effective date"""
        # Date patterns
        date_patterns = [
            r'effective\s+(?:date|as\s+of)?\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{4}-\d{2}-\d{2})'
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, document_text, re.IGNORECASE)
            if matches:
                return matches[0]
        
        return None
    
    @staticmethod
    def _extract_jurisdiction(document_text: str) -> Optional[str]:
        """Extract jurisdiction"""
        jurisdictions = ["USA", "United States", "EU", "Europe", "China", "Japan"]
        
        for jurisdiction in jurisdictions:
            if jurisdiction.lower() in document_text.lower():
                return jurisdiction if len(jurisdiction) <= 10 else "USA"
        
        return None
    
    @staticmethod
    def _extract_issuing_body(document_text: str) -> Optional[str]:
        """Extract issuing body"""
        bodies = ["Congress", "Parliament", "Commission", "Ministry", "Department"]
        
        for body in bodies:
            if body.lower() in document_text.lower():
                match = re.search(rf'([^.!?]*{body}[^.!?]*)', document_text, re.IGNORECASE)
                if match:
                    return match.group(0).strip()[:50]
        
        return None
    
    @staticmethod
    def _classify_regulation_type(document_text: str, measures: List) -> str:
        """Classify regulation type using NLP and semantic embeddings"""
        # Define regulation type descriptions with embeddings
        regulation_types = {
            "tariff": "tariff duty import tax trade restriction",
            "sanction": "sanction penalty restriction punishment embargo",
            "ban": "ban prohibit forbid restriction prevent",
            "subsidy": "subsidy credit tax credit incentive support",
            "reporting": "reporting disclosure requirement documentation",
            "environmental": "environment carbon emission climate environmental",
            "other": "regulation policy law rule"
        }
        
        try:
            # Use embeddings for semantic classification
            if TRANSFORMERS_AVAILABLE:
                if not hasattr(RegulatoryAnalyzer, '_embedding_model'):
                    try:
                        # Use better prebuilt transformer for regulation type classification
                        RegulatoryAnalyzer._embedding_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
                    except:
                        try:
                            RegulatoryAnalyzer._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                        except:
                            RegulatoryAnalyzer._embedding_model = None
                
                if RegulatoryAnalyzer._embedding_model:
                    # Extract key sentences from document (first few sentences usually contain type info)
                    sentences = re.split(r'[.!?]\s+', document_text)
                    key_sentences = [s.strip() for s in sentences[:10] if len(s.strip()) > 20]
                    
                    if key_sentences:
                        sentence_embeddings = RegulatoryAnalyzer._embedding_model.encode(
                            key_sentences, convert_to_numpy=True
                        )
                        type_embeddings = RegulatoryAnalyzer._embedding_model.encode(
                            list(regulation_types.values()), convert_to_numpy=True
                        )
                        
                        # Calculate similarity scores
                        similarities = cosine_similarity(sentence_embeddings, type_embeddings)
                        # Get max similarity across all sentences for each type
                        max_similarities = np.max(similarities, axis=0)
                        
                        # Find type with highest similarity
                        best_idx = np.argmax(max_similarities)
                        best_score = max_similarities[best_idx]
                        
                        # Only classify if similarity is above threshold (0.6)
                        if best_score > 0.6:
                            type_names = list(regulation_types.keys())
                            return type_names[best_idx]
        except:
            pass
        
        # Fallback to keyword-based classification
        text_lower = document_text.lower()
        
        if "tariff" in text_lower or "duty" in text_lower:
            return "tariff"
        elif "sanction" in text_lower:
            return "sanction"
        elif "ban" in text_lower or "prohibit" in text_lower:
            return "ban"
        elif "subsidy" in text_lower or "credit" in text_lower or "tax credit" in text_lower:
            return "subsidy"
        elif "reporting" in text_lower or "disclosure" in text_lower:
            return "reporting"
        elif "environment" in text_lower or "carbon" in text_lower:
            return "environmental"
        else:
            return "other"
    
    @staticmethod
    def _extract_regulation_name(document_text: str) -> Optional[str]:
        """Extract regulation name"""
        # Look for titles at the beginning
        lines = document_text.split('\n')[:10]
        for line in lines:
            line = line.strip()
            if len(line) > 20 and len(line) < 200:
                # Check if it looks like a title
                if line[0].isupper() and not line.endswith('.') and not ',' in line[-10:]:
                    return line
        
        return None
    
    @staticmethod
    def _extract_penalties(document_text: str) -> str:
        """Extract penalty information"""
        penalty_keywords = ["penalty", "fine", "sanction", "violation", "non-compliance"]
        
        sentences = re.split(r'[.!?]\s+', document_text)
        penalty_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in penalty_keywords):
                if len(sentence) > 20:
                    penalty_sentences.append(sentence.strip())
        
        if penalty_sentences:
            return ' '.join(penalty_sentences[:3])
        else:
            return "Standard penalties may apply for non-compliance."
    
    @staticmethod
    def _extract_exemptions(document_text: str) -> str:
        """Extract exemption information"""
        exemption_keywords = ["exempt", "exception", "exclusion", "waiver"]
        
        sentences = re.split(r'[.!?]\s+', document_text)
        exemption_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in exemption_keywords):
                if len(sentence) > 20:
                    exemption_sentences.append(sentence.strip())
        
        if exemption_sentences:
            return ' '.join(exemption_sentences[:3])
        else:
            return "No specific exemptions mentioned."
    
    @staticmethod
    def _extract_citations(document_text: str) -> List[Dict]:
        """Extract citations from document"""
        citations = []
        
        # Pattern for section citations
        citation_pattern = r'(?:Section|Article|§|Sec\.?)\s*(\d+(?:[\.-]\d+)*)[:\s]+([^\n]{20,300})'
        matches = re.findall(citation_pattern, document_text, re.IGNORECASE)
        
        for i, (section_num, text) in enumerate(matches[:10], 1):
            citations.append({
                "id": f"sec-{section_num.replace('.', '-')}",
                "text": text.strip()[:500],
                "paragraph": f"§{section_num}"
            })
        
        # If no structured citations, create paragraph-based citations
        if not citations:
            paragraphs = re.split(r'\n\n+', document_text)
            for i, para in enumerate(paragraphs[:10], 1):
                if len(para.strip()) > 50:
                    citations.append({
                        "id": f"para-{i}",
                        "text": para.strip()[:500],
                        "paragraph": f"Paragraph {i}"
                    })
        
        return citations