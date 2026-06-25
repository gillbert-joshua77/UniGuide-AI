from rest_framework import serializers


class MessageSerializer(serializers.Serializer):
    role    = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField()


class ChatRequestSerializer(serializers.Serializer):
    message  = serializers.CharField(required=True)
    messages = MessageSerializer(many=True, required=False, default=[])

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty')
        return value