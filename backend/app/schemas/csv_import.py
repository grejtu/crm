from pydantic import BaseModel
from typing import List, Dict, Optional


class CSVPreviewResponse(BaseModel):
    columns: List[str]
    suggested_mapping: Dict[str, str]
    preview_rows: List[List[str]]


class CSVMappingRequest(BaseModel):
    mapping: Dict[str, str]


class CSVError(BaseModel):
    row: int
    error: str


class CSVImportResponse(BaseModel):
    success_count: int
    skipped_count: int
    errors: List[CSVError]
