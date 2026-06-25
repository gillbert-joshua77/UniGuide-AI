from django.contrib.auth.models import BaseUserManager   # Base class to create custom user manager
from django.core.exceptions import ValidationError       # Used to raise validation errors
from django.core.validators import validate_email        # Built-in Django email validator
from django.utils.translation import gettext_lazy as _   # Used for translation (i18n support)

class UserMangers(BaseUserManager):   # Custom user manager class (note: name has a typo but not changing)

  def email_validator(self ,email):   # Function to validate email format
    try: 
      validate_email(email)           # Check if email is valid using Django validator
    except:
      raise ValidationError(_('please Enter a valid email address'))  # Raise error if invalid
    
  def create_user(self , email ,first_name , last_name , password ,**extra_fields):  # Method to create normal user
    if email:
      email = self.normalize_email(email)   # Normalize email (lowercase domain etc.)
      self.email_validator(email)           # Validate email using custom method
    else:
      raise ValidationError(_('an Email address is required'))  # Error if email missing
    
    if not first_name:
      raise ValidationError(_('First Name is required'))  # Ensure first name exists
    if not last_name:
      raise ValidationError(_('Last Name is required'))   # Ensure last name exists

    # Create user instance using model linked to this manager
    user = self.model(email = email  , first_name= first_name  , last_name = last_name , **extra_fields)

    user.set_password(password)  # Hash the password (important for security)

    user.save(using = self._db)  # Save user to database using current DB

    return user  # Return created user
  
  def create_superuser(self , email ,first_name , last_name , password ,**extra_fields):  # Method to create admin user
    extra_fields.setdefault("is_staff", True)        # Set staff access by default
    extra_fields.setdefault("is_superuser", True)    # Set superuser privileges
    extra_fields.setdefault("is_verified", True)     # Custom field (probably for email verification)

    # Check if is_staff is True, else raise error
    if extra_fields.get('is_staff', ) is not True : 
      raise ValidationError(_("is staff must be for admin user"))
    
    # Check if is_superuser is True, else raise error
    if extra_fields.get("is_superuser") is not True:
      raise ValidationError(_("is superuser must be for admin user"))
    
    # Create user using create_user method
    user = self.create_user(
      email ,first_name , last_name , password ,**extra_fields
    )

    user.save(using = self._db)  # Save admin user to database again

    return user   # Return created superuser