from fastapi import APIRouter
from typing import List

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_offers():
    """
    Get all offers with hardcoded data
    """
    offers = [
        {
            "OfferID": 371,
            "OfferToken": "Token 1",
            "BuyerToken": "USDC",
            "RateOfReturn": "10%",
            "OfferYield": "12%",
            "PercentDifference": "20%",
            "OfficialPrice": "$51.35",
            "AskedPrice": "$60.00",
            "PriceDifferencePercent": "16.85%",
            "Stock": 12.28838,
            "Cart": True,
            "View": True
        },
        {
            "OfferID": 371,
            "OfferToken": "Token 1",
            "BuyerToken": "USDC",
            "RateOfReturn": "10%",
            "OfferYield": "12%",
            "PercentDifference": "20%",
            "OfficialPrice": "$51.35",
            "AskedPrice": "$60.00",
            "PriceDifferencePercent": "16.85%",
            "Stock": 12.28838,
            "Cart": True,
            "View": True
        }
    ]
    
    return offers
