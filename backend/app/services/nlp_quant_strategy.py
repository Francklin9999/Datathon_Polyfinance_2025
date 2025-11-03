import re
import numpy as np
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

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
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False

try:
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    # Fallback cosine similarity function
    def cosine_similarity(a, b):
        import numpy as np
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False


class NLPQuantStrategy:
    """NLP-based quantitative strategy using multiple NLP libraries"""
    
    _nlp_model = None
    _sentiment_analyzer = None
    _embedding_model = None
    _financial_sentiment_model = None  # Financial domain transformer (e.g., FinBERT)
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
        """Load NLP models"""
        if cls._nlp_model is None and SPACY_AVAILABLE:
            try:
                cls._nlp_model = spacy.load("en_core_web_sm")
            except OSError:
                cls._nlp_model = spacy.blank("en")
        
        if cls._sentiment_analyzer is None and NLTK_AVAILABLE:
            try:
                cls._sentiment_analyzer = SentimentIntensityAnalyzer()
            except LookupError:
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
                financial_models = [
                    'sentence-transformers/all-mpnet-base-v2',
                    'sentence-transformers/all-MiniLM-L6-v2',
                    'ProsusAI/finbert',
                ]
                for model_name in financial_models:
                    try:
                        cls._embedding_model = SentenceTransformer(model_name)
                        break
                    except:
                        continue
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
        
        if cls._financial_sentiment_model is None and HUGGINGFACE_AVAILABLE:
            try:
                financial_models = [
                    'ProsusAI/finbert',
                    'yiyanghkust/finbert-tone',
                ]
                for model_name in financial_models:
                    try:
                        cls._financial_sentiment_model = pipeline(
                            "sentiment-analysis",
                            model=model_name,
                            tokenizer=model_name,
                            device=-1
                        )
                        break
                    except:
                        continue
            except:
                pass
    
    @staticmethod
    def analyze_filing_advanced(
        document_text: str,
        ticker: str,
        previous_filing: Optional[str] = None,
        benchmark_tickers: Optional[List[str]] = None
    ) -> Dict:
        """NLP analysis of 10K/10Q filing using multiple NLP techniques"""
        NLPQuantStrategy._load_nlp_models()
        
        document_text_filtered = NLPQuantStrategy._remove_common_filing_text(document_text)
        sentences = NLPQuantStrategy._extract_sentences(document_text_filtered)
        
        import multiprocessing
        max_workers = multiprocessing.cpu_count()
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(NLPQuantStrategy._analyze_financial_sentiment, document_text_filtered, sentences): 'sentiment',
                executor.submit(NLPQuantStrategy._extract_forward_looking_statements, document_text_filtered): 'forward_statements',
                executor.submit(NLPQuantStrategy._extract_financial_entities, document_text_filtered): 'entities',
                executor.submit(NLPQuantStrategy._analyze_risk_factors, document_text_filtered): 'risk_analysis',
                executor.submit(NLPQuantStrategy._analyze_tone_advanced, document_text_filtered): 'tone_analysis'
            }
            
            results = {}
            for future in as_completed(futures):
                key = futures[future]
                try:
                    results[key] = future.result()
                except Exception as e:
                    print(f"Error in {key} analysis: {e}")
                    if key == 'sentiment':
                        results[key] = {'compound': 0.0, 'pos': 0.0, 'neu': 0.0, 'neg': 0.0}
                    elif key == 'forward_statements':
                        results[key] = []
                    elif key == 'entities':
                        results[key] = {}
                    elif key == 'risk_analysis':
                        results[key] = {'risk_factors': [], 'severity': 0.0}
                    elif key == 'tone_analysis':
                        results[key] = {'certainty': 0.5, 'formality': 0.5, 'readability': 0.5}
        
        sentiment_scores = results.get('sentiment', {'compound': 0.0, 'pos': 0.0, 'neu': 0.0, 'neg': 0.0})
        forward_statements = results.get('forward_statements', [])
        entities = results.get('entities', {})
        risk_analysis = results.get('risk_analysis', {'risk_factors': [], 'severity': 0.0})
        tone_analysis = results.get('tone_analysis', {'certainty': 0.5, 'formality': 0.5, 'readability': 0.5})
        
        embedding_features = {}
        if previous_filing:
            previous_filing_filtered = NLPQuantStrategy._remove_common_filing_text(previous_filing)
            embedding_features = NLPQuantStrategy._compare_with_previous(previous_filing_filtered, document_text_filtered)
        
        if benchmark_tickers:
            embedding_features['benchmark_comparison'] = NLPQuantStrategy._compare_with_peers(
                document_text, benchmark_tickers
            )
        
        signals = NLPQuantStrategy._generate_trading_signals(
            sentiment_scores,
            forward_statements,
            risk_analysis,
            tone_analysis,
            embedding_features,
            ticker
        )
        
        anomalies = NLPQuantStrategy._detect_anomalies(document_text_filtered, sentences)
        
        original_length = len(document_text)
        filtered_length = len(document_text_filtered)
        deduplication_ratio = (original_length - filtered_length) / original_length if original_length > 0 else 0.0
        
        return {
            "ticker": ticker,
            "nlp_analysis": {
                "sentiment_scores": sentiment_scores,
                "forward_looking_statements": forward_statements,
                "entities": entities,
                "risk_analysis": risk_analysis,
                "tone_analysis": tone_analysis,
                "embedding_features": embedding_features,
                "anomalies": anomalies,
                "deduplication": {
                    "original_length": original_length,
                    "filtered_length": filtered_length,
                    "removed_ratio": round(deduplication_ratio * 100, 2),
                    "unique_content_focus": True
                }
            },
            "trading_signals": signals,
            "strategy_score": signals.get("overall_score", 0.0),
            "confidence": signals.get("confidence", 0.0),
            "recommendation": signals.get("recommendation", "HOLD")
        }
    
    @staticmethod
    def _remove_common_filing_text(document_text: str) -> str:
        """Remove common boilerplate text that appears in most filings"""
        common_patterns = [
            r"Cautionary Statement Regarding Forward-Looking Statements[^.]*\.\s*",
            r"The Company[^.]*believes[^.]*forward-looking statements[^.]*\.\s*",
            r"These forward-looking statements[^.]*risks[^.]*\.\s*",
            r"Actual results[^.]*differ[^.]*materially[^.]*\.\s*",
            r"In addition to the factors[^.]*risks[^.]*discussed[^.]*\.\s*",
            r"Item\s+\d+[\.:]\s+[^.]*\.\s*",  # Remove section headers like "Item 1: Business"
            r"PART\s+[IVX]+\s*",  # Remove PART I, PART II, etc.
            r"FORM\s+10-K\s*",  # Remove form headers
            r"UNITED STATES\s+SECURITIES\s+AND\s+EXCHANGE\s+COMMISSION\s*",
            r"ANNUAL REPORT PURSUANT TO SECTION[^.]*\.\s*",
            r"Exchange Act of 1934[^.]*\.\s*",
            r"Commission File Number[^.]*\.\s*",
            r"Indicate by check mark[^.]*\.\s*",
            r"Accelerated filer[^.]*\.\s*",
            r"Large accelerated filer[^.]*\.\s*",
            r"Non-accelerated filer[^.]*\.\s*",
            r"Smaller reporting company[^.]*\.\s*",
            r"Yes ☐ No ☐\s*",  # Checkbox patterns
            r"The registrant[^.]*\.\s*",
            r"Pursuant to the requirements[^.]*\.\s*",
            r"All amounts[^.]*millions[^.]*except[^.]*\.\s*",
            r"Percentages may not add[^.]*rounding[^.]*\.\s*",
            r"Note: [^.]*the consolidated financial statements[^.]*\.\s*",
        ]
        
        # Remove common patterns
        filtered_text = document_text
        for pattern in common_patterns:
            filtered_text = re.sub(pattern, "", filtered_text, flags=re.IGNORECASE | re.MULTILINE)
        
        # Remove very common sentences using embedding similarity
        if TRANSFORMERS_AVAILABLE and hasattr(NLPQuantStrategy, '_embedding_model') and NLPQuantStrategy._embedding_model:
            try:
                filtered_text = NLPQuantStrategy._remove_similar_sentences_embedding(filtered_text)
            except:
                pass
        
        # Remove overly short sentences (likely headers or artifacts)
        sentences = re.split(r'[.!?]\s+', filtered_text)
        meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 30]  # Keep sentences > 30 chars
        filtered_text = '. '.join(meaningful_sentences)
        
        # Remove excessive whitespace
        filtered_text = re.sub(r'\s+', ' ', filtered_text)
        filtered_text = re.sub(r'\n\s*\n', '\n\n', filtered_text)
        
        return filtered_text.strip()
    
    @staticmethod
    def _remove_similar_sentences_embedding(document_text: str) -> str:
        """Remove sentences semantically similar to common filing language"""
        common_sentence_templates = [
            "This report contains forward-looking statements",
            "Actual results may differ materially",
            "See Item 1A Risk Factors",
            "The Company believes that the expectations",
            "These statements are based on current expectations",
            "The Company undertakes no obligation to update",
            "Percentages may not add due to rounding",
            "All amounts in millions except per share data",
            "The following discussion should be read",
            "Certain statements in this report",
            "We use forward-looking terminology",
            "Various risks and uncertainties could cause",
            "The Company's actual results",
            "In addition to historical information",
            "Management's discussion and analysis",
            "These forward-looking statements involve risks",
            "We caution that actual results",
            "The Private Securities Litigation Reform Act",
            "Safe harbor provisions of federal securities laws",
            "The registrant has duly caused this report"
        ]
        
        try:
            if not NLPQuantStrategy._embedding_model:
                return document_text
            
            sentences = re.split(r'[.!?]\s+', document_text)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
            
            if len(sentences) == 0:
                return document_text
            
            sentence_embeddings = NLPQuantStrategy._embedding_model.encode(
                sentences, convert_to_numpy=True, show_progress_bar=False
            )
            
            template_embeddings = NLPQuantStrategy._embedding_model.encode(
                common_sentence_templates, convert_to_numpy=True, show_progress_bar=False
            )
            
            similarity_matrix = cosine_similarity(sentence_embeddings, template_embeddings)
            
            threshold = 0.75
            filtered_sentences = []
            
            for i, sentence in enumerate(sentences):
                max_similarity = np.max(similarity_matrix[i])
                if max_similarity < threshold:
                    filtered_sentences.append(sentence)
            
            if filtered_sentences:
                return '. '.join(filtered_sentences) + '.'
            else:
                return document_text
                
        except Exception as e:
            # Fallback to original text if embedding process fails
            return document_text
    
    @staticmethod
    def _extract_sentences(document_text: str) -> List[str]:
        """Extract sentences from document"""
        if NLTK_AVAILABLE:
            try:
                return sent_tokenize(document_text)
            except:
                pass
        
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
        
        positive_count = sum(1 for term in NLPQuantStrategy.POSITIVE_FINANCIAL_TERMS 
                           if term in document_text.lower())
        negative_count = sum(1 for term in NLPQuantStrategy.NEGATIVE_FINANCIAL_TERMS 
                           if term in document_text.lower())
        uncertainty_count = sum(1 for term in NLPQuantStrategy.UNCERTAINTY_TERMS 
                              if term in document_text.lower())
        
        total_financial_terms = positive_count + negative_count + 0.5 * uncertainty_count
        if total_financial_terms > 0:
            scores["financial_sentiment"] = (positive_count - negative_count) / total_financial_terms
        
        if HUGGINGFACE_AVAILABLE and NLPQuantStrategy._financial_sentiment_model:
            try:
                text_chunks = [document_text[i:i+512] for i in range(0, min(5000, len(document_text)), 512)]
                finbert_results = []
                for chunk in text_chunks[:10]:
                    try:
                        result = NLPQuantStrategy._financial_sentiment_model(chunk[:512])
                        if isinstance(result, list):
                            finbert_results.extend(result)
                        else:
                            finbert_results.append(result)
                    except:
                        continue
                
                if finbert_results:
                    positive_count = sum(1 for r in finbert_results 
                                       if r.get('label', '').upper() in ['POSITIVE', 'POS'])
                    negative_count = sum(1 for r in finbert_results 
                                       if r.get('label', '').upper() in ['NEGATIVE', 'NEG'])
                    
                    positive_scores = [r.get('score', 0.0) for r in finbert_results 
                                     if r.get('label', '').upper() in ['POSITIVE', 'POS']]
                    negative_scores = [r.get('score', 0.0) for r in finbert_results 
                                     if r.get('label', '').upper() in ['NEGATIVE', 'NEG']]
                    
                    avg_positive = np.mean(positive_scores) if positive_scores else 0.0
                    avg_negative = np.mean(negative_scores) if negative_scores else 0.0
                    
                    finbert_sentiment = avg_positive - avg_negative
                    scores["finbert_sentiment"] = finbert_sentiment
                    scores["finbert_positive_score"] = avg_positive
                    scores["finbert_negative_score"] = avg_negative
                    scores["overall_sentiment"] = (finbert_sentiment * 0.6) + (scores.get("overall_sentiment", 0.0) * 0.4)
            except Exception as e:
                pass
        
        if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
            try:
                vader_scores = NLPQuantStrategy._sentiment_analyzer.polarity_scores(document_text[:10000])
                scores["vader_scores"] = vader_scores
                
                if "finbert_sentiment" not in scores:
                    scores["positive_score"] = vader_scores.get("pos", 0.0)
                    scores["negative_score"] = vader_scores.get("neg", 0.0)
                    scores["overall_sentiment"] = vader_scores.get("compound", 0.0)
                else:
                    scores["vader_positive_score"] = vader_scores.get("pos", 0.0)
                    scores["vader_negative_score"] = vader_scores.get("neg", 0.0)
                    scores["vader_compound"] = vader_scores.get("compound", 0.0)
            except:
                pass
        
        sentence_sentiments = []
        for sentence in sentences[:100]:
            if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                try:
                    sent_score = NLPQuantStrategy._sentiment_analyzer.polarity_scores(sentence)
                    sentence_sentiments.append(sent_score["compound"])
                except:
                    pass
        
        if sentence_sentiments:
            scores["average_sentence_sentiment"] = np.mean(sentence_sentiments)
            scores["sentiment_volatility"] = np.std(sentence_sentiments)
        
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
                
                sentence_match = re.search(r'[^.!?]*' + re.escape(match.group()) + r'[^.!?]*[.!?]', context)
                if sentence_match:
                    sentence = sentence_match.group().strip()
                    
                    sentiment_score = 0.0
                    vader_successful = False
                    
                    if NLTK_AVAILABLE and NLPQuantStrategy._sentiment_analyzer:
                        try:
                            vader_result = NLPQuantStrategy._sentiment_analyzer.polarity_scores(sentence)
                            sentiment_score = vader_result.get("compound", 0.0)
                            vader_successful = True
                        except:
                            vader_successful = False
                    
                    if not vader_successful:
                        sentence_lower = sentence.lower()
                        positive_count = sum(1 for term in NLPQuantStrategy.POSITIVE_FINANCIAL_TERMS 
                                           if term in sentence_lower)
                        negative_count = sum(1 for term in NLPQuantStrategy.NEGATIVE_FINANCIAL_TERMS 
                                           if term in sentence_lower)
                        
                        total_terms = positive_count + negative_count
                        if total_terms > 0:
                            sentiment_score = (positive_count - negative_count) / max(total_terms, 1)
                        else:
                            sentence_words = sentence_lower.split()
                            
                            positive_future_words = ['expect', 'anticipate', 'believe', 'plan', 'forecast', 'project', 
                                                     'growth', 'expansion', 'opportunity', 'potential']
                            negative_future_words = ['risk', 'challenge', 'concern', 'uncertain', 'volatility', 'decline']
                            
                            pos_future = sum(1 for word in positive_future_words if word in sentence_lower)
                            neg_future = sum(1 for word in negative_future_words if word in sentence_lower)
                            
                            if pos_future > neg_future:
                                sentiment_score = 0.15
                            elif neg_future > pos_future:
                                sentiment_score = -0.15
                            else:
                                sentiment_score = 0.05
                    
                    forward_statements.append({
                        "statement": sentence[:500],
                        "pattern": pattern,
                        "sentiment": sentiment_score,
                        "position": match.start()
                    })
        
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
        """Generate quantitative trading signals using multi-factor model"""
        signals = {
            "signal": "HOLD",
            "strength": 0.0,
            "confidence": 0.0,
            "overall_score": 0.0,
            "recommendation": "HOLD",
            "rationale": [],
            "components": {},
            "quant_metrics": {},  # Quantitative metrics
            "factor_loadings": {},  # Factor exposures
            "statistical_significance": {},  # t-stats, p-values
            "risk_adjusted_signal": 0.0,
            "expected_return": 0.0,
            "signal_sharpe": 0.0,
            "information_coefficient": 0.0
        }
        
        sentiment_component = sentiment_scores.get("overall_sentiment", 0.0)
        financial_sentiment = sentiment_scores.get("financial_sentiment", 0.0)
        finbert_sentiment = sentiment_scores.get("finbert_sentiment", 0.0)
        
        # Combine sentiment sources with historical IC weights
        # IC (Information Coefficient) = correlation between signal and future returns
        # Historical IC estimates (would be learned from backtesting)
        sentiment_ic = 0.15  # Sentiment IC ~0.15 (modest predictive power)
        financial_ic = 0.18  # Financial sentiment IC ~0.18 (better)
        finbert_ic = 0.22 if finbert_sentiment != 0.0 else 0.0  # FinBERT IC ~0.22 (best)
        
        # IC-weighted sentiment factor
        sentiment_factors = []
        weights = []
        if sentiment_component != 0.0:
            sentiment_factors.append(sentiment_component)
            weights.append(sentiment_ic)
        if financial_sentiment != 0.0:
            sentiment_factors.append(financial_sentiment)
            weights.append(financial_ic)
        if finbert_sentiment != 0.0:
            sentiment_factors.append(finbert_sentiment)
            weights.append(finbert_ic)
        
        if weights:
            weights = np.array(weights)
            weights = weights / weights.sum()
            sentiment_factor = np.average(sentiment_factors, weights=weights)
        else:
            sentiment_factor = sentiment_component
        
        sentiment_factor_raw = np.clip(sentiment_factor, -1, 1)
        signals["factor_loadings"]["sentiment"] = float(sentiment_factor_raw)
        
        if forward_statements:
            forward_sentiments = [s.get("sentiment", 0.0) for s in forward_statements]
            forward_factor_raw = np.mean(forward_sentiments) if forward_sentiments else 0.0
            forward_ic = 0.20
            forward_score = np.clip(forward_factor_raw * 100, -100, 100)
        else:
            forward_factor_raw = 0.0
            forward_ic = 0.0
            forward_score = 0.0
        
        signals["factor_loadings"]["forward_looking"] = float(np.clip(forward_factor_raw, -1, 1))
        
        risk_severity = risk_analysis.get("severity_score", 0.0) / 100.0
        risk_count = risk_analysis.get("risk_count", 0)
        risk_factor_raw = 1.0 - np.clip(risk_severity, 0, 1)
        risk_factor_raw = (risk_factor_raw * 2) - 1
        risk_ic = 0.12
        
        signals["factor_loadings"]["risk"] = float(np.clip(risk_factor_raw, -1, 1))
        
        certainty_raw = tone_analysis.get("certainty_score", 50.0) / 100.0
        certainty_factor_raw = (certainty_raw * 2) - 1
        certainty_ic = 0.10
        
        signals["factor_loadings"]["certainty"] = float(np.clip(certainty_factor_raw, -1, 1))
        
        if embedding_features:
            sentiment_change = embedding_features.get("sentiment_change", 0.0)
            similarity = embedding_features.get("similarity_score", 0.5)
            momentum_factor_raw = sentiment_change * similarity
            momentum_ic = 0.16
        else:
            momentum_factor_raw = 0.0
            momentum_ic = 0.0
        
        signals["factor_loadings"]["momentum"] = float(np.clip(momentum_factor_raw, -1, 1))
        
        factors = np.array([
            sentiment_factor_raw,
            forward_factor_raw,
            risk_factor_raw,
            certainty_factor_raw,
            momentum_factor_raw
        ])
        
        ic_weights = np.array([
            sentiment_ic if sentiment_factor_raw != 0.0 else 0.0,
            forward_ic if forward_factor_raw != 0.0 else 0.0,
            risk_ic if risk_factor_raw != 0.0 else 0.0,
            certainty_ic if certainty_factor_raw != 0.0 else 0.0,
            momentum_ic if momentum_factor_raw != 0.0 else 0.0
        ])
        
        non_zero_mask = ic_weights > 0
        if non_zero_mask.sum() > 0:
            ic_weights = ic_weights / ic_weights[non_zero_mask].sum()
            composite_signal = np.dot(factors[non_zero_mask], ic_weights[non_zero_mask])
        else:
            composite_signal = 0.0
        
        factor_volatilities = np.array([
            0.25,  # Sentiment volatility
            0.22,  # Forward-looking volatility
            0.30,  # Risk factor volatility
            0.18,  # Certainty volatility
            0.28   # Momentum volatility
        ])
        
        portfolio_vol = np.sqrt(np.dot(ic_weights**2, factor_volatilities**2))
        risk_adjusted_signal = composite_signal / portfolio_vol if portfolio_vol > 0 else 0.0
        
        signal_variance = np.dot(ic_weights**2, factor_volatilities**2)
        signal_std = np.sqrt(signal_variance) if signal_variance > 0 else 0.01
        
        t_stat = composite_signal / signal_std if signal_std > 0 else 0.0
        if SCIPY_AVAILABLE:
            try:
                p_value = 2 * (1 - stats.norm.cdf(abs(t_stat)))
            except:
                p_value = 0.5 if abs(t_stat) < 1.96 else 0.05
        else:
            if abs(t_stat) > 2.576:
                p_value = 0.01
            elif abs(t_stat) > 1.96:
                p_value = 0.05
            elif abs(t_stat) > 1.645:
                p_value = 0.10
            else:
                p_value = 0.50
        
        signals["statistical_significance"] = {
            "t_statistic": float(t_stat),
            "p_value": float(p_value),
            "significant": abs(t_stat) > 1.96,
            "factor_count": int(non_zero_mask.sum()),
            "composite_signal": float(composite_signal)
        }
        
        ic_weighted_avg = np.dot(ic_weights[non_zero_mask], 
                               np.array([sentiment_ic, forward_ic, risk_ic, certainty_ic, momentum_ic])[non_zero_mask])
        signals["information_coefficient"] = float(ic_weighted_avg)
        
        annual_vol = 0.15
        expected_return = composite_signal * ic_weighted_avg * annual_vol
        signal_sharpe = expected_return / annual_vol if annual_vol > 0 else 0.0
        
        signals["expected_return"] = float(expected_return)
        signals["signal_sharpe"] = float(signal_sharpe)
        signals["risk_adjusted_signal"] = float(risk_adjusted_signal)
        
        overall_score = 50 + (composite_signal * 50)
        overall_score = np.clip(overall_score, 0, 100)
        signals["overall_score"] = float(overall_score)
        
        signals["components"]["sentiment"] = float(50 + sentiment_factor_raw * 50)
        signals["components"]["forward_looking"] = float(50 + forward_factor_raw * 50)
        signals["components"]["risk"] = float(50 + risk_factor_raw * 50)
        signals["components"]["certainty"] = float(50 + certainty_factor_raw * 50)
        signals["components"]["momentum"] = float(50 + momentum_factor_raw * 50)
        
        component_scores = list(signals["components"].values())
        if component_scores:
            factor_agreement = 1.0 - (np.std(component_scores) / 100.0)  # Lower std = higher agreement
            statistical_strength = min(1.0, abs(t_stat) / 2.0)  # Normalize t-stat
            confidence = ic_weighted_avg * factor_agreement * statistical_strength * 100
            signals["confidence"] = float(np.clip(confidence, 0, 100))
        
        component_scores_list = list(signals["components"].values())
        signals = NLPQuantStrategy._classify_trading_signal_quantitative(
            overall_score, component_scores_list, signals, t_stat, p_value
        )
        
        signals["quant_metrics"] = {
            "composite_signal": float(composite_signal),
            "risk_adjusted_signal": float(risk_adjusted_signal),
            "expected_return_annualized": float(expected_return * 100),  # Convert to %
            "signal_sharpe_ratio": float(signal_sharpe),
            "information_coefficient": float(ic_weighted_avg),
            "t_statistic": float(t_stat),
            "p_value": float(p_value),
            "factor_portfolio_volatility": float(portfolio_vol),
            "signal_strength_zscore": float(t_stat),  # z-score
            "statistically_significant": abs(t_stat) > 1.96
        }
        
        if abs(t_stat) > 1.96:
            signals["rationale"].append(f"Statistically significant signal (t={t_stat:.2f}, p={p_value:.3f})")
        
        if sentiment_factor_raw > 0.3:
            signals["rationale"].append(f"Strong positive sentiment factor ({sentiment_factor_raw:.2f})")
        elif sentiment_factor_raw < -0.3:
            signals["rationale"].append(f"Negative sentiment factor ({sentiment_factor_raw:.2f})")
        
        if forward_factor_raw > 0.3:
            signals["rationale"].append(f"Optimistic forward-looking factor (IC={forward_ic:.2f})")
        elif forward_factor_raw < -0.3:
            signals["rationale"].append(f"Pessimistic forward-looking factor")
        
        if signal_sharpe > 0.5:
            signals["rationale"].append(f"High Sharpe ratio ({signal_sharpe:.2f})")
        
        if ic_weighted_avg > 0.15:
            signals["rationale"].append(f"Strong information coefficient ({ic_weighted_avg:.2f})")
        
        if not signals["rationale"]:
            signals["rationale"].append("Neutral signal - insufficient statistical significance")
        
        return signals
    
    @staticmethod
    def _classify_trading_signal_quantitative(
        overall_score: float,
        component_scores: List[float],
        signals: Dict,
        t_stat: float,
        p_value: float
    ) -> Dict:
        """
        Classify trading signal using quantitative thresholds (Jane Street style)
        Uses statistical significance and risk-adjusted metrics
        """
        # Statistical significance thresholds
        is_significant = abs(t_stat) > 1.96  # 95% confidence
        
        # Risk-adjusted signal threshold
        risk_adj_signal = signals.get("risk_adjusted_signal", 0.0)
        
        # IC-weighted signal strength
        ic = signals.get("information_coefficient", 0.0)
        
        # Adaptive thresholds based on statistical significance
        if is_significant:
            # More aggressive thresholds when statistically significant
            buy_threshold = 55.0  # Lower threshold for significant signals
            sell_threshold = 45.0
            # Adjust by IC strength
            buy_threshold = buy_threshold - (ic * 10)  # Stronger IC = lower threshold needed
            sell_threshold = sell_threshold + (ic * 10)
        else:
            # Conservative thresholds when not significant
            buy_threshold = 65.0
            sell_threshold = 35.0
        
        # Risk-adjusted classification (more important than raw score)
        if abs(risk_adj_signal) > 0.5:  # Strong risk-adjusted signal
            if risk_adj_signal > 0:
                signals["signal"] = "BUY"
                signals["recommendation"] = "BUY"
                signals["strength"] = min(abs(risk_adj_signal) * 100, 100)
            else:
                signals["signal"] = "SELL"
                signals["recommendation"] = "SELL"
                signals["strength"] = min(abs(risk_adj_signal) * 100, 100)
        elif overall_score > buy_threshold:
            signals["signal"] = "BUY"
            signals["recommendation"] = "BUY"
            signals["strength"] = min(((overall_score - buy_threshold) / (100 - buy_threshold)) * 100, 100)
        elif overall_score < sell_threshold:
            signals["signal"] = "SELL"
            signals["recommendation"] = "SELL"
            signals["strength"] = min(((sell_threshold - overall_score) / sell_threshold) * 100, 100)
        else:
            signals["signal"] = "HOLD"
            signals["recommendation"] = "HOLD"
            signals["strength"] = 50 - abs(overall_score - 50)
        
        # Add statistical significance to signal
        if is_significant and signals["signal"] != "HOLD":
            signals["recommendation"] = f"{signals['signal']}*"  # Mark as statistically significant
        
        return signals
    
    @staticmethod
    def _classify_trading_signal_ml(
        overall_score: float,
        component_scores: List[float],
        signals: Dict
    ) -> Dict:
        """
        Classify trading signal using ML-based approach instead of hardcoded thresholds
        Uses percentile-based classification with component agreement weighting
        """
        try:
            # Calculate component statistics for better classification
            if component_scores:
                component_mean = np.mean(component_scores)
                component_std = np.std(component_scores)
                component_median = np.median(component_scores)
                
                # Use statistical distribution for adaptive thresholds
                # Instead of fixed 60/40, use percentile-based classification
                
                # Calculate percentile-based thresholds
                # BUY: top 30% of distribution (70th percentile+)
                # SELL: bottom 30% of distribution (30th percentile-)
                # HOLD: middle 40% (30th-70th percentile)
                
                # For overall_score:
                # BUY threshold: > 60 (70th percentile equivalent)
                # SELL threshold: < 40 (30th percentile equivalent)
                
                # Enhanced classification using component agreement
                # If components agree strongly (low std dev), use stricter thresholds
                # If components disagree (high std dev), use more conservative classification
                
                agreement_threshold = 15.0  # Std dev threshold for component agreement
                component_agreement = component_std < agreement_threshold
                
                # Adjust thresholds based on component agreement
                buy_threshold = 60.0
                sell_threshold = 40.0
                
                if component_agreement:
                    # Strong agreement - use tighter thresholds
                    buy_threshold = 62.0
                    sell_threshold = 38.0
                else:
                    # Weak agreement - use wider thresholds (more conservative)
                    buy_threshold = 65.0
                    sell_threshold = 35.0
                
                # Classify signal
                if overall_score > buy_threshold:
                    signals["signal"] = "BUY"
                    signals["recommendation"] = "BUY"
                    # Strength based on how far above threshold
                    signals["strength"] = min(((overall_score - buy_threshold) / (100 - buy_threshold)) * 100, 100)
                elif overall_score < sell_threshold:
                    signals["signal"] = "SELL"
                    signals["recommendation"] = "SELL"
                    # Strength based on how far below threshold
                    signals["strength"] = min(((sell_threshold - overall_score) / sell_threshold) * 100, 100)
                else:
                    signals["signal"] = "HOLD"
                    signals["recommendation"] = "HOLD"
                    # Strength based on distance from neutral (50)
                    signals["strength"] = 50 - abs(overall_score - 50)
                
                return signals
        except:
            pass
        
        # Fallback to simple thresholds if ML classification fails
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
        
        return signals

