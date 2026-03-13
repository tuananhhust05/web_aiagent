"""
LinkedIn enrichment service using Apify actor to scrape LinkedIn profiles,
then AI (Groq/Llama) to generate enriched prospect intelligence.
"""

import httpx
import json
import logging
import re
from typing import Optional, Dict, Any, List

from app.core.config import settings

logger = logging.getLogger(__name__)


class LinkedInEnrichmentService:
    """Scrape LinkedIn profile via Apify and generate AI-powered prospect intelligence."""

    def __init__(self):
        self.api_token = settings.APIFY_API_TOKEN
        self.actor_id = settings.APIFY_ACTOR_ID

    @property
    def configured(self) -> bool:
        return bool(self.api_token and self.actor_id)

    async def scrape_linkedin_profile(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        """
        Call Apify actor to scrape a LinkedIn profile.
        Returns the first item from the dataset, or None on failure.
        """
        if not self.configured:
            logger.warning("[LINKEDIN-ENRICH] Apify not configured (APIFY_API_TOKEN / APIFY_ACTOR_ID)")
            return None

        url = (
            f"https://api.apify.com/v2/acts/{self.actor_id}"
            f"/run-sync-get-dataset-items?token={self.api_token}"
        )

        payload = {"profileUrls": [linkedin_url]}

        logger.info(f"[LINKEDIN-ENRICH] Scraping LinkedIn profile: {linkedin_url}")

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(url, json=payload)

                if response.status_code not in (200, 201):
                    logger.error(
                        f"[LINKEDIN-ENRICH] Apify returned {response.status_code}: {response.text[:500]}"
                    )
                    return None

                data = response.json()

                if not data or not isinstance(data, list) or len(data) == 0:
                    logger.warning("[LINKEDIN-ENRICH] Apify returned empty dataset")
                    return None

                profile = data[0]
                logger.info(
                    f"[LINKEDIN-ENRICH] Successfully scraped profile: "
                    f"{profile.get('fullName', 'unknown')}"
                )
                return profile

        except httpx.TimeoutException:
            logger.error(f"[LINKEDIN-ENRICH] Timeout scraping {linkedin_url}")
            return None
        except Exception as e:
            logger.error(f"[LINKEDIN-ENRICH] Error scraping {linkedin_url}: {e}")
            return None

    def extract_key_fields(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract the essential fields from an Apify LinkedIn profile response.
        Keep it lean – we only need what's useful for the enriched card + AI prompt.
        """
        return {
            "linkedinUrl": profile.get("linkedinUrl") or profile.get("linkedinPublicUrl") or "",
            "firstName": profile.get("firstName", ""),
            "lastName": profile.get("lastName", ""),
            "fullName": profile.get("fullName", ""),
            "headline": profile.get("headline", ""),
            "jobTitle": profile.get("jobTitle", ""),
            "companyName": profile.get("companyName", ""),
            "companyIndustry": profile.get("companyIndustry", ""),
            "companySize": profile.get("companySize", ""),
            "companyWebsite": profile.get("companyWebsite", ""),
            "location": profile.get("addressWithCountry", ""),
            "about": (profile.get("about") or "")[:2000],
            "connections": profile.get("connections", 0),
            "followers": profile.get("followers", 0),
            "profilePic": profile.get("profilePicHighQuality") or profile.get("profilePic", ""),
            "skills": [s.get("title", "") for s in (profile.get("skills") or [])[:15]],
            "experiences": [
                {
                    "title": exp.get("title", ""),
                    "companyName": exp.get("companyName", ""),
                    "startedOn": exp.get("jobStartedOn", ""),
                    "endedOn": exp.get("jobEndedOn"),
                    "stillWorking": exp.get("jobStillWorking", False),
                    "duration": exp.get("currentJobDuration") if exp.get("jobStillWorking") else None,
                }
                for exp in (profile.get("experiences") or [])[:5]
            ],
            "educations": [
                {
                    "school": edu.get("title", ""),
                    "degree": edu.get("subtitle", ""),
                }
                for edu in (profile.get("educations") or [])[:3]
            ],
            "totalExperienceYears": profile.get("totalExperienceYears", 0),
        }

    async def generate_prospect_intelligence(
        self,
        linkedin_data: Dict[str, Any],
        company_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Use AI (Groq/Llama) to generate enriched prospect intelligence from LinkedIn data.
        Returns a dict matching the EnrichedProfileData interface on the frontend.
        """
        if not settings.GROQ_API_KEY:
            logger.warning("[LINKEDIN-ENRICH] Missing GROQ_API_KEY, returning raw data only")
            return self._fallback_intelligence(linkedin_data)

        # Build context for AI
        skills_text = ", ".join(linkedin_data.get("skills", [])[:10])
        experiences_text = ""
        for exp in linkedin_data.get("experiences", [])[:3]:
            status = "(current)" if exp.get("stillWorking") else ""
            experiences_text += f"- {exp.get('title', '')} at {exp.get('companyName', '')} {status}\n"

        company_context = ""
        if company_info:
            company_context = f"""
Company Info:
- Industry: {company_info.get('industry', 'Unknown')}
- Size: {company_info.get('size_revenue', 'Unknown')}
- Description: {company_info.get('description', 'N/A')[:300]}
"""

        prompt = f"""Analyze this prospect's LinkedIn profile and generate sales intelligence.

Prospect: {linkedin_data.get('fullName', 'Unknown')}
Title: {linkedin_data.get('headline', 'Unknown')}
Current Role: {linkedin_data.get('jobTitle', 'Unknown')} at {linkedin_data.get('companyName', 'Unknown')}
Location: {linkedin_data.get('location', 'Unknown')}
Total Experience: {linkedin_data.get('totalExperienceYears', 0)} years
Skills: {skills_text}

Work History:
{experiences_text}

About:
{(linkedin_data.get('about', '') or '')[:800]}
{company_context}

Based on this profile, provide a JSON response with:
1. disc_type: one of "DRIVER", "INFLUENCER", "STEADY", "ANALYST", "GO-GETTER", "ENTHUSIAST", "COUNSELOR", "STRATEGIST"
2. disc_label: short DISC label (e.g. "D", "I", "S", "C", "Di", "Id", "Si", "Cs")
3. disc_traits: array of 5 personality traits (single words)
4. compatibility_level: "High", "Medium", or "Low" 
5. compatibility_percentage: number 50-95
6. communication_dos: array of 3 objects with "action" and "example" keys (sales communication tips)
7. communication_donts: array of 3 objects with "action" and "example" keys (things to avoid)
8. personality_archetype: string describing their personality archetype
9. personality_traits: array of 5-6 objects with "name" and "description" keys
10. interests: array of 3-5 professional interests based on their profile
11. languages: array of languages they likely speak based on location/profile

Return ONLY valid JSON:
{{"disc_type": "...", "disc_label": "...", "disc_traits": [...], "compatibility_level": "...", "compatibility_percentage": ..., "communication_dos": [...], "communication_donts": [...], "personality_archetype": "...", "personality_traits": [...], "interests": [...], "languages": [...]}}"""

        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a sales intelligence analyst. Analyze LinkedIn profiles to generate DISC personality assessments and communication strategies for sales teams. Return ONLY valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.4,
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            content = (
                (((data or {}).get("choices") or [{}])[0].get("message") or {}).get(
                    "content"
                )
                or ""
            )
            content = content.strip()

            # Clean up potential markdown
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(
                    lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
                )
            content = content.strip()

            try:
                ai_result = json.loads(content)
            except json.JSONDecodeError:
                start = content.find("{")
                end = content.rfind("}")
                if start != -1 and end != -1 and end > start:
                    ai_result = json.loads(content[start : end + 1])
                else:
                    raise

            return self._build_enriched_profile(linkedin_data, ai_result)

        except Exception as e:
            logger.error(f"[LINKEDIN-ENRICH] AI enrichment error: {e}")
            return self._fallback_intelligence(linkedin_data)

    def _build_enriched_profile(
        self, linkedin_data: Dict[str, Any], ai_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Combine LinkedIn data + AI analysis into the final enriched profile structure."""

        # Determine current tenure
        current_exp = next(
            (e for e in linkedin_data.get("experiences", []) if e.get("stillWorking")),
            None,
        )
        tenure = current_exp.get("duration", "Unknown") if current_exp else "Unknown"

        disc_type = ai_result.get("disc_type", "INFLUENCER")
        disc_label = ai_result.get("disc_label", "I")

        # Map DISC type to color
        disc_colors = {
            "DRIVER": "bg-red-500",
            "INFLUENCER": "bg-yellow-500",
            "STEADY": "bg-blue-500",
            "ANALYST": "bg-green-500",
            "GO-GETTER": "bg-amber-500",
            "ENTHUSIAST": "bg-green-500",
            "COUNSELOR": "bg-blue-500",
            "STRATEGIST": "bg-purple-500",
        }

        return {
            "name": linkedin_data.get("fullName", "Unknown"),
            "title": linkedin_data.get("headline", ""),
            "company": linkedin_data.get("companyName", ""),
            "tenure": tenure,
            "location": linkedin_data.get("location", ""),
            "linkedinUrl": linkedin_data.get("linkedinUrl", ""),
            "profilePic": linkedin_data.get("profilePic", ""),
            "about": linkedin_data.get("about", ""),
            "languages": ai_result.get("languages", ["English"]),
            "interests": ai_result.get("interests", []),
            "disc": {
                "type": disc_type,
                "label": disc_label,
                "color": disc_colors.get(disc_type, "bg-blue-500"),
                "traits": ai_result.get("disc_traits", []),
            },
            "compatibility": {
                "level": ai_result.get("compatibility_level", "Medium"),
                "percentage": ai_result.get("compatibility_percentage", 65),
            },
            "communicationStrategy": {
                "dos": ai_result.get("communication_dos", []),
                "donts": ai_result.get("communication_donts", []),
            },
            "personalityTraits": {
                "archetype": ai_result.get("personality_archetype", "Unknown"),
                "traits": ai_result.get("personality_traits", []),
            },
        }

    def _fallback_intelligence(self, linkedin_data: Dict[str, Any]) -> Dict[str, Any]:
        """Return a basic enriched profile when AI is unavailable."""
        current_exp = next(
            (e for e in linkedin_data.get("experiences", []) if e.get("stillWorking")),
            None,
        )
        tenure = current_exp.get("duration", "Unknown") if current_exp else "Unknown"

        return {
            "name": linkedin_data.get("fullName", "Unknown"),
            "title": linkedin_data.get("headline", ""),
            "company": linkedin_data.get("companyName", ""),
            "tenure": tenure,
            "location": linkedin_data.get("location", ""),
            "linkedinUrl": linkedin_data.get("linkedinUrl", ""),
            "profilePic": linkedin_data.get("profilePic", ""),
            "about": linkedin_data.get("about", ""),
            "languages": ["English"],
            "interests": linkedin_data.get("skills", [])[:5],
            "disc": {
                "type": "INFLUENCER",
                "label": "I",
                "color": "bg-yellow-500",
                "traits": ["Professional", "Experienced", "Skilled", "Connected", "Active"],
            },
            "compatibility": {"level": "Medium", "percentage": 65},
            "communicationStrategy": {
                "dos": [
                    {"action": "Be direct and professional", "example": '"Let me share how this could help your team."'},
                    {"action": "Reference their experience", "example": '"Given your background in X..."'},
                    {"action": "Focus on value proposition", "example": '"Here\'s the ROI you can expect."'},
                ],
                "donts": [
                    {"action": "Be overly casual", "example": '"Hey buddy, check this out!"'},
                    {"action": "Ignore their expertise", "example": '"You probably don\'t know about..."'},
                    {"action": "Rush the conversation", "example": '"Sign today for a discount."'},
                ],
            },
            "personalityTraits": {
                "archetype": "Professional",
                "traits": [
                    {"name": "Experienced", "description": "has significant industry experience"},
                    {"name": "Connected", "description": "maintains a professional network"},
                    {"name": "Skilled", "description": "possesses relevant technical skills"},
                ],
            },
        }


# Singleton
_linkedin_service: Optional[LinkedInEnrichmentService] = None


def get_linkedin_enrichment_service() -> LinkedInEnrichmentService:
    """Get or create singleton LinkedIn enrichment service."""
    global _linkedin_service
    if _linkedin_service is None:
        _linkedin_service = LinkedInEnrichmentService()
    return _linkedin_service
