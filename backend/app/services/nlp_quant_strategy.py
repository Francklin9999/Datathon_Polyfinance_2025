"""
Advanced NLP-Based Quantitative Strategy Service
Uses spaCy, NLTK, and HuggingFace embeddings to analyze 10K/10Q filings
and generate trading signals based on textual analysis
"""

import re
import numpy as np
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import json

try:
    import spacy
    from spacy import displacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tag import pos_tag
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

try:
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    # Fallback cosine similarity function
    def cosine_similarity(a, b):
        import numpy as np
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


class NLPQuantStrategy:
    """Advanced NLP-based quantitative strategy using multiple NLP libraries"""
    
    # Initialize models lazily
    _nlp_model = None
    _sentiment_analyzer = None
    _embedding_model = None
    _stopwords = None
    _lemmatizer = None
    
    # Financial sentiment lexicons
    POSITIVE_FINANCIAL_TERMS = [
        'growth', 'expansion', 'increased', 'improved', 'strong', 'robust',
        'record', 'outperform', 'profit', 'gain', 'surge', 'boom', 'rally',
        'soar', 'boost', 'enhancement', 'opportunity', 'advantage', 'success',
        'achievement', 'milestone', 'breakthrough', 'innovation', 'leading',
        'dominant', 'premium', 'upside', 'bullish', 'optimistic', 'confidence'
    ]
    
    NEGATIVE_FINANCIAL_TERMS = [
        'decline', 'decrease', 'loss', 'weak', 'pressure', 'challenge', 'risk',
        'uncertainty', 'volatility', 'concern', 'adverse', 'impact', 'reduction',
        'downgrade', 'shortfall', 'miss', 'disappointment', 'headwind', 'bearish',
        'pessimistic', 'caution', 'warning', 'threat', 'vulnerability', 'exposure',
        'deterioration', 'erosion', 'decline', 'recession', 'crisis', 'disruption'
    ]
    
    UNCERTAINTY_TERMS = [
        'may', 'could', 'might', 'uncertain', 'unclear', 'potentially', 'possibly',
        'perhaps', 'maybe', 'conditional', 'subject to', 'depends on', 'if',
        'pending', 'proposed', 'anticipated', 'expected', 'forecast', 'projected'
    ]
    
    FORWARD_LOOKING_PATTERNS = [
        r'we\s+(?:expect|anticipate|believe|plan|intend|forecast|project)',
        r'future\s+(?:growth|performance|results|outlook)',
        r'going\s+forward',
        r'outlook\s+(?:for|is)',
        r'guidance',
        r'forward-looking',
        r'projected\s+(?:revenue|earnings|growth)',
        r'estimated\s+(?:to|at)'
    ]
    
    @classmethod
    def _load_nlp_models(cls):
        """Lazy load NLP models"""
        if cls._nlp_model is None and SPACY_AVAILABLE:
            try:
                cls._nlp_model = spacy.load("en_core_web_sm")
            except OSError:
                # Fallback: use blank model if spaCy model not installed
                cls._nlp_model = spacy.blank("en")
        
        if cls._sentiment_analyzer is None and NLTK_AVAILABLE:
            try:
                cls._sentiment_analyzer = SentimentIntensityAnalyzer()
            except LookupError:
                # Download required NLTK data
                try:
                    nltk.download('vader_lexicon', quiet=True)
                    nltk.download('punkt', quiet=True)
                    nltk.download('stopwords', quiet=True)
                    nltk.download('wordnet', quiet=True)
                    nltk.download('averaged_perceptron_tagger', quiet=True)
                    cls._sentiment_analyzer = SentimentIntensityAnalyzer()
                except:
                    pass
        
        if cls._embedding_model is None and TRANSFORMERS_AVAILABLE:
            try:
                # Use financial-domain model if available, otherwise general model
                cls._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            except:
                pass
        
        if cls._stopwords is None and NLTK_AVAILABLE:
            try:
                cls._stopwords = set(stopwords.words('english'))
            except:
                cls._stopwords = set()
        
        if cls._lemmatizer is None and NLTK_AVAILABLE:
            try:
                cls._lemmatizer = WordNetLemmatizer()
            except:
                pass
    
    @staticmethod
    def analyze_filing_advanced(
        document_text: str,
        ticker: str,
        previous_filing: Optional[str] = None,
        benchmark_tickers: Optional[List[str]] = None
    ) -> Dict:
        """
        Advanced NLP analysis of 10K/10Q filing using multiple NLP techniques
        
        Returns comprehensive NLP-based signals for trading strategy
        """
        NLPQuantStrategy._load_nlp_models()
        
        # Preprocess document
        sentences = NLPQuantStrategy._extract_sentences(document_text)
        
        # 1. Financial Sentiment Analysis
        sentiment_scores = NLPQuantStrategy._analyze_financial_sentiment(document_text, sentences)
        
        # 2. Forward-Looking Statement Extraction
        forward_statements = NLPQuantStrategy._extract_forward_looking_statements(document_text)
        
        # 3. Entity Extraction (Financial metrics, companies, dates)
        entities = NLPQuantStrategy._extract_financial_entities(document_text)
        
        # 4. Risk Factor Analysis
        risk_analysis = NLPQuantStrategy._analyze_risk_factors(document_text)
        
        # 5. Tone Analysis (using spaCy)
        tone_analysis = NLPQuantStrategy._analyze_tone_advanced(document_text)
        
        # 6. Embedding-based Comparison
        embedding_features = {}
        if previous_filing:
            embedding_features = NLPQuantStrategy._compare_with_previous(previous_filing, document_text)
        
        if benchmark_tickers:
            embedding_features['benchmark_comparison'] = NLPQuantStrategy._compare_with_peers(
                document_text, benchmark_tickers
            )
        
        # 7. Generate Trading Signals
        signals = NLPQuantStrategy._generate_trading_signals(
            sentiment_scores,
            forward_statements,
            risk_analysis,
            tone_analysis,
            embedding_features,
            ticker
        )
        
        # 8. Anomaly Detection
        anomalies = NLPQuantStrategy._detect_anomalies(document_text, sentences)
        
        return {
            "ticker": ticker,
            "nlp_analysis": {
                "sentiment_scores": sentiment_scores,
                "forward_looking_statements": forward_statements,
                "entities": entities,
                "risk_analysis": risk_analysis,
                "tone_analysis": tone_analysis,
                "embedding_features": embedding_features,
                "anomalies": anomalies
            },
            "trading_signals": signals,
            "strategy_score": signals.get("overall_score", 0.0),
            "confidence": signals.get("confidence", 0.0),
            "recommendation": signals.get("recommendation", "HOLD")
        }
    
    @staticmethod
    def _extract_sentences(document_text: str) -> List[str]:
        """Extract sentences from document"""
        if NLTK_AVAILABLE:
            try:
                return sent_tokenize(document_text)
            except:
                pass
        
        # Fallback: simple sentence splitting
        sentences = re.split(r'[.!?]+\s+', document_text)
        return [s.strip() for s in sentences if len(s.strip()) > 20]
    
    @staticmethod
    def _analyze_financial_sentiment(document_text: str, sentences: List[str]) -> Dict:
        """Analyze financial sentiment using multiple methods"""
        scores = {
            "overall_sentiment": 0.0,
            "positive_score": 0.0,
            "negative_score": 0.0,
            "uncertainty_score": 0.0,
            "financial_sentiment": 0.0,
            "vader_scores": {}
        }
        
        # Method 1: Financial lexicon-based sentiment
        positive_count = sum(1 for term in NLPQuantStrategy.POSITIVE_FINANCIAL_TERMS 
                           if term in document_text.lower())
        negative_count = sum(1 for term in NLPQuantStrategy.NEGATIVE_FINANCIAL_TERMS 
                           if term in document_text.lower())
        uncertainty_count = sum(1 for term in NLPQuantStrategy.UNCERTAINTY_TERMS 
                              if term in document_text.lower())
        
        total_financial_terms = positive_count + negative_count + 0.5 * uncertainty_count
        if total_financial_terms > 0:
            scores["financial_sentiment"] = (positive_count - negative_count) / total_financial_terms
        
        # Method 2: VADER sentiment (NLTK)
        if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
            try:
                vader_scores = NLPQuantStrategy._sentiment_analyzer.polarity_scores(document_text[:10000])
                scores["vader_scores"] = vader_scores
                scores["positive_score"] = vader_scores.get("pos", 0.0)
                scores["negative_score"] = vader_scores.get("neg", 0.0)
                scores["overall_sentiment"] = vader_scores.get("compound", 0.0)
            except:
                pass
        
        # Calculate sentence-level sentiment
        sentence_sentiments = []
        for sentence in sentences[:100]:  # Limit to first 100 sentences
            if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                try:
                    sent_score = NLPQuantStrategy._sentiment_analyzer.polarity_scores(sentence)
                    sentence_sentiments.append(sent_score["compound"])
                except:
                    pass
        
        if sentence_sentiments:
            scores["average_sentence_sentiment"] = np.mean(sentence_sentiments)
            scores["sentiment_volatility"] = np.std(sentence_sentiments)
        
        # Uncertainty score
        uncertainty_matches = sum(1 for pattern in NLPQuantStrategy.UNCERTAINTY_TERMS 
                               for _ in re.finditer(rf'\b{pattern}\b', document_text.lower()))
        scores["uncertainty_score"] = min(uncertainty_matches / max(len(sentences), 1) * 100, 100)
        
        return scores
    
    @staticmethod
    def _extract_forward_looking_statements(document_text: str) -> List[Dict]:
        """Extract forward-looking statements using pattern matching"""
        forward_statements = []
        
        for pattern in NLPQuantStrategy.FORWARD_LOOKING_PATTERNS:
            matches = re.finditer(pattern, document_text, re.IGNORECASE)
            for match in matches:
                # Extract surrounding context
                start = max(0, match.start() - 100)
                end = min(len(document_text), match.end() + 200)
                context = document_text[start:end].strip()
                
                # Extract sentence containing the pattern
                sentence_match = re.search(r'[^.!?]*' + re.escape(match.group()) + r'[^.!?]*[.!?]', context)
                if sentence_match:
                    sentence = sentence_match.group().strip()
                    
                    # Score sentiment of forward-looking statement
                    sentiment_score = 0.0
                    if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                        try:
                            sentiment_score = NLPQuantStrategy._sentiment_analyzer.polarity_scores(sentence)["compound"]
                        except:
                            pass
                    
                    forward_statements.append({
                        "statement": sentence[:500],
                        "pattern": pattern,
                        "sentiment": sentiment_score,
                        "position": match.start()
                    })
        
        # Sort by position and limit to top 20
        forward_statements.sort(key=lambda x: x["position"])
        return forward_statements[:20]
    
    @staticmethod
    def _extract_financial_entities(document_text: str) -> Dict:
        """Extract financial entities using spaCy NER and regex"""
        entities = {
            "financial_metrics": [],
            "companies": [],
            "dates": [],
            "amounts": [],
            "percentages": []
        }
        
        # Use spaCy for entity extraction
        if SPACY_AVAILABLE and NLPQuantStrategy._nlp_model:
            try:
                doc = NLPQuantStrategy._nlp_model(document_text[:100000])  # Limit length
                
                for ent in doc.ents:
                    if ent.label_ in ["ORG", "PERSON"]:
                        entities["companies"].append({
                            "text": ent.text,
                            "label": ent.label_,
                            "start": ent.start_char,
                            "end": ent.end_char
                        })
                    elif ent.label_ == "DATE":
                        entities["dates"].append({
                            "text": ent.text,
                            "start": ent.start_char,
                            "end": ent.end_char
                        })
            except:
                pass
        
        # Extract financial amounts using regex
        amount_patterns = [
            r'\$[\d,]+(?:\.\d+)?\s*(?:million|billion|M|B|thousand)?',
            r'[\d,]+(?:\.\d+)?\s*(?:million|billion|M|B|thousand)\s*(?:dollars|USD)?'
        ]
        
        for pattern in amount_patterns:
            matches = re.finditer(pattern, document_text, re.IGNORECASE)
            for match in matches:
                entities["amounts"].append({
                    "text": match.group(),
                    "position": match.start()
                })
        
        # Extract percentages
        percentage_pattern = r'[\d,]+(?:\.\d+)?\s*%'
        matches = re.finditer(percentage_pattern, document_text)
        for match in matches:
            entities["percentages"].append({
                "text": match.group(),
                "value": float(match.group().replace('%', '').replace(',', '')),
                "position": match.start()
            })
        
        # Extract financial metrics
        financial_keywords = [
            'revenue', 'earnings', 'profit', 'EBITDA', 'EPS', 'ROE', 'ROA',
            'margin', 'growth rate', 'market share', 'CAPEX', 'free cash flow',
            'operating income', 'net income', 'assets', 'liabilities', 'equity'
        ]
        
        for keyword in financial_keywords:
            pattern = rf'\b{keyword}\b[^.!?]*[\d,]+(?:\.\d+)?'
            matches = re.finditer(pattern, document_text, re.IGNORECASE)
            for match in list(matches)[:5]:  # Limit per keyword
                entities["financial_metrics"].append({
                    "metric": keyword,
                    "context": match.group()[:200],
                    "position": match.start()
                })
        
        # Deduplicate
        for key in entities:
            if entities[key]:
                seen = set()
                unique_entities = []
                for item in entities[key]:
                    if isinstance(item, dict):
                        item_key = item.get("text") or item.get("context") or str(item)
                    else:
                        item_key = str(item)
                    if item_key not in seen:
                        seen.add(item_key)
                        unique_entities.append(item)
                entities[key] = unique_entities[:50]  # Limit to top 50
        
        return entities
    
    @staticmethod
    def _analyze_risk_factors(document_text: str) -> Dict:
        """Analyze risk factors section"""
        risk_section_pattern = r'item\s+1a\.?\s+risk\s+factors[^\n]*\n(.*?)(?=item\s+[2-9]|item\s+1b|$)'
        match = re.search(risk_section_pattern, document_text, re.IGNORECASE | re.DOTALL)
        
        risk_analysis = {
            "risk_count": 0,
            "severity_score": 0.0,
            "risk_categories": [],
            "key_risks": []
        }
        
        if match:
            risk_text = match.group(1)
            
            # Count risk factors
            risk_items = re.split(r'(?:^\d+\.|^[•\-])\s+', risk_text, flags=re.MULTILINE)
            risk_analysis["risk_count"] = len([r for r in risk_items if len(r.strip()) > 30])
            
            # Analyze severity using negative sentiment
            if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                try:
                    sentiment = NLPQuantStrategy._sentiment_analyzer.polarity_scores(risk_text[:10000])
                    risk_analysis["severity_score"] = abs(sentiment["neg"]) * 100
                except:
                    pass
            
            # Extract key risks (first 10)
            for item in risk_items[:10]:
                item = item.strip()
                if len(item) > 30 and len(item) < 500:
                    risk_analysis["key_risks"].append(item[:300])
        
        # Categorize risks
        risk_categories = {
            "market_risk": len(re.findall(r'\b(market|competition|demand|economic)\b', document_text, re.IGNORECASE)),
            "operational_risk": len(re.findall(r'\b(operational|supply|production|manufacturing)\b', document_text, re.IGNORECASE)),
            "financial_risk": len(re.findall(r'\b(financial|liquidity|credit|debt|leverage)\b', document_text, re.IGNORECASE)),
            "regulatory_risk": len(re.findall(r'\b(regulatory|compliance|legal|litigation)\b', document_text, re.IGNORECASE)),
            "technology_risk": len(re.findall(r'\b(technology|cyber|data|security|IT)\b', document_text, re.IGNORECASE))
        }
        
        risk_analysis["risk_categories"] = [
            {"category": k, "count": v} for k, v in risk_categories.items() if v > 0
        ]
        
        return risk_analysis
    
    @staticmethod
    def _analyze_tone_advanced(document_text: str) -> Dict:
        """Advanced tone analysis using spaCy linguistic features"""
        tone_analysis = {
            "formality_score": 0.0,
            "certainty_score": 0.0,
            "readability_score": 0.0,
            "linguistic_features": {}
        }
        
        if SPACY_AVAILABLE and NLPQuantStrategy._nlp_model:
            try:
                doc = NLPQuantStrategy._nlp_model(document_text[:50000])
                
                # Analyze modal verbs (uncertainty markers)
                modal_verbs = ['may', 'might', 'could', 'would', 'should', 'must', 'can']
                modal_count = sum(1 for token in doc if token.text.lower() in modal_verbs)
                tone_analysis["certainty_score"] = 100 - min(modal_count / len(doc) * 10000, 100)
                
                # Analyze sentence structure
                complex_sentences = sum(1 for sent in doc.sents if len(sent) > 30)
                tone_analysis["readability_score"] = min(100 - (complex_sentences / len(list(doc.sents)) * 100), 100)
                
                # Analyze linguistic features
                tone_analysis["linguistic_features"] = {
                    "average_sentence_length": np.mean([len(sent) for sent in doc.sents]) if doc.sents else 0,
                    "pos_distribution": {pos: sum(1 for token in doc if token.pos_ == pos) for pos in ['NOUN', 'VERB', 'ADJ']}
                }
            except:
                pass
        
        return tone_analysis
    
    @staticmethod
    def _compare_with_previous(previous_filing: str, current_filing: str) -> Dict:
        """Compare current filing with previous using embeddings"""
        comparison = {
            "similarity_score": 0.0,
            "tone_change": 0.0,
            "sentiment_change": 0.0,
            "key_differences": []
        }
        
        if TRANSFORMERS_AVAILABLE and NLPQuantStrategy._embedding_model:
            try:
                # Generate embeddings
                current_embedding = NLPQuantStrategy._embedding_model.encode(
                    current_filing[:10000], convert_to_numpy=True
                )
                previous_embedding = NLPQuantStrategy._embedding_model.encode(
                    previous_filing[:10000], convert_to_numpy=True
                )
                
                # Calculate similarity
                if SKLEARN_AVAILABLE:
                    similarity = cosine_similarity(
                        current_embedding.reshape(1, -1),
                        previous_embedding.reshape(1, -1)
                    )[0][0]
                else:
                    # Fallback: direct cosine similarity
                    similarity = cosine_similarity(
                        current_embedding.reshape(-1),
                        previous_embedding.reshape(-1)
                    )
                comparison["similarity_score"] = float(similarity)
                
                # Compare sentiment
                if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                    try:
                        current_sent = NLPQuantStrategy._sentiment_analyzer.polarity_scores(current_filing[:10000])
                        previous_sent = NLPQuantStrategy._sentiment_analyzer.polarity_scores(previous_filing[:10000])
                        comparison["sentiment_change"] = current_sent["compound"] - previous_sent["compound"]
                    except:
                        pass
            except:
                pass
        
        return comparison
    
    @staticmethod
    def _compare_with_peers(current_filing: str, benchmark_tickers: List[str]) -> Dict:
        """Compare filing with peer companies (would need peer filings in real implementation)"""
        return {
            "peer_similarity": {},
            "relative_sentiment": {},
            "note": "Peer comparison requires peer filing data"
        }
    
    @staticmethod
    def _detect_anomalies(document_text: str, sentences: List[str]) -> List[Dict]:
        """Detect anomalous language patterns"""
        anomalies = []
        
        # Detect sudden tone changes
        if len(sentences) > 10:
            sentence_sentiments = []
            for sentence in sentences[:100]:
                if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                    try:
                        sent = NLPQuantStrategy._sentiment_analyzer.polarity_scores(sentence)
                        sentence_sentiments.append(sent["compound"])
                    except:
                        pass
            
            if len(sentence_sentiments) > 5:
                # Detect large sentiment swings
                for i in range(1, len(sentence_sentiments)):
                    change = abs(sentence_sentiments[i] - sentence_sentiments[i-1])
                    if change > 0.5:  # Large sentiment swing
                        anomalies.append({
                            "type": "sentiment_swing",
                            "severity": "high" if change > 0.7 else "medium",
                            "position": i,
                            "change": float(change),
                            "context": sentences[i][:200] if i < len(sentences) else ""
                        })
        
        # Detect unusual uncertainty spikes
        uncertainty_density = []
        window_size = 20
        for i in range(0, min(len(sentences), 100), window_size):
            window = ' '.join(sentences[i:i+window_size])
            uncertainty_count = sum(1 for term in NLPQuantStrategy.UNCERTAINTY_TERMS 
                                   if term in window.lower())
            uncertainty_density.append(uncertainty_count / len(window.split()) * 1000)
        
        if uncertainty_density:
            avg_uncertainty = np.mean(uncertainty_density)
            for i, density in enumerate(uncertainty_density):
                if density > avg_uncertainty * 2:  # Spike in uncertainty
                    anomalies.append({
                        "type": "uncertainty_spike",
                        "severity": "high" if density > avg_uncertainty * 3 else "medium",
                        "position": i * window_size,
                        "density": float(density)
                    })
        
        return anomalies[:10]
    
    @staticmethod
    def _generate_trading_signals(
        sentiment_scores: Dict,
        forward_statements: List[Dict],
        risk_analysis: Dict,
        tone_analysis: Dict,
        embedding_features: Dict,
        ticker: str
    ) -> Dict:
        """Generate trading signals based on NLP analysis"""
        signals = {
            "signal": "HOLD",
            "strength": 0.0,
            "confidence": 0.0,
            "overall_score": 0.0,
            "recommendation": "HOLD",
            "rationale": [],
            "components": {}
        }
        
        # Component 1: Sentiment Score (weight: 0.3)
        sentiment_component = sentiment_scores.get("overall_sentiment", 0.0) * 100
        financial_sentiment = sentiment_scores.get("financial_sentiment", 0.0) * 100
        sentiment_score = (sentiment_component * 0.6 + financial_sentiment * 0.4)
        signals["components"]["sentiment"] = sentiment_score
        
        # Component 2: Forward-Looking Statements (weight: 0.25)
        if forward_statements:
            avg_forward_sentiment = np.mean([s.get("sentiment", 0.0) for s in forward_statements])
            forward_score = avg_forward_sentiment * 100
        else:
            forward_score = 0.0
        signals["components"]["forward_looking"] = forward_score
        
        # Component 3: Risk Analysis (weight: 0.2)
        risk_severity = risk_analysis.get("severity_score", 0.0)
        risk_count = risk_analysis.get("risk_count", 0)
        # Lower risk = higher score
        risk_score = max(0, 100 - min(risk_severity, 100) * 0.5 - risk_count * 2)
        signals["components"]["risk"] = risk_score
        
        # Component 4: Tone Analysis (weight: 0.15)
        certainty_score = tone_analysis.get("certainty_score", 50.0)
        signals["components"]["certainty"] = certainty_score
        
        # Component 5: Comparison with Previous (weight: 0.1)
        if embedding_features:
            similarity = embedding_features.get("similarity_score", 0.0) * 100
            sentiment_change = embedding_features.get("sentiment_change", 0.0) * 100
            comparison_score = 50 + sentiment_change * 0.5  # Base 50, adjust by sentiment change
        else:
            comparison_score = 50.0
        signals["components"]["comparison"] = comparison_score
        
        # Calculate overall score (weighted average)
        overall_score = (
            sentiment_score * 0.3 +
            forward_score * 0.25 +
            risk_score * 0.2 +
            certainty_score * 0.15 +
            comparison_score * 0.1
        )
        
        signals["overall_score"] = overall_score
        
        # Determine signal
        if overall_score > 60:
            signals["signal"] = "BUY"
            signals["recommendation"] = "BUY"
            signals["strength"] = min((overall_score - 60) / 40 * 100, 100)
        elif overall_score < 40:
            signals["signal"] = "SELL"
            signals["recommendation"] = "SELL"
            signals["strength"] = min((40 - overall_score) / 40 * 100, 100)
        else:
            signals["signal"] = "HOLD"
            signals["recommendation"] = "HOLD"
            signals["strength"] = 50 - abs(overall_score - 50)
        
        # Calculate confidence based on component agreement
        component_scores = list(signals["components"].values())
        if component_scores:
            std_dev = np.std(component_scores)
            signals["confidence"] = max(0, 100 - std_dev * 2)
        
        # Generate rationale
        if sentiment_score > 60:
            signals["rationale"].append(f"Strong positive sentiment ({sentiment_score:.1f})")
        elif sentiment_score < 40:
            signals["rationale"].append(f"Negative sentiment detected ({sentiment_score:.1f})")
        
        if forward_score > 60:
            signals["rationale"].append(f"Optimistic forward-looking statements")
        elif forward_score < 40:
            signals["rationale"].append(f"Pessimistic forward-looking statements")
        
        if risk_score < 40:
            signals["rationale"].append(f"High risk factor count: {risk_count}")
        
        if certainty_score < 40:
            signals["rationale"].append("High uncertainty in language")
        
        if not signals["rationale"]:
            signals["rationale"].append("Mixed signals - neutral analysis")
        
        return signals

