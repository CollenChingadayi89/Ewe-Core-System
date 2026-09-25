"""
Request logging middleware for debugging
"""
import logging

logger = logging.getLogger('django.request')

class RequestLoggingMiddleware:
    """Log all incoming requests"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request
        print(f"\n========== INCOMING REQUEST ==========")
        print(f"Method: {request.method}")
        print(f"Path: {request.path}")
        print(f"GET params: {dict(request.GET)}")

        if request.method in ['POST', 'PUT', 'PATCH']:
            print(f"Content-Type: {request.content_type}")
            # Only JSON bodies are logged: reading request.body on multipart uploads loads the
            # whole file into memory and applies DATA_UPLOAD_MAX_MEMORY_SIZE (2.5 MB) to it,
            # which rejects legitimate file uploads.
            if request.content_type == 'application/json':
                try:
                    print(f"Body (first 500 chars): {request.body[:500]}")
                except:
                    print("Body: <unable to read>")

        print(f"======================================\n")

        response = self.get_response(request)

        # Log response
        print(f"\n========== RESPONSE ==========")
        print(f"Status: {response.status_code}")
        print(f"==============================\n")

        return response
