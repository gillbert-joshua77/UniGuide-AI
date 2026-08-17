from rest_framework import serializers

from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['role', 'content', 'timestamp']


class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source='chat_messages.count', read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'message_count', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last = obj.chat_messages.order_by('-timestamp').first()
        if not last:
            return None
        content = last.content
        if len(content) > 120:
            content = content[:120] + '...'
        return {
            'role': last.role,
            'content': content,
            'timestamp': last.timestamp,
        }


class ChatSessionDetailSerializer(ChatSessionSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True, source='chat_messages')

    class Meta(ChatSessionSerializer.Meta):
        fields = ChatSessionSerializer.Meta.fields + ['messages']


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['title']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty')
        return value.strip()[:120]


class ChatRenameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['title']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty')
        return value.strip()[:120]


class ChatSendSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    session_id = serializers.UUIDField(required=False, allow_null=True, default=None)

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty')
        return value.strip()


class GuidedQuestionSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=['internship', 'hackathon', 'university'])
    answers = serializers.DictField(required=False, default=dict)
    asked_fields = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )
