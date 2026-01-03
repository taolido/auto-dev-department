from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')  # パスワードは含めない

    def validate_email(self, value: str) -> str:
        """
        メールアドレスの重複チェック
        """
        normalized_email = value.lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("このメールアドレスは既に登録されています。")
        return value

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data: dict) -> User:
        """
        ユーザー作成時にパスワードをハッシュ化する
        """
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email')  # 更新可能なフィールドを定義
        read_only_fields = ('username',)  # usernameは更新不可にする

    def update(self, instance: User, validated_data: dict) -> User:
        """
        ユーザー情報を更新する
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance