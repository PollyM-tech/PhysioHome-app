import re

from django.core.exceptions import ValidationError


class PasswordCompositionValidator:
    def validate(self, password, user=None):
        if len(password) > 128:
            raise ValidationError("Use no more than 128 characters.", code="password_too_long")
        if not (re.search(r"[A-Z]", password) and re.search(r"[0-9]", password) and re.search(r"[^A-Za-z0-9]", password)):
            raise ValidationError(self.get_help_text(), code="password_composition")

    def get_help_text(self):
        return "Include an uppercase letter, a number, and a special character."
