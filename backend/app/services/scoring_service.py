"""
Service for scoring and matching foundations to user projects using AI.
"""

import locale
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import SecretStr

from app.models.scores import (
    MatchItem,
    FoundationScore,
    FoundationEvaluation,
    ScoringResponse,
)
from app.models.project_description import ProjectDescription
from app.core.config import settings
from app.core.database import get_database

locale.setlocale(locale.LC_ALL, "de_DE.UTF-8")


class ScoringService:
    """Service for AI-powered foundation scoring and matching."""

    def __init__(self):
        """Initialize the Requesty AI model with structured output."""
        if not settings.REQUESTY_API_KEY:
            print("❌ WARNING: REQUESTY_API_KEY is not set!")
        else:
            print(
                f"✅ REQUESTY_API_KEY is configured (length: {len(settings.REQUESTY_API_KEY)})"
            )

        try:
            self.llm = ChatOpenAI(
                model="anthropic/claude-haiku-4-5",
                api_key=SecretStr(settings.REQUESTY_API_KEY),
                base_url=settings.REQUESTY_BASE_URL,
                temperature=0.3,  # Lower temperature for more consistent scoring
            )
            print(f"✅ Requesty AI model initialized: anthropic/claude-haiku-4-5")
        except Exception as e:
            print(f"❌ Failed to initialize Requesty AI: {e}")
            raise

        # Set up structured output using modern LangChain pattern
        self.structured_llm = self.llm.with_structured_output(ScoringResponse)

    async def score_foundations(
        self,
        project: ProjectDescription,
        limit: int = 5,
        db: AsyncIOMotorDatabase = None,
    ) -> List[FoundationScore]:
        """
        Score and rank foundations based on project description using AI.

        Args:
            project: The project description to match against
            limit: Maximum number of foundations to return (default: 5)
            db: Optional database instance (will use get_database() if not provided)

        Returns:
            List of FoundationScore objects, sorted by match score (highest first)
        """
        print("🚀 Starting foundation scoring process in STRICT mode (fallbacks disabled)...")
        if db is None:
            db = get_database()

        # Step 1: Filter by charitable purpose (exact match)
        # Project can have multiple charitable purposes - match if ANY of them match
        charitable_purpose_strings = [
            purpose.value for purpose in project.charitable_purpose
        ]
        matching_foundations = await self._filter_by_charitable_purpose(
            db, charitable_purpose_strings
        )

        if not matching_foundations:
            print(
                f"⚠️ No foundations found matching charitable purposes: {charitable_purpose_strings}"
            )
            return []

        print(
            f"✅ Found {len(matching_foundations)} foundations matching charitable purposes: {charitable_purpose_strings}"
        )

        # Step 2: Text search on long_description + past_projects
        search_text = f"{project.name} {project.description} {project.target_group}"
        scored_candidates = await self._text_search_foundations(
            db,
            matching_foundations,
            search_text,
            limit * 2,  # Get more candidates for LLM evaluation
        )

        if not scored_candidates:
            print("⚠️ No foundations found after text search")
            return []

        # Limit to top candidates for LLM evaluation
        candidate_foundations = scored_candidates[
            : min(limit * 2, len(scored_candidates))
        ]
        print(
            f"✅ Selected {len(candidate_foundations)} candidate foundations for LLM evaluation"
        )

        # Step 3: Use LLM to score and analyze foundations
        print("INFO: Step 3: Evaluating with LLM...")
        try:
            scored_foundations = await self._evaluate_with_llm(
                project, candidate_foundations
            )

            # Sort by match score and limit
            scored_foundations.sort(key=lambda x: x.match_score, reverse=True)
            print(f"✅ LLM evaluation successful, returning {len(scored_foundations)} sorted foundations.")
            return scored_foundations[:limit]

        except Exception as e:
            print(f"❌ FATAL: Error in LLM evaluation: {e}")
            import traceback
            traceback.print_exc()
            # Re-raise the exception to avoid fallback
            raise


    async def _filter_by_charitable_purpose(
        self, db: AsyncIOMotorDatabase, charitable_purposes: List[str]
    ) -> List[str]:
        """
        Filter foundations by exact match on charitable purpose(s).

        Matches foundations where ANY of the provided charitable purposes
        appears in the foundation's gemeinnuetzige_zwecke list.

        Args:
            charitable_purposes: List of charitable purpose strings to match

        Returns:
            List of foundation IDs that match at least one purpose
        """
        print(f"INFO: Filtering foundations by charitable purposes: {charitable_purposes}...")
        try:
            # Find foundations where ANY of the charitable purposes appears in gemeinnuetzige_zwecke
            cursor = db.foundations.find(
                {"gemeinnuetzige_zwecke": {"$in": charitable_purposes}}
            )

            foundations = await cursor.to_list(length=None)
            print(f"DEBUG: Found {len(foundations)} raw documents from database.")

            foundation_ids = []
            for foundation in foundations:
                if foundation is None:
                    print("DEBUG: Skipping a None foundation document.")
                    continue

                if foundation.get("_id") is not None:
                    foundation_ids.append(foundation["_id"])
                    continue

                if foundation.get("id"):
                    print(f"DEBUG: Found foundation with 'id' instead of '_id': {foundation.get('id')}")
                    foundation_ids.append(foundation["id"])
            
            print(f"✅ Successfully filtered and found {len(foundation_ids)} foundation IDs.")
            return foundation_ids
        except Exception as e:
            print(f"❌ FATAL: Error filtering by charitable purpose: {e}")
            raise


    async def _text_search_foundations(
        self,
        db: AsyncIOMotorDatabase,
        foundation_ids: List[str],
        search_text: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        """
        Perform text search on foundations using MongoDB's $text operator.

        Returns list of foundation documents sorted by relevance.
        Raises:
            Exception: If the MongoDB text search fails.
        """
        print(f"INFO: Performing MongoDB text search for: '{search_text[:100]}...'")
        if not foundation_ids:
            print("⚠️ WARNING: No foundation IDs provided for text search. Returning empty list.")
            return []

        try:
            # Note: $text must be at top level
            query = {"$text": {"$search": search_text}, "_id": {"$in": foundation_ids}}
            
            cursor = (
                db.foundations.find(query, {"score": {"$meta": "textScore"}})
                .sort([("score", {"$meta": "textScore"})])
                .limit(limit)
            )
            
            text_results = await cursor.to_list(length=limit)

            if text_results:
                print(f"✅ MongoDB text search successful, found {len(text_results)} results.")
                return text_results
            else:
                print("⚠️ WARNING: MongoDB text search returned no results.")
                return []

        except Exception as e:
            print(f"❌ FATAL: MongoDB text search failed. Ensure a text index exists on the 'foundations' collection.")
            print(f"   Error details: {e}")
            # Raising the exception is critical to avoid silent failures.
            # A text index is required for this functionality.
            # Example Mongo Shell command to create index:
            # db.foundations.createIndex({ "long_description": "text", "short_description": "text", "name": "text" })
            raise


    async def _evaluate_with_llm(
        self, project: ProjectDescription, candidate_foundations: List[Dict[str, Any]]
    ) -> List[FoundationScore]:
        """
        Use LLM to evaluate and score candidate foundations.
        Raises:
            ValueError: If the LLM fails to evaluate one of the candidate foundations.
        """
        print(f"INFO: Evaluating {len(candidate_foundations)} candidates with LLM...")
        # Build prompt with project and foundation details
        prompt = self._create_scoring_prompt()

        # Format foundations for prompt
        foundations_text = self._format_foundations_for_prompt(candidate_foundations)
        print(f"DEBUG: Formatted prompt text length: {len(foundations_text)}")

        # Invoke LLM with structured output
        chain = prompt | self.structured_llm
        charitable_purposes_str = ", ".join(
            [p.value for p in project.charitable_purpose]
        )
        
        print("INFO: Invoking LLM for foundation evaluation...")
        parsed_output: ScoringResponse = chain.invoke(
            {
                "project_name": project.name,
                "project_description": project.description,
                "target_group": project.target_group,
                "charitable_purpose": charitable_purposes_str,
                "foundations": foundations_text,
            }
        )

        print(f"✅ LLM evaluated {len(parsed_output.evaluations)} foundations.")
        if len(parsed_output.evaluations) != len(candidate_foundations):
            print(f"⚠️ WARNING: LLM returned a different number of evaluations ({len(parsed_output.evaluations)}) than candidates provided ({len(candidate_foundations)}).")

        # Create a mapping from foundation_id to evaluation
        evaluation_map = {
            eval.foundation_id: eval for eval in parsed_output.evaluations
        }

        # Convert to FoundationScore objects, ensuring all candidates were evaluated
        scored_foundations = []
        for foundation in candidate_foundations:
            foundation_id = foundation.get("_id", foundation.get("id", ""))
            evaluation = evaluation_map.get(foundation_id)

            if evaluation:
                # Convert evaluation to FoundationScore
                scored = self._convert_to_foundation_score(foundation, evaluation)
                scored_foundations.append(scored)
            else:
                # If LLM didn't evaluate this foundation, it's a critical error
                error_msg = f"FATAL: LLM failed to return an evaluation for foundation ID: {foundation_id}. Halting process."
                print(error_msg)
                raise ValueError(error_msg)

        return scored_foundations

    def _create_scoring_prompt(self) -> ChatPromptTemplate:
        """Create the prompt template for foundation scoring."""

        system_message = """Du bist ein erfahrener Experte für die Bewertung von Stiftungsanträgen in Deutschland.
Deine Aufgabe ist es, Projekte mit passenden Stiftungen zu matchen und eine detaillierte Bewertung zu erstellen.

RICHTLINIEN:
1. Analysiere die Kompatibilität zwischen Projekt und Stiftung sorgfältig
2. Berücksichtige: gemeinnützige Zwecke, Förderbereich, Förderhöhe, Antragsprozess, vergangene Projekte
3. Vergib Match-Scores zwischen 0.0 (kein Match) und 1.0 (perfekter Match)
4. Identifiziere konkrete Fits (positive Aspekte), Mismatches (Probleme) und Fragen (Unklarheiten)
5. Sei präzise und hilfreich in deinen Bewertungen
6. Antworte auf Deutsch"""

        human_message = """Bewerte die folgenden Stiftungen für das folgende Projekt:

PROJEKT:
Name: {project_name}
Beschreibung: {project_description}
Zielgruppe: {target_group}
Gemeinnützige Zwecke: {charitable_purpose}

KANDIDATEN-STIFTUNGEN:
{foundations}

AUFGABE:
Bewerte JEDE Stiftung und gib für jede an:
1. foundation_id: Die ID der Stiftung
2. match_score: Ein Score zwischen 0.0 und 1.0 (1.0 = perfekter Match)
3. fits: Liste von positiven Aspekten (warum passt diese Stiftung zum Projekt?)
4. mismatches: Liste von potenziellen Problemen (warum könnte es nicht passen?)
5. questions: Liste von Fragen oder Unklarheiten (was sollte geklärt werden?)

WICHTIG:
- Bewerte ALLE angegebenen Stiftungen
- Sei konkret und spezifisch in deinen Bewertungen
- Der match_score sollte die Gesamtkompatibilität widerspiegeln
- Fits, Mismatches und Questions sollten hilfreiche, konkrete Informationen enthalten"""

        return ChatPromptTemplate.from_messages(
            [("system", system_message), ("human", human_message)]
        )

    def _format_foundations_for_prompt(self, foundations: List[Dict[str, Any]]) -> str:
        """Format foundation data for inclusion in the prompt."""
        formatted = []

        for i, foundation in enumerate(foundations, 1):
            foundation_id = foundation.get("_id", foundation.get("id", ""))
            name = foundation.get("name", "Unbekannt")
            long_desc = foundation.get("long_description", "")
            zwecke = ", ".join(foundation.get("gemeinnuetzige_zwecke", []))
            foerderbereich = foundation.get("foerderbereich", {})
            scope = foerderbereich.get("scope", "unbekannt")
            foerderhoehe = foundation.get("foerderhoehe", {})
            min_amount = foerderhoehe.get("min_amount", 0)
            max_amount = foerderhoehe.get("max_amount", 0)
            antragsprozess = foundation.get("antragsprozess", {})

            # Format past projects
            past_projects = foundation.get("past_projects", [])
            projects_text = ""
            if past_projects:
                projects_text = "\nVergangene Projekte:\n"
                for proj in past_projects[:3]:  # Limit to 3 for prompt size
                    projects_text += f"- {proj.get('name', 'Unbekannt')}: {proj.get('description', '')}\n"

            foundation_text = f"""
STIFTUNG {i}:
ID: {foundation_id}
Name: {name}
Gemeinnützige Zwecke: {zwecke}
Förderbereich: {scope}
Förderhöhe: {min_amount:,.0f}€ - {max_amount:,.0f}€
Beschreibung: {long_desc[:500]}{"..." if len(long_desc) > 500 else ""}
{projects_text}
"""
            formatted.append(foundation_text)

        return "\n".join(formatted)

    def _convert_to_foundation_score(
        self, foundation: Dict[str, Any], evaluation: FoundationEvaluation
    ) -> FoundationScore:
        """Convert foundation document and LLM evaluation to FoundationScore."""
        foundation_id = foundation.get("_id", foundation.get("id", "N/A"))
        print(f"DEBUG: Converting foundation {foundation_id} to FoundationScore object.")

        # Convert evaluation matches to MatchItem list
        matches = []
        for fit_text in evaluation.fits:
            matches.append(MatchItem(text=fit_text, type="fit"))
        for mismatch_text in evaluation.mismatches:
            matches.append(MatchItem(text=mismatch_text, type="mismatch"))
        for question_text in evaluation.questions:
            matches.append(MatchItem(text=question_text, type="question"))
        print(f"DEBUG: Created {len(matches)} match items for foundation {foundation_id}.")

        # Get foundation details
        zwecke = foundation.get("gemeinnuetzige_zwecke", [])
        purpose = zwecke[0] if zwecke else "Allgemeine Förderung"

        # Format funding amount
        funding_amount = format_funding_amount(foundation.get("foerderhoehe", {}))

        # Helper functions for safe data extraction
        def safe_get_dict(key: str, default: Dict[str, Any] = None) -> Dict[str, Any]:
            value = foundation.get(key)
            if value is None or not isinstance(value, dict):
                print(f"DEBUG: Key '{key}' not found or not a dict for foundation {foundation_id}. Using default.")
                return default or {}
            return value

        def safe_get_list(key: str, default: List = None) -> List:
            value = foundation.get(key)
            if value is None or not isinstance(value, list):
                print(f"DEBUG: Key '{key}' not found or not a list for foundation {foundation_id}. Using default.")
                return default or []
            return value

        # Handle foerderhoehe with category-based defaults
        foerderhoehe_raw = safe_get_dict("foerderhoehe")
        if foerderhoehe_raw:
            category = foerderhoehe_raw.get("category")
            min_amount = foerderhoehe_raw.get("min_amount")
            max_amount = foerderhoehe_raw.get("max_amount")

            if min_amount is None or max_amount is None:
                print(f"DEBUG: Applying default funding amounts for category '{category}' for foundation {foundation_id}.")
                category_lower = str(category).lower() if category else ""
                if category_lower in ["large", "großförderung", "grossfoerderung"]:
                    foerderhoehe_raw["min_amount"] = min_amount if min_amount is not None else 50000
                    foerderhoehe_raw["max_amount"] = max_amount if max_amount is not None else 200000
                elif category_lower in ["small", "kleinförderung", "kleinfoerderung"]:
                    foerderhoehe_raw["min_amount"] = min_amount if min_amount is not None else 0
                    foerderhoehe_raw["max_amount"] = max_amount if max_amount is not None else 5000
                elif category_lower in ["medium", "mittelgroße förderung", "mittelgrosse foerderung"]:
                    foerderhoehe_raw["min_amount"] = min_amount if min_amount is not None else 5000
                    foerderhoehe_raw["max_amount"] = max_amount if max_amount is not None else 50000

        score = FoundationScore(
            id=foundation_id,
            name=foundation.get("name", "Unbekannter Name"),
            logo="/hero-avatar.svg",
            purpose=purpose,
            description=foundation.get("short_description", "Keine Beschreibung verfügbar."),
            funding_amount=funding_amount,
            match_score=evaluation.match_score,
            matches=matches,
            long_description=foundation.get("long_description", ""),
            legal_form=foundation.get("legal_form", "Stiftung"),
            gemeinnuetzige_zwecke=zwecke,
            antragsprozess=safe_get_dict("antragsprozess"),
            foerderbereich=safe_get_dict("foerderbereich"),
            foerderhoehe=foerderhoehe_raw if foerderhoehe_raw else {},
            contact=safe_get_dict("contact"),
            past_projects=safe_get_list("past_projects"),
            website=foundation.get("website", ""),
        )
        print(f"✅ Successfully created FoundationScore for {foundation_id}.")
        return score



def format_funding_amount(foerderhoehe: Dict[str, Any]) -> str:
    """Format funding amount for display."""
    max_amount = foerderhoehe.get("max_amount")

    if not max_amount:
        return "Förderhöhe nicht angegeben"

    formatted = locale.format_string("%d", max_amount, grouping=True)
    return f"Bis zu {formatted} €"


# Global service instance
_scoring_service = None


def get_scoring_service() -> ScoringService:
    """Get or create the global scoring service instance."""
    global _scoring_service
    if _scoring_service is None:
        _scoring_service = ScoringService()
    return _scoring_service


async def score_foundations(
    project: ProjectDescription, limit: int = 5, db: AsyncIOMotorDatabase = None
) -> List[FoundationScore]:
    """
    Convenience function to score foundations.

    Args:
        project: The project description to match against
        limit: Maximum number of foundations to return
        db: Optional database instance

    Returns:
        List of FoundationScore objects, sorted by match score
    """
    service = get_scoring_service()
    return await service.score_foundations(project, limit, db)
