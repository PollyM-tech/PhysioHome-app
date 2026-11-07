from rest_framework.throttling import UserRateThrottle

class MessageWriteThrottle(UserRateThrottle):
    scope = "message_write"

    def allow_request(self, request, view):
        return True if request.method == "GET" else super().allow_request(request, view)

class PatientWriteThrottle(UserRateThrottle):
    scope = "patient_write"

    def allow_request(self, request, view):
        return True if request.method == "GET" else super().allow_request(request, view)
