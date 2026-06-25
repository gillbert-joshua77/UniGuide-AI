from django.db import models
import uuid

class ChatSession(models.Model):
    # Generates a unique ID for each new chat window
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='chat_messages')
    role = models.CharField(max_length=15) # Will store 'user' or 'model'
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp'] # Ensures messages always load in the correct order