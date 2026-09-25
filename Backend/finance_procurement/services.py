"""
Quotation document storage for procurement requests.

Quotation files are stored under randomised names in MEDIA storage and are only ever
served through the authenticated download endpoint on ProcurementRequestViewSet, never
via a public /media/ URL. The storage path of each file is set by the server; clients
cannot supply or change it.
"""
import logging
import mimetypes
import os
import uuid
from typing import Any

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

UPLOAD_DIR = 'procurement_quotations'
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
# Deliberately excludes formats a browser could execute (html, svg, js).
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'}
# Formats the browser can safely display inline; everything else is downloaded.
INLINE_CONTENT_TYPES = {'application/pdf', 'image/png', 'image/jpeg'}
# Quotation keys a client may send; all others (file metadata) are server-managed.
CLIENT_QUOTATION_KEYS = ('vendor_name', 'is_selected')


def validate_quotation_uploads(quotations: Any, files: list[UploadedFile]) -> list[dict]:
    """
    Check that each quotation has exactly one valid document, matched by position.

    Returns the quotations reduced to client-controlled keys, so any file metadata a
    client tries to send is discarded before the server attaches its own.
    """
    if not isinstance(quotations, list):
        raise ValidationError({'quotations': 'Quotations must be an array'})

    if len(files) != len(quotations):
        raise ValidationError({
            'quotation_documents': (
                f'Each quotation needs one document. Received {len(files)} document(s) '
                f'for {len(quotations)} quotation(s).'
            )
        })

    for idx, uploaded in enumerate(files, start=1):
        extension = os.path.splitext(uploaded.name)[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            allowed = ', '.join(sorted(ext.lstrip('.') for ext in ALLOWED_EXTENSIONS))
            raise ValidationError({
                'quotation_documents': f'Quotation {idx}: file type not allowed. Allowed types: {allowed}'
            })
        if uploaded.size > MAX_FILE_SIZE:
            raise ValidationError({
                'quotation_documents': f'Quotation {idx}: file exceeds the 10 MB limit'
            })

    return [
        {key: q.get(key) for key in CLIENT_QUOTATION_KEYS if key in q} if isinstance(q, dict) else q
        for q in quotations
    ]


def store_quotation_files(files: list[UploadedFile]) -> list[dict]:
    """Save uploaded files under random names and return their metadata, in order."""
    stored = []
    try:
        for uploaded in files:
            extension = os.path.splitext(uploaded.name)[1].lower()
            path = f'{UPLOAD_DIR}/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{extension}'
            saved_path = default_storage.save(path, uploaded)
            stored.append({
                'file_path': saved_path,
                'file_name': os.path.basename(uploaded.name)[:255],
                'file_size': uploaded.size,
                'content_type': mimetypes.guess_type(saved_path)[0] or 'application/octet-stream',
            })
    except Exception:
        delete_stored_files(stored)
        raise
    return stored


def delete_stored_files(stored: list[dict]) -> None:
    """Best-effort cleanup of files saved for a request that was not created."""
    for meta in stored:
        try:
            default_storage.delete(meta['file_path'])
        except Exception:
            logger.warning('Failed to delete orphaned quotation file %s', meta['file_path'], exc_info=True)


def get_quotation_document_path(quotation: Any) -> str | None:
    """
    Return the storage path for a quotation's document, or None if there is no file.

    Paths outside UPLOAD_DIR are rejected so a tampered record can never be used to
    read other files from media storage.
    """
    if not isinstance(quotation, dict):
        return None
    path = quotation.get('file_path')
    if not isinstance(path, str) or not path.startswith(f'{UPLOAD_DIR}/') or '..' in path:
        return None
    return path
