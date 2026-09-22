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
            if hasattr(request, 'body'):
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
