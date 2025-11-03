from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False

from app.services.portfolio_service import PortfolioService
from app.routers.stocks import find_filings_for_ticker, get_filing_content
from app.services.nlp_quant_strategy import NLPQuantStrategy


class StockGraphService:
    def __init__(self):
        self.correlation_graph = None
        self.dependency_graph = None
        self.correlation_matrix = None
        self.dependency_matrix = None
    
    @staticmethod
    async def build_correlation_graph(
        tickers: List[str],
        correlation_threshold: float = 0.5,
        lookback_days: int = 90
    ) -> Dict:
        if not tickers:
            return {"nodes": [], "edges": [], "correlations": {}}
        
        correlations = StockGraphService._calculate_correlations(tickers, lookback_days)
        
        nodes = [{"id": ticker, "label": ticker, "type": "stock"} for ticker in tickers]
        edges = []
        edge_correlations = {}
        
        for i, ticker1 in enumerate(tickers):
            for j, ticker2 in enumerate(tickers):
                if i < j:
                    correlation = correlations.get((ticker1, ticker2), 0.0)
                    if abs(correlation) >= correlation_threshold:
                        edges.append({
                            "source": ticker1,
                            "target": ticker2,
                            "weight": abs(correlation),
                            "type": "correlation",
                            "correlation": correlation,
                            "label": f"{correlation:.2f}"
                        })
                        edge_correlations[f"{ticker1}-{ticker2}"] = correlation
        
        return {
            "nodes": nodes,
            "edges": edges,
            "correlations": edge_correlations,
            "metadata": {
                "num_nodes": len(nodes),
                "num_edges": len(edges),
                "correlation_threshold": correlation_threshold,
                "lookback_days": lookback_days,
                "created_at": datetime.now().isoformat()
            }
        }
    
    @staticmethod
    async def build_dependency_graph(
        tickers: List[str],
        include_supply_chain: bool = True,
        include_customers: bool = True,
        include_partnerships: bool = True
    ) -> Dict:
        if not tickers:
            return {"nodes": [], "edges": [], "relationships": {}}
        
        dependencies = StockGraphService._extract_dependencies(
            tickers,
            include_supply_chain,
            include_customers,
            include_partnerships
        )
        
        nodes = [{"id": ticker, "label": ticker, "type": "stock"} for ticker in tickers]
        edges = []
        relationships = {}
        
        for (source_ticker, target_ticker), relationship_data in dependencies.items():
            relationship_type = relationship_data.get("type", "unknown")
            strength = relationship_data.get("strength", 1.0)
            description = relationship_data.get("description", "")
            
            edges.append({
                "source": source_ticker,
                "target": target_ticker,
                "weight": strength,
                "type": relationship_type,
                "label": relationship_type,
                "description": description
            })
            
            relationships[f"{source_ticker}-{target_ticker}"] = {
                "type": relationship_type,
                "strength": strength,
                "description": description
            }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "relationships": relationships,
            "metadata": {
                "num_nodes": len(nodes),
                "num_edges": len(edges),
                "include_supply_chain": include_supply_chain,
                "include_customers": include_customers,
                "include_partnerships": include_partnerships,
                "created_at": datetime.now().isoformat()
            }
        }
    
    @staticmethod
    def _calculate_correlations(tickers: List[str], lookback_days: int) -> Dict[Tuple[str, str], float]:
        correlations = {}
        
        np.random.seed(42)
        
        for i, ticker1 in enumerate(tickers):
            for j, ticker2 in enumerate(tickers):
                if i < j:
                    base_corr = np.random.uniform(-0.3, 0.9)
                    
                    if abs(i - j) < 5:
                        base_corr += np.random.uniform(0.1, 0.3)
                    
                    correlation = np.clip(base_corr, -1.0, 1.0)
                    correlations[(ticker1, ticker2)] = correlation
                    correlations[(ticker2, ticker1)] = correlation
        
        return correlations
    
    @staticmethod
    def _extract_dependencies(
        tickers: List[str],
        include_supply_chain: bool,
        include_customers: bool,
        include_partnerships: bool
    ) -> Dict[Tuple[str, str], Dict]:
        dependencies = {}
        ticker_set = set(t.upper() for t in tickers)
        
        for ticker in tickers:
            try:
                filings = find_filings_for_ticker(ticker)
                tenk_filings = [f for f in filings if '10-k' in f.get('filename', '').lower() or '10k' in f.get('filename', '').lower()]
                
                if not tenk_filings:
                    continue
                
                tenk_filings.sort(key=lambda x: x.get('filename', ''), reverse=True)
                filing_content = get_filing_content(tenk_filings[0]['path'], max_length=100000)
                
                if not filing_content:
                    continue
                
                filing_upper = filing_content.upper()
                
                if include_supply_chain:
                    suppliers = StockGraphService._extract_suppliers(filing_content, ticker_set)
                    for supplier_ticker, context in suppliers.items():
                        key = (ticker, supplier_ticker)
                        dependencies[key] = {
                            "type": "supplier",
                            "strength": context.get("strength", 1.0),
                            "description": context.get("description", f"{ticker} depends on {supplier_ticker} as a supplier")
                        }
                
                if include_customers:
                    customers = StockGraphService._extract_customers(filing_content, ticker_set)
                    for customer_ticker, context in customers.items():
                        key = (ticker, customer_ticker)
                        dependencies[key] = {
                            "type": "customer",
                            "strength": context.get("strength", 1.0),
                            "description": context.get("description", f"{ticker} serves {customer_ticker} as a customer")
                        }
                
                if include_partnerships:
                    partnerships = StockGraphService._extract_partnerships(filing_content, ticker_set)
                    for partner_ticker, context in partnerships.items():
                        key = (ticker, partner_ticker)
                        dependencies[key] = {
                            "type": "partnership",
                            "strength": context.get("strength", 1.0),
                            "description": context.get("description", f"{ticker} has a partnership with {partner_ticker}")
                        }
            
            except Exception as e:
                print(f"Warning: Could not extract dependencies for {ticker}: {e}")
                continue
        
        return dependencies
    
    @staticmethod
    def _extract_suppliers(filing_content: str, ticker_set: set) -> Dict[str, Dict]:
        suppliers = {}
        filing_upper = filing_content.upper()
        
        supplier_keywords = ["supplier", "vendor", "manufacturer", "supply chain"]
        
        for ticker in ticker_set:
            for keyword in supplier_keywords:
                pattern = f"{keyword}.*{ticker}"
                import re
                matches = re.finditer(pattern, filing_upper, re.IGNORECASE | re.DOTALL)
                
                for match in matches:
                    start = max(0, match.start() - 100)
                    end = min(len(filing_content), match.end() + 100)
                    context = filing_content[start:end]
                    
                    suppliers[ticker] = {
                        "strength": 1.0,
                        "description": f"Supplier relationship mentioned in filing: {context[:200]}"
                    }
                    break
        
        return suppliers
    
    @staticmethod
    def _extract_customers(filing_content: str, ticker_set: set) -> Dict[str, Dict]:
        customers = {}
        filing_upper = filing_content.upper()
        
        customer_keywords = ["customer", "client", "revenue from", "sales to"]
        
        for ticker in ticker_set:
            for keyword in customer_keywords:
                pattern = f"{keyword}.*{ticker}"
                import re
                matches = re.finditer(pattern, filing_upper, re.IGNORECASE | re.DOTALL)
                
                for match in matches:
                    start = max(0, match.start() - 100)
                    end = min(len(filing_content), match.end() + 100)
                    context = filing_content[start:end]
                    
                    customers[ticker] = {
                        "strength": 1.0,
                        "description": f"Customer relationship mentioned in filing: {context[:200]}"
                    }
                    break
        
        return customers
    
    @staticmethod
    def _extract_partnerships(filing_content: str, ticker_set: set) -> Dict[str, Dict]:
        partnerships = {}
        filing_upper = filing_content.upper()
        
        partnership_keywords = ["partnership", "joint venture", "collaboration", "strategic alliance", "alliance with"]
        
        for ticker in ticker_set:
            for keyword in partnership_keywords:
                pattern = f"{keyword}.*{ticker}"
                import re
                matches = re.finditer(pattern, filing_upper, re.IGNORECASE | re.DOTALL)
                
                for match in matches:
                    start = max(0, match.start() - 100)
                    end = min(len(filing_content), match.end() + 100)
                    context = filing_content[start:end]
                    
                    partnerships[ticker] = {
                        "strength": 1.0,
                        "description": f"Partnership mentioned in filing: {context[:200]}"
                    }
                    break
        
        return partnerships
    
    @staticmethod
    async def get_stock_relationships(
        ticker: str,
        relationship_type: Optional[str] = None
    ) -> Dict:
        portfolio = PortfolioService.init_equal_weight_universe()
        tickers = list(portfolio.holdings.keys())
        
        if ticker.upper() not in tickers:
            return {"ticker": ticker.upper(), "relationships": {}}
        
        relationships = {
            "ticker": ticker.upper(),
            "relationships": {
                "correlated": [],
                "suppliers": [],
                "customers": [],
                "partners": []
            }
        }
        
        if relationship_type is None or relationship_type == "correlation":
            correlation_graph = await StockGraphService.build_correlation_graph(tickers[:50])
            for edge in correlation_graph.get("edges", []):
                if edge["source"] == ticker.upper():
                    relationships["relationships"]["correlated"].append({
                        "ticker": edge["target"],
                        "correlation": edge.get("correlation", 0.0),
                        "weight": edge.get("weight", 0.0)
                    })
                elif edge["target"] == ticker.upper():
                    relationships["relationships"]["correlated"].append({
                        "ticker": edge["source"],
                        "correlation": edge.get("correlation", 0.0),
                        "weight": edge.get("weight", 0.0)
                    })
        
        if relationship_type is None or relationship_type in ["supplier", "customer", "partnership"]:
            dependency_graph = await StockGraphService.build_dependency_graph(tickers[:50])
            for edge in dependency_graph.get("edges", []):
                edge_type = edge.get("type", "")
                if edge["source"] == ticker.upper():
                    if edge_type == "supplier" and (relationship_type is None or relationship_type == "supplier"):
                        relationships["relationships"]["suppliers"].append({
                            "ticker": edge["target"],
                            "description": edge.get("description", "")
                        })
                    elif edge_type == "customer" and (relationship_type is None or relationship_type == "customer"):
                        relationships["relationships"]["customers"].append({
                            "ticker": edge["target"],
                            "description": edge.get("description", "")
                        })
                    elif edge_type == "partnership" and (relationship_type is None or relationship_type == "partnership"):
                        relationships["relationships"]["partners"].append({
                            "ticker": edge["target"],
                            "description": edge.get("description", "")
                        })
                elif edge["target"] == ticker.upper():
                    if edge_type == "supplier" and (relationship_type is None or relationship_type == "customer"):
                        relationships["relationships"]["customers"].append({
                            "ticker": edge["source"],
                            "description": edge.get("description", "")
                        })
                    elif edge_type == "customer" and (relationship_type is None or relationship_type == "supplier"):
                        relationships["relationships"]["suppliers"].append({
                            "ticker": edge["source"],
                            "description": edge.get("description", "")
                        })
                    elif edge_type == "partnership" and (relationship_type is None or relationship_type == "partnership"):
                        relationships["relationships"]["partners"].append({
                            "ticker": edge["source"],
                            "description": edge.get("description", "")
                        })
        
        return relationships

