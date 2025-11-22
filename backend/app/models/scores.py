from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any


class MatchItem(BaseModel):
    """A single match analysis item."""
    text: str
    type: Literal["fit", "mismatch", "question"]


class FoundationScore(BaseModel):
    """Foundation with match score and analysis."""
    id: str
    name: str
    logo: str
    purpose: str
    description: str
    funding_amount: str
    match_score: float  # 0.0 to 1.0
    matches: List[MatchItem]
    
    # Full foundation details (same as Foundation model)
    long_description: str
    legal_form: str
    gemeinnuetzige_zwecke: List[str]
    antragsprozess: Dict[str, Any]
    foerderbereich: Dict[str, Any]
    foerderhoehe: Dict[str, Any]
    contact: Dict[str, Any]
    past_projects: List[Dict[str, Any]]
    website: str


class FoundationScoresResponse(BaseModel):
    """Response containing scored foundations."""
    success: bool
    count: int
    foundations: List[FoundationScore]
    query_summary: str

